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

// This is a generic XSLT tranformation service, which support multiple
// transformation files to be apply in sequence.

var express = require('express'),
    Boom = require('boom'),
    stream = require('stream'),
    async = require('async'),
    fs = require('fs'),
    xmldom = require('xmldom'),
    path = require('path');

var XsltTransform = require('../../xml/xml/XsltTransform.js'),
    FileCache = require('../../utils/FileCache.js');

var router = express.Router();

router.post('/', function (req, res, next) {
    var xmlSource = req.body.source;
    var xsltFiles = req.body.transformFiles;
    if (!xmlSource) {
        next(Boom.badRequest('No input to transform was passed!'));
    }
    if (!xsltFiles || xsltFiles.length === 0) {
        next(Boom.badRequest('No xslt files to apply was passed!'));
    }
    var includeFiles = req.body.includeFiles;
    var onError= function (err){
        next(Boom.badRequest(err.message));
    };
    if (includeFiles && includeFiles.length) {
        getXsltPaths(includeFiles, function (includePaths) {
            initTransform(xmlSource, xsltFiles, res, includePaths, onError);
        });
    } else
        initTransform(xmlSource, xsltFiles, res, [], onError);

});

function initTransform(xmlSource, xsltFiles, res, includePaths, onError) {

    var iteratePaths = function (xsltPaths) {
        var input, output;
        xsltPaths.forEach(function (xsltPath, index, arr) {
            if (index === 0) {
                input = new stream.PassThrough();
                input.end(xmlSource);
            } else {
                input = output;
            }
            if (index === arr.length - 1) {
                output = res;
            } else {
                output = new stream.PassThrough();
            }
            tranform(input, output, xsltPath, onError);
        });
    }

    getXsltPaths(xsltFiles, function (xsltPaths) {
        if (includePaths && includePaths.length > 0) {
            getXsltIncludingPath(xsltPaths, includePaths, function (xsltPaths) {
                iteratePaths(xsltPaths);
            });
        } else {
            iteratePaths(xsltPaths);
        }
    });
}

function getXsltPaths(xsltFiles, cb) {
    async.mapSeries(xsltFiles, FileCache.getFilePath, function (err, xsltPaths) {
        xsltPaths = xsltPaths.filter(function (url) {
            return url && url.length > 0;
        });
        cb(xsltPaths);
    });
}

function getXsltIncludingPath(xsltPaths, includePaths, cb) {
    async.mapSeries(xsltPaths, includeXslt.bind(this, includePaths), function (err, xsltPaths) {
        xsltPaths = xsltPaths.filter(function (url) {
            return url && url.length > 0;
        });
        cb(xsltPaths);
    });
}

function tranform(input, output, xslt, onError) {
    var xsltTransformer = new XsltTransform({ xslt: xslt });
    xsltTransformer.on('error', onError);
    input.pipe(xsltTransformer)
    xsltTransformer.pipe(output)

}

// Includes xslt files inside another xslt
function includeXslt(includePaths, xsltPath, cb) {
    var includePath = function (dom, xsltPath) {
        var include = dom.createElementNS('http://www.w3.org/1999/XSL/Transform', 'xsl:include');
        include.setAttribute('href', path.basename(xsltPath));
        dom.documentElement.appendChild(include);
    }
    fs.readFile(xsltPath, 'utf8', function (err, xslString) {
        if (err) return cb(err);
        var dom = new xmldom.DOMParser().parseFromString(xslString, 'text/xml');
        includePaths.forEach(includePath.bind(this, dom));
        xslString = new xmldom.XMLSerializer().serializeToString(dom);
        // It's important to write the result to a new file because
        // the initial xslt can be used without the included xslt paths
        FileCache.saveToTmpFile(xslString, function (newPath) {
            cb(null, newPath);
        });
    });
}

exports.router = router;
