
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
 
var fs = require('fs'),
    http = require("http"),
    mkpath = require("mkpath");

getFileList(function (fileList) {
    function iter () {
        if (fileList.length > 0)
            readFile(fileList.pop(), iter);
    }
    iter();
});

function getFileList(callback) {

    var httpOption = {
        host: 'sinatra.cirsfid.unibo.it',
        port: 8080,
        path: '/exist/rest/db/piemonte_queries/listAllFiles.xql',
        method: 'GET'
        //headers: {'Content-Type': 'application/json'}
    };

    var req = http.request(httpOption, function(stream) {
        var responseData = "";
        stream.on('data', function (chunk) {
            responseData = responseData + chunk;
        });

        stream.on('end', function () {
            var files = JSON.parse(responseData)['files'];
            callback(files);
        });

    });

    req.on('error', function (e) {
        console.log('>>> problem with request: ' + e.message);
    });

    req.end();
}


function readFile(path, cb) {
    var httpOption = {
        host: 'sinatra.cirsfid.unibo.it',
        port: 8080,
        path: path,
        method: 'GET'
        //headers: {'Content-Type': 'text/xml'}
    };

    var req = http.request(httpOption, function(stream) {

        var responseData = "";
        stream.on('data', function (chunk) {
            responseData = responseData + chunk;
        });

        stream.on('end', function () {
            getFile(responseData,path, cb);
        });

    });

    req.on('error', function (e) {
        console.log('>>> problem with request: ' + e.message);
    });

    req.end();
}


function getFile(content,path,cb) {

    var requestData = JSON.stringify({
        content : content
    });

    var httpOption = {
        host: 'localhost',
        port: 9006,
        path: '/nir2akn',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestData)
        }
    };

    var req = http.request(httpOption, function(stream) {

        var responseData = "";
        // console.log('>>> Status: ' + stream.statusCode + ' for document ' + path + '\n');
        stream.setEncoding('utf8');

        stream.on('data', function (chunk) {
            responseData = responseData + chunk;
        });

        stream.on('end', function () {

            var akomaPath = path.substring(path.lastIndexOf("piemonte"),path.lastIndexOf("/"));         
            var akomaFilePath = path.substring(path.lastIndexOf("piemonte"));

            mkpath(akomaPath, function (err) {
                //if(err) throw err;
                fs.writeFile(akomaFilePath, responseData, function (err) {
                    // if (err) throw err;
                    console.log('Ok:', akomaPath);
                });
                cb();   
            });
        });
    });
    req.setTimeout(5000, function () {
        console.log('timeout', path);
        // cb();
    });

    req.on('error', function (e) {
        console.log('>>> problem with request: ' + e.message);
        console.log('>>> error on document ' + path + '\n');
    });

    req.write(requestData);
    req.end();
}