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
    path = require('path'),
    xmldom = require('xmldom'),
    xpath = require('xpath'),
    Buffer = require('buffer').Buffer;


var scribaJar = path.resolve(__dirname, '../lib/scriba/ScribaEBookMaker.jar'),
    scribaCommand = 'java -Xmx1024m -jar ' + scribaJar + ' -t EPUB -c %s -o %s',
    scfTemplate = path.resolve(__dirname, '../lib/scriba/scf-template.xml'),
    akn2html = path.resolve(__dirname, '../xslt/Akn30ToXhtml.xsl'),
    sourceCover = path.resolve(__dirname, '../lib/scriba/ebookstaticcontent/cover_lime.html'),
    sourceStyle = path.resolve(__dirname, '../lib/scriba/ebookstaticcontent/lime.css');

// AknToEpub is a Transform stream which converts
// an AkomaNtoso xml stream into a epub (application/epub+zip) stream.

// Since we use Scriba for doc to xml conversion, we need
// to write input stream to a tmp file, convert it using
// Scriba, than pipe that output file to the AknToEpub "output stream"

util.inherits(AknToEpub, Transform);

function AknToEpub(options) {
    var me = this;
    Transform.call(this, options);

    // Create temporary .xml file
    tmp.file({ postfix: '.xml' }, function (err, path, fd, cleanupCallback) {
        if (err) throw err;

        me.tmpXmlFile = path;
        me.tmpFileStream = fs.createWriteStream(undefined, { fd: fd });
        me.cleanUpDoc = cleanupCallback;

        if (me.unwrittenBuff){
            me.tmpFileStream.write(Buffer.concat(me.unwrittenBuff))
        }

        // When tmp file copy is completed, execute Scriba file conversion 
        me.tmpFileStream.on('finish', function () {
            fs.close(fd, function () {
                me._scribaConversion();
            });
        });

        // When input stream is comnsumed, close tmpFileStream
        me.on('finish', function () {
            me.tmpFileStream.end();
        });
    });
}

AknToEpub.prototype._flush = function(callback) {
    this.endConversion = callback;
}

AknToEpub.prototype._transform = function(chunk, encoding, done) {
    // Just call callback, since we'll process result only when the stream is done
    if (this.tmpFileStream) {
        this.tmpFileStream.write(chunk);
    } else {
        this.unwrittenBuff = this.unwrittenBuff || [];
        this.unwrittenBuff.push(chunk);
    }
    done();
}

AknToEpub.prototype._scribaConversion = function() {
    // Create temporary destination file
    var me = this;
    var scfPath = me._buildSCFTemplate(me._getDocConfig());
    tmp.tmpName({ postfix: '.epub' }, function (err, outputFile) {
        if (err) throw err;
        var cmd = util.format(scribaCommand, scfPath, outputFile);
        var child = exec(cmd, function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            }
            console.log('CONVERTED TO EPUB', scfPath, outputFile);

            var stream = fs.createReadStream(outputFile);
            stream.on('data', function (chunk) {
                me.push(chunk);
            });
            stream.on('end', function () {
                me.endConversion();
                fs.unlink(scfPath);
                fs.unlink(me.tmpXmlFile);
                fs.unlink(outputFile);
            });
        });
    });
}

AknToEpub.prototype._buildSCFTemplate = function(docConfig) {
    var pathToFileUrl = function(path) {
        return 'file:///'+path.replace(/\\/g, '/');
    }

    var selectFirst = function(query, doc) {
        return xpath.select(query, doc)[0];
    }

    var scfTplContent = fs.readFileSync(scfTemplate, 'utf8');
    var doc = new xmldom.DOMParser().parseFromString(scfTplContent,'text/xml');

    // Fills the default template
    var langNode = xpath.select('//metaitem[@elename="language"]', doc)[0];
    langNode.appendChild(doc.createTextNode(docConfig.lang));
    var titleNode = xpath.select('//metaitem[@elename="title"]', doc)[0];
    titleNode.appendChild(doc.createTextNode(docConfig.title));

    var xslFullPath = selectFirst('//metaitem[@name="xslFullPath"]', doc);
    var content = selectFirst('//content[@packageId="content"]', doc);
    var cover = selectFirst('//content[@packageId="copertina"]', doc);
    var style = selectFirst('//content[@packageId="style"]', doc);

    xslFullPath.setAttribute('content', pathToFileUrl(akn2html));
    content.setAttribute('contentUrl', pathToFileUrl(this.tmpXmlFile));
    cover.setAttribute('contentUrl', pathToFileUrl(sourceCover));
    style.setAttribute('contentUrl', pathToFileUrl(sourceStyle));

    var newScf = new xmldom.XMLSerializer().serializeToString(doc);
    // Create temporary SCF file
    var scfFileTmp = tmp.fileSync({ postfix: '.xml' });
    fs.writeSync(scfFileTmp.fd, newScf);
    return scfFileTmp.name;
}

AknToEpub.prototype._getDocConfig = function(docConfig) {
    var getContent = function(query, doc) {
        var node = xpath.select(query, doc)[0];
        return (node) ? node.textContent.trim() : '';
    }
    var docText = fs.readFileSync(this.tmpXmlFile, 'utf8'),
        doc = new xmldom.DOMParser().parseFromString(docText, 'text/xml'),
        title = getContent('//*[local-name()="docTitle"]', doc),
        docNum = getContent('//*[local-name()="docNumber"]', doc),
        docDate = getContent('//*[local-name()="docDate"]', doc),
        langNode = xpath.select('//*[local-name()="FRBRlanguage"]/@language', doc)[0];

    return {
        lang: langNode && langNode.textContent || '',
        title: util.format('%s %s - %s', title, docNum, docDate).trim()
    };
}

module.exports = AknToEpub;
