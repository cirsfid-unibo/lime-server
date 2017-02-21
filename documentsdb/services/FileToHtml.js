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


// This endpoint is used to transfor documents into HTML for importing in LIME.

var express = require('express'),
    fileUpload = require('express-fileupload'),
    Boom = require('boom'),
    path = require('path'),
    lngDetector = new (require('languagedetect')),
    striptags = require('striptags'),
    langs = require('langs');

var FileToHtml = require('../converters/FileToHtml.js'),
    XsltTransform = require('../../xml/xml/XsltTransform.js'),
    FileCache = require('../../utils/FileCache.js');

var clearHtmlPath = path.resolve(__dirname, '..', 'xslt/CleanConvertedHtml.xsl');

var allowedUploads = [
    'text/html',
    'text/xml',
    'application/xml',
    'text/plain',
    'text/rtf',
    'application/msword',
    'application/pdf',
    'application/vnd.oasis.opendocument.text',
    'application/rtf',
    'application/vnd.ms-office',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
var router = express.Router();

router.use(fileUpload());

router.post('/', function (req, res, next) {
    if (!req.files) {
        next(Boom.badRequest('No files were uploaded!'));
    }
    var file = req.files.file;
    if (!isAllowed(file.mimetype)) {
        next(Boom.badRequest(file.mimetype+' files are not supported!'));
    }
    if (isXml(file.mimetype)) {
        FileCache.getFilePath(req.body.transformFile, function(err, xslt) {
            if (err) next(Boom.badRequest(err));
            handleXmlFile(file, res, xslt);
        })
    } else {
        handleFile(file, res);
    }
});

function isAllowed(mime) {
    return allowedUploads.indexOf(mime) !== -1;
}

function isXml(mime) {
    return mime === 'text/xml' || mime === 'application/xml';
}

function handleXmlFile(file, res, xslt) {
    aknToHtml(file.data, xslt, function(html, xml) {
        var result = getResultObject(html);
        result.xml = xml;
        result.marked = true;
        res.json(result);
    });
}

function aknToHtml(data, xslt, cb) {
    var xsltTransformer = new XsltTransform({ xslt: xslt });
    xsltTransformer.end(data);
    var transformedXml = '';
    xsltTransformer.on('data', function(chunk) {
        transformedXml += chunk;
    });
    xsltTransformer.on('end', function() {
        cb(transformedXml, xsltTransformer.xmlString);
    });
}

function handleFile(file, res) {
    var converter = new FileToHtml();
    converter.end(file.data);
    cleanHtml(converter, function(html) {
        res.json(getResultObject(html));
    });
}

function cleanHtml(input, cb) {
    var xsltTransformer = new XsltTransform({ xslt: clearHtmlPath });
    input.pipe(xsltTransformer);
    var transformedXml = '';
    xsltTransformer.on('data', function(chunk) {
        transformedXml += chunk;
    });
    xsltTransformer.on('end', function() {
        transformedXml = transformedXml
                            .replace('&#160', ' ')
                            .replace('&#xa0', ' ')
                            .replace('&nbsp', ' ')
                            .replace(' ', ' ');
        cb(transformedXml);
    });
}

function getResultObject(html) {
    return {
        success: html.length > 0,
        html: html,
        language: detectLanguage(html)
    };
}

function detectLanguage(htmlString) {
    var lang = lngDetector.detect(striptags(htmlString), 1)[0];
    var capitalizedName = lang && lang[0][0].toUpperCase()+ lang[0].slice(1);
    lang = langs.where("name", capitalizedName);
    return lang && lang['2'];
}

exports.router = router;
