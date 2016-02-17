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


// This endpoint is used to export documents, this is useful for sharing them
// and avoid authentication problems.

// Example usage:
// POST, with auth localhost:9006/documentsdb/Export?document=aasd@gmail.com/2015/new/new
// -> { url: 'localhost:9006/documentsdb/Export/hmprs5rk9' }
// GET localhost:9006/documentsdb/Export/hmprs5rk9
// -> <xml>...</xml>

var express = require('express'),
    path = require('path'),
    passport = require('passport'),
    PassThrough = require('stream').PassThrough,
    Boom = require('boom'),
    backend_fs = require('../utils/backend_fs'),
    isAllowed = require('./Documents').isAllowed;

var router = express.Router();

router.use(passport.initialize());


function getTime() { return (new Date()).getTime(); }
function minutes(n) { return 1000 * 60 * n; }

// Export documents for a maximum of 30 minutes;
var exportedDocuments = {},
    maxMemorizationTime = minutes(30);
// Regularly check for documents to delete
setInterval(function () {
    var currentTime = getTime();
    Object.keys(exportedDocuments).forEach(function (key) {
        if (exportedDocuments[key].time + maxMemorizationTime > currentTime ) {
            console.log('Export: deleting ' + key + ' after ' +
              (exportedDocuments[key].time - currentTime)/1000/60 + ' minutes');
            delete exportedDocuments[key];
        }
    });
}, minutes(10));

function addDocument(url, text) {
    var time = getTime();
    exportedDocuments[url] = {
        time: time,
        text: text
    };
    console.log('Export: adding ' + url + ' at ' + time);
}

function getDocument(url) {
    if (url in exportedDocuments)
        return exportedDocuments[url].text;
    else return null;
}

router.post('/',
            passport.authenticate('basic', { session: false }),
            function (req, res, next) {
    if (!req.query.url)
        return next(Boom.badRequest('Required parameter `url` is missing'));
    if (!isAllowed(req.user, req.query.url))
        return next(Boom.unauthorized());
    var dir = path.dirname(req.query.url);
        file = path.basename(req.query.url);

    var stream = new PassThrough();
    backend_fs.getFile(stream, dir, file, function (err) {
        if (err == 404)
            next(Boom.badRequest('File does not exist'));
        else if (err) next(err);
    });
    var data = [];
    var name = Math.random().toString(36).substring(7);
    stream.setEncoding('utf8');
    stream.on('data', function(d) { data.push(d); });
    stream.on('end', function() {
        var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        var toReplace = req.url.substring(1);
        var newUrl = fullUrl.replace(toReplace, '/' + name);
        addDocument(name, data.join(''));
        res.json({
            url: newUrl
        });
    });
});

router.get('/:file', function (req, res, next) {
    var file = getDocument(req.params.file);
    if (file) res.send(file);
    else next(Boom.notFound());
});

exports.router = router;
