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

var express = require('express'),
    path = require('path'),
    PassThrough = require('stream').PassThrough,
    passport = require('passport'),
    Boom = require('boom');

var db = require('../utils/mongodb.js'),
    Users = require('./Users.js'),
    backend_exist = require('../utils/backend_exist'),
    backend_fs = require('../utils/backend_fs'),
    DocToXml = require('../converters/DocToXml');

var router = express.Router();

router.use(passport.initialize());
router.use(passport.authenticate('basic', { session: false }));

// Parse path and file parameters.
router.use(function (req, res, next) {
    if (req.path[req.path.length-1] == ('/')) {
        req.dir = req.path;
        console.log('DIR', req.method, req.dir);
    } else {
        req.dir = path.dirname(req.path);
        req.file = path.basename(req.path);
        console.log('FILE', req.method, req.dir, req.file);
    }
    next();
});

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

    if (req.file.match(/.docx?$/) && req.headers.accept == 'text/html') {
        var doc2xml = new DocToXml();
        backend_fs.getFile(doc2xml, req.dir, req.file, function (err) {
            if (err == 404) res.status(404).end();
            else if (err) next(err);
        });
        doc2xml.pipe(res);
    } else {
        backend_fs.getFile(res, req.dir, req.file, function (err) {
            if (err == 404) res.status(404).end();
            else if (err) next(err);
        });
    }
});

// List directory
// Es. GET /Documents/pippo@gmail.com/examples/it/doc/
router.get('*', function (req, res, next) {
    backend_fs.getDir(req.dir, function (err, files) {
        if (err) next(err);
        else res.json(files).end();
    });
});

// Update/create a file
// Es. PUT /Documents/pippo@gmail.com/examples/it/doc/file.akn
router.put('*', function (req, res, next) {
    // Thank you Node for your streams, and sorry for killing your performance
    // with our requirements.
    var stream1 = new PassThrough(),
        stream2 = new PassThrough();

    backend_fs.putFile(stream1, req.dir, req.file, function (err) {
        if (err) next(err);
        res.end();
    });

    backend_exist.putFile(stream2, req.dir, req.file, function (err) {
        // Ehm.. Who cares about Exist?
        if (err) console.warn(err);
    });

    req.pipe(stream1);
    req.pipe(stream2);
});

exports.router = router;
