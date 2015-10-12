
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

// Validate all files in a folder.
// node massValidate ../docs/Piemonte/

var fs = require('fs'),
    http = require("http"),
    path = require("path"),
    recursive = require('recursive-readdir'),
    mkpath = require("mkpath");

var xml = require("../xml/xml");


var source = process.argv[2];
var schemaPath = 'scripts/akn.xsd';

// console.log('argv', process.argv);
// console.log('source', source);
// console.log('schemaPath', schemaPath);

// Wait for xml libs to setup correctly
setTimeout (main, 2000);

var validated = [];
var unvalidated = [];
var errors = [];

function main () {
    recursive(source, function (err, files) {
        if (err) throw err;
        var total = files.length;

        function iterate () {
            if (files.length == 0) {
                console.log('The end.');
                console.log('Total:', files);
                console.log('Validated', validated.length);
                console.log('Unvalidated', unvalidated.length);
                console.log('Unvalidated', unvalidated.length);
                console.log('Errors', errors.length);
                console.log(unvalidated);
                return;
            }
            var file = files.pop();
            console.log('Opening', file);
            
            var content = fs.readFileSync(file, { encoding: 'utf8' });

            fixNirXslt(content, function (err, fixedNirXml) {
                if (err) {
                    console.log('Error', file);
                    errors.push(file);
                    setTimeout(iterate, 0);
                }
                nir2aknXslt(fixedNirXml, function (err, aknXml) {
                    if (err) {
                        console.log('Error', file);
                        errors.push(file);
                        setTimeout(iterate, 0);
                    }
                    
                    setTimeout(function () {
                        // saveToFile(file, aknXml);
                        // iterate();

                        validate(file, aknXml, iterate);
                    }, 0);
                })
            });
        }
        iterate();
    });
}

function validate (file, content, cb) {
    xml.validate(content, schemaPath, function (err, results) {
        // console.log(results.errors);
        if (err) {
            console.log('Internal Error');
            console.log(err);
            errors.push(file);
            // cb();
        }
        else if (results && results.errors) {
            console.log('Validation Error')
            // console.log(content.substring(0, 500));
            console.log(results.errors.slice(0, 3));
            unvalidated.push(file);
            setTimeout(cb, 5000);
            // cb();
        } else {
            console.log('Valid');
            validated.push(file);
            setTimeout(function () {
                saveToFile(file, content);
            }, 0);
            cb();
        }
        // setTimeout(cb, 5000);
    });
}

function saveToFile (file, content) {
    var dir = path.join('output', path.dirname(file));
    var filePath = path.join(dir, path.basename(file));
    mkpath(dir, function (err) {
        //if(err) throw err;
        fs.writeFile(filePath, content, function (err) {
            if (err) console.log(err);
        });
    });
}

function fixNirXslt (nirXml, callback) {
    // Add namespace if missing
    // Todo: fix this parsing xml and adding real namespace attribute.
    var namespaceStr = 'xmlns="http://www.normeinrete.it/nir/2.2/"';
    if (nirXml.indexOf(namespaceStr) == -1)
        nirXml = nirXml.replace('<NIR', '<NIR ' + namespaceStr);
    callback(undefined, nirXml);
}

function nir2aknXslt (nirXml, callback) {
    var xsltPath = path.resolve(__dirname, '..', 'xslt/nir2akn.xsl');
    var now = new Date();
    var params = {
        today: (new Date()).toISOString().substr(0, 10)
    };
    xml.transform(nirXml, xsltPath, params, callback);    
}
