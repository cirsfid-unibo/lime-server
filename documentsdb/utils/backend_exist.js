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

var http = require('http'),
    VError = require('verror'),
    sax = require('sax'),
    basename = require('path').basename,
    R = require('ramda'),
    deleteEmptyCollections = require('../exist/existdb/delete_empty_collections');

var config = require('../config.json').existdb;


// Call callback with err or list of files inside dir.
exports.getDir = function (path, callback) {
    var resource = encode(config.rest + config.baseCollection + path);
    console.log('GET DIR', resource);
    http.get({
        host: config.host,
        port: config.port,
        auth: config.auth,
        path: resource
    }, function (res) {
        if(res.statusCode == 404) return callback(null, []);

        // Convert Exist format to an array of file/dir names.
        var saxStream = sax.createStream(false, {}),
            fileList = [];
        saxStream.on("opentag", function (tag) {
            var name = tag.attributes.NAME,
                isDir = (tag.name == 'EXIST:COLLECTION'),
                isFile = (tag.name == 'EXIST:RESOURCE');
            if(isDir || isFile)
                fileList.push(path + basename(name) + (isDir ? '/' : ''));
        });
        saxStream.on('error', function (err) {
            res.unpipe(output);
            callback(new VError(err, 'Exist error getting file list'));
        });
        saxStream.on('end', function () {
            fileList.shift(); // Remove our collection name
            console.log('filelist', fileList);
            if (res.statusCode != 200)
                callback(new Error('Eist GET DIR request has status code ' + res.statusCode));
            else callback(undefined, fileList.map(decode_ls));
        });
        res.pipe(saxStream);
    });
};

// Read file from path and write it to output stream.
// Call callback on success or error (VError object or 404 int).
exports.getFile = function (output, path, file, callback) {
    var resource = encode(config.rest + config.baseCollection + path + '/' + file) + '?_xsl=no';
    console.log('GET FILE', resource);
    http.get({
        host: config.host,
        port: config.port,
        auth: config.auth,
        path: resource
    }, function (res) {
        if(res.statusCode == 404)
            return callback(404);
        else if (res.statusCode != 200)
            return callback(new Error('Exist GET request has status code ' + res.statusCode));
        res.on('error', function (err) {
            res.unpipe(output);
            callback(new VError(err, 'Error getting file'));
        });
        res.on('end', function () {
            callback();
        });
        res.pipe(output);
    });
};

// Save input stream to file in path, creating directory
// if it does not exist. Call callback on success or error.
exports.putFile = function (input, path, file, callback, existConfig) {
    existConfig = R.merge(config, existConfig);
    var resource = encode_write(existConfig.rest + existConfig.baseCollection + path + '/' + file);
    console.log('PUT FILE', resource);
    var output = http.request({
        method: "PUT",
        host: existConfig.host,
        port: existConfig.port,
        auth: existConfig.auth,
        path: resource
    }, function (res) {
        res.on('error', function (err) {
            callback(new VError(err, 'Error putting file'));
            input.unpipe(output);
        });
        res.resume();
        res.on('end', function () {
            if (res.statusCode < 200 || res.statusCode >= 300)
                callback(new Error('Exist PUT request has status code ' + res.statusCode));
            else callback();
        });
    });
    input.pipe(output);
};

// Delete the passed file
// Call callback on success or error
// TODO: remove empty directories
exports.deleteFile = function (path, file, callback, existConfig) {
    existConfig = R.merge(config, existConfig);
    var resource = encode_write(existConfig.rest + existConfig.baseCollection + path + '/' + file);
    console.log('DELETE FILE', resource);
    http.request({
        method: "DELETE",
        host: existConfig.host,
        port: existConfig.port,
        auth: existConfig.auth,
        path: resource
    }, function (res) {
        if(res.statusCode == 404) return callback(404);
        else if (res.statusCode != 200)
            return callback(new Error('Exist DELETE request has status code ' + res.statusCode));

        callback();
        // Delete empty collections, don't care about the output
        deleteEmptyCollections(config.baseCollection, function() {});
    }).end();
};

// Notes:
// Exist handling of special charactes is really bad.
// We must do double URI encoding when retrieving files
// https://github.com/eXist-db/exist/issues/44


function encode_write(str) {
    return str.split('/').map(encodeURIComponent).join('/');
    // return (
    //     str
    //         .replace('%', '%25')
    //         .replace('#', '%23')
    //         .replace(':', '%3A')
    // );
}

function decode_ls(str) {
    console.log('str', str);
    return decodeURI(
        str.replace(encodedRegex, replaceEncoded)
    );
    // .replace('%23', '#')
    // .replace('%3A', ':')
    // .replace('%25', '%');
}

function encode(str) {
    return encodeURI(str
    )
    .replace(specialRegex, replaceSpecial)
    // .replace('#', '%23')
    // .replace(':', '%3A')
    // .replace(/%(?!27|28|29|2A)/g, '%25')
    .replace(/%(?!20)/g, '%25')
    ;
}

var specialMap =
{
    // "!": "%21",
    "#": "%23",
    "$": "%24",
    "&": "%26",
    // "'": "%27",
    // "(": "%28",
    // ")": "%29",
    // "*": "%2A",
    "+": "%2B",
    ",": "%2C",
    ":": "%3A",
    ";": "%3B",
    "=": "%3D",
    "?": "%3F",
    "@": "%40",
    "[": "%5B",
    "]": "%5D"
};
var specialRegex = new RegExp('(['+(Object.keys(specialMap).map(R.concat('\\')).join(''))+'])', 'g');
var replaceSpecial = function(special) { return specialMap[special]; };
var encodedMap =  R.invertObj({
    "!": "%21",
    "#": "%23",
    "$": "%24",
    "&": "%26",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "*": "%2A",
    "+": "%2B",
    ",": "%2C",
    // "/": "%2F",
    ":": "%3A",
    ";": "%3B",
    "=": "%3D",
    "?": "%3F",
    "@": "%40",
    "[": "%5B",
    "]": "%5D"
});
var encodedRegex = new RegExp('('+(Object.keys(encodedMap).join('|'))+')', 'g');
var replaceEncoded = function(encoded) { return encodedMap[encoded]; };
// console.log(specialRegex)
// console.log(encodedRegex)
//
// console.log('!__#__$__&__\'__(__)__*__+__,__/__:__;__=__?__@__[__]__è');
// console.log(encode('!__#__$__&__\'__(__)__*__+__,__/__:__;__=__?__@__[__]__è'));
// console.log(decode_ls(encode('!__#__$__&__\'__(__)__*__+__,__/__:__;__=__?__@__[__]__è')));
