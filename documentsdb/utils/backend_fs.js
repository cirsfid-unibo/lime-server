
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

var VError = require('verror'),
    fs = require('fs'),
    joinUrl = require('url').resolve,
    joinPath = require('path').join,
    mkdirp = require('mkdirp');

var documentsPath = require('../config.json').filesystem.documents;


// Call callback with err or list of files inside dir.
exports.getDir = function (path, callback) {
    var dirPath = joinPath(documentsPath, path);
    fs.readdir(dirPath, function (err, filenames) {
        if (err && err.code == 'ENOENT')
            return callback(undefined, []);
        if (err)
            return callback(new VError(err, 'Error reading directory'));

        // Detect if they are files or directories
        var dirs = [], files = [];
        function onStatResult (entity, err, stat) {
            if (err) return callback(new VError(err, 'Error checking if file is directory'));
            if (stat.isDirectory()) dirs.push(entity + '/');
            else files.push(entity);

            if (dirs.length + files.length == filenames.length)
                callback(undefined, dirs.concat(files));
        }

        for (var i = 0; i < filenames.length; i++) {
            var entity = joinPath(path, filenames[i]);
            fs.lstat(joinPath(documentsPath, entity), onStatResult.bind(this,
                joinUrl(path, filenames[i]).replace(/%20/g, ' '))
            );
        }
    });
};

// Read file from path and write it to output stream.
// Call callback on success or error (VError object or 404 int).
exports.getFile = function (output, path, file, callback) {
    var filePath = joinPath(documentsPath, path, file),
        fileStream = fs.createReadStream(filePath);

    fileStream.pipe(output);

    fileStream.on('error', function(err) {
        fileStream.unpipe(output);
        if (err.code == 'ENOENT' || err.code == 'EISDIR')
            callback(404);
        else
            callback(new VError(err, 'Error opening file'));
    });
};

// Save input stream to file in path, creating directory
// if it does not exist. Call callback on success or error.
exports.putFile = function (input, path, file, callback) {
    var dirPath = joinPath(documentsPath, path),
        filePath = joinPath(dirPath, file);
    mkdirp(dirPath, function (err) {
        if (err) callback(new VError(err, 'Error creating directory'));

        var fileStream = fs.createWriteStream(filePath);
        input.pipe(fileStream);
        input.on('end', callback);
        fileStream.on('error', function(err) {
            callback(new VError(err, 'Error saving file'));
        });
    });
};
