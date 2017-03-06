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

// Todo: make this a super Connect/Express middleware module.

var util = require('util'),
    fs = require('fs'),
    exec = require('child_process').exec,
    Transform = require('stream').Transform,
    tmp = require('tmp'),
    Buffer = require('buffer').Buffer;


var  abiConfig = require('../config.json').abiword;
var ABIWORD_PATH = require('os').platform() === 'win32' ?
                                                abiConfig.pathWin :
                                                abiConfig.path;

// FileToHtml is a Transform stream which converts
// a binary stream into a .html utf8 stream.

// Since we use Abiword for file to html conversion, we need
// to write input stream to a tmp file, convert it using
// Abiword, than pipe that output file to the FileToHtml "output stream"

util.inherits(FileToHtml, Transform);

function FileToHtml(options) {
    var me = this;
    Transform.call(this, options);
    // Create temporary file
    tmp.file(function (err, path, fd, cleanupCallback) {
        if (err) throw err;
        me.tmpDocFile = path;
        me.tmpFileStream = fs.createWriteStream(undefined, { fd: fd });
        me.cleanUpDoc = cleanupCallback;

        if (me.unwrittenBuff){
            me.tmpFileStream.write(Buffer.concat(me.unwrittenBuff));
            if (me.inputFinished) {
                me.tmpFileStream.end();
            }
        }

        // When tmp file copy is completed, execute Abiword file conversion 
        me.tmpFileStream.on('finish', function () {
            fs.close(fd, function () {
                me._abiwordConversion();
            });
        });

        // When input stream is comnsumed, close tmpFileStream
        me.on('finish', function () {
            me.tmpFileStream.end();
        });
    });
}

FileToHtml.prototype._flush = function(callback) {
    this.endConversion = callback;
    this.inputFinished = true;
}

FileToHtml.prototype._transform = function(chunk, encoding, done) {
    // Just call callback, since we'll process result only when the stream is done
    if (this.tmpFileStream) {
        this.tmpFileStream.write(chunk);
    } else {
        this.unwrittenBuff = this.unwrittenBuff || [];
        this.unwrittenBuff.push(chunk);
    }
    done();
}

FileToHtml.prototype._abiwordConversion = function() {
    // Create temporary destination file
    var me = this;
    tmp.tmpName(function (err, tmpHtmlFile) {
        if (err) throw err;
        var cmd = ABIWORD_PATH + ' --to=html ' + me.tmpDocFile + ' -o '+ tmpHtmlFile;
        var child = exec(cmd, function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }

            fs.unlink(me.tmpDocFile);
            var stream = fs.createReadStream(tmpHtmlFile);
            stream.on('data', function (chunk) {
                me.push(chunk);
            });
            stream.on('end', function () {
                me.endConversion();
                fs.unlink(tmpHtmlFile);
            });
        });
    });
}

module.exports = FileToHtml;
