
/*
 * Copyright (c) 2014 - Copyright holders CIRSFID and Department of
 * Computer Science and Engineering of the University of Bologna
 *
 * Authors:
 * Monica Palmirani – CIRSFID of the University of Bologna
 * Fabio Vitali – Department of Computer Science and Engineering of the University of Bologna
 * Luca Cervone – CIRSFID of the University of Bologna
 *
 * Permission is hereby granted to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The Software can be used by anyone for purposes without commercial gain,
 * including scientific, individual, and charity purposes. If it is used
 * for purposes having commercial gains, an agreement with the copyright
 * holders is required. The above copyright notice and this permission
 * notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * Except as contained in this notice, the name(s) of the above copyright
 * holders and authors shall not be used in advertising or otherwise to
 * promote the sale, use or other dealings in this Software without prior
 * written authorization.
 *
 * The end-user documentation included with the redistribution, if any,
 * must include the following acknowledgment: "This product includes
 * software developed by University of Bologna (CIRSFID and Department of
 * Computer Science and Engineering) and its authors (Monica Palmirani,
 * Fabio Vitali, Luca Cervone)", in the same place and form as other
 * third-party acknowledgments. Alternatively, this acknowledgment may
 * appear in the software itself, in the same form and location as other
 * such third-party acknowledgments.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// Documents endpoint.
// - Get file
// - Put file
// - Get dir
// - Multiple possible backends: we read from the main one, but we write to both
// - Permissions check si done here

var express = require('express'),
    path = require('path'),
    PassThrough = require('stream').PassThrough,
    passport = require('passport'),
    Boom = require('boom');

var db = require('../utils/mongodb.js'),
    secondary_backend = require('../utils/backend_exist'),
    main_backend = require('../utils/backend_fs'),
    DocToXml = require('../converters/DocToXml'),
    AknToEpub = require('../converters/AknToEpub'),
    AknToPdf = require('../converters/AknToPdf');

// Swap backends
if (require('../config.json').existIsMainBackend) {
    main_backend = [secondary_backend, secondary_backend = main_backend][0]
}

var router = express.Router();

router.use(passport.initialize());
router.use(passport.authenticate('basic', { session: false }));

// Parse path and file parameters.
router.use(function (req, res, next) {
    var reqPath = path.normalize(req.path).replace(/\\/g, '/')
                        .split('/').map(decodeURIComponent).join('/');
    // TODO: to this inside fs backend
    // var reqPath = req.path.replace(/%20/g, ' ')
    //                       .replace(/:/g, '%3A');
    if (reqPath[reqPath.length-1] == ('/')) {
        req.dir = reqPath;
        console.log('DIR', req.method, req.dir);
    } else {
        req.dir = path.dirname(reqPath);
        req.file = path.basename(reqPath);
        console.log('FILE', req.method, req.dir, req.file);
    }
    next();
});

router.use(require('../utils/extensionMiddleware.js'));

// Check permissions
router.use(function (req, res, next) {
    if (!isAllowed(req.user, req.path))
        return res.status(401).end();
    else next();
});

function isAllowed(user, path) {
    if (!user) return false;
    if (user instanceof Error) return false;
    var allowedPaths = user.properties.folders;
    return allowedPaths.filter(function (allowedPath) {
        return path.indexOf(allowedPath) === 0;
    }).length > 0;
}

// Get file
// Es. GET /Documents/pippo@gmail.com/examples/it/doc/file.akn
router.get('*', function (req, res, next) {
    if (!req.file) return next();

    var getConvertedFile = function(converter, file) {
        main_backend.getFile(converter, req.dir, file, function (err) {
            if (err == 404) res.status(404).end();
            else if (err) next(err);
        });
        converter.pipe(res);
    }

    if (req.extension == 'doc' && req.headers.accept == 'text/html') {
        getConvertedFile(new DocToXml(), req.file);
    } else if (req.extension == 'epub' && req.headers.accept == 'application/epub+zip') {
        getConvertedFile(new AknToEpub(), req.fileNoExtension);
    } else if (req.extension == 'pdf' && req.headers.accept == 'application/pdf') {
        getConvertedFile(new AknToPdf(), req.fileNoExtension);
    } else {
        main_backend.getFile(res, req.dir, req.file, function (err) {
            if (err == 404) res.status(404).end();
            else if (err) next(err);
        });
    }
});

// List directory
// Es. GET /Documents/pippo@gmail.com/examples/it/doc/
router.get('*', function (req, res, next) {
    main_backend.getDir(req.dir, function (err, files) {
        if (err) return next(err);
        // TODO: to this inside fs backend
        // files = files.map(function (file) { return file.replace(/%3A/g, ':')});
        res.json(files).end();
    });
});

// Update/create a file
// Es. PUT /Documents/pippo@gmail.com/examples/it/doc/file.akn
router.put('*', function (req, res, next) {
    // Thank you Node for your streams, and sorry for killing your performance
    // with our requirements.
    var stream1 = new PassThrough(),
        stream2 = new PassThrough();

    main_backend.putFile(stream1, req.dir, req.file, function (err) {
        if (err) next(err);
        res.end();
    });

    secondary_backend.putFile(stream2, req.dir, req.file, function (err) {
        // Ehm.. Who cares about Exist?
        if (err) console.warn(err);
    });

    req.pipe(stream1);
    req.pipe(stream2);
});

exports.router = router;
exports.isAllowed = isAllowed;
