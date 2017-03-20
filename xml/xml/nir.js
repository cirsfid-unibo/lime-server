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

// External modules
var path = require('path'),
    xmldom = require('xmldom'),
    xmlParser = new xmldom.DOMParser({
        errorHandler: function(level, msg) { throw new Error(msg); }
    }),
    xmlSerializer = new xmldom.XMLSerializer();

var saxon = require('../xml/saxon.js');

var NIR10_NAMESPACE = 'http://www.normeinrete.it/nir/1.0',
    NIR20_NAMESPACE = 'http://www.normeinrete.it/nir/2.0',
    NIR22_NAMESPACE = 'http://www.normeinrete.it/nir/2.2/',
    AKN_NAMESPACE = 'http://docs.oasis-open.org/legaldocml/ns/akn/3.0/WD17';

var pathNir10ToNir20 = path.resolve(__dirname, '..', 'xslt/Nir1XToNir20.xsl'),
    pathNir20ToNir22 = path.resolve(__dirname, '..', 'xslt/Nir20ToNir22.xsl'),
    pathNir22ToAkn = path.resolve(__dirname, '..', 'xslt/nir2akn.xsl'),
    pathAkn2Nir = path.resolve(__dirname, '..', 'xslt/akn2nir.xsl');

exports.nir2akn = function (nirXml, callback) {
    try {
        nirXml = fixNir(nirXml);
    } catch (e) {
        // console.log(e);
        return callback(e);
    }

    // NIR 1.0 -> NIR 2.0
    convert(nirXml, pathNir10ToNir20, NIR10_NAMESPACE, function (err, result) {
        if (err) return callback(err);
        // NIR 2.0 -> NIR 2.2
        convert(result, pathNir20ToNir22, NIR20_NAMESPACE, function (err, result) {
            if (err) return callback(err);
            var params = {
                today: (new Date()).toISOString().substr(0, 10)
            };
            // NIR 2.2 -> AKN
            saxon.transform(result, pathNir22ToAkn, params, function (err, result) {
                if (err) return callback(err);
                callback(undefined, result);
            });
        });
    });
};

function fixNir (nirXml) {
    // Remove html entities
    nirXml = removeHtmlEntities(nirXml);
    var doc = xmlParser.parseFromString(nirXml, 'text/xml');

    for (var child = doc.firstChild; child; child = child.nextSibling) {
        // Remove processing instructions
        if (child.nodeType == 7)
            doc.removeChild(child);
        // Remove doctype
        if (child.nodeType == 10)
            doc.removeChild(child);
        // Set NIR namespace where unspecified
        if (child.nodeType == 1 && !child.getAttribute('xmlns'))
            // This shouldn't work, but xmldom is buggy
            // https://github.com/jindw/xmldom/issues/97
            child.setAttribute('xmlns', NIR22_NAMESPACE)
    }
    return xmlSerializer.serializeToString(doc);
}

function removeHtmlEntities (xml) {
    return xml
        .replace(/&deg;/g, '°')
        .replace(/&agrave;/g, 'à')
        .replace(/&egrave;/g, 'è')
        .replace(/&Egrave;/g, 'È')
        .replace(/&ograve;/g, 'ò')
        .replace(/&ugrave;/g, 'ù')
        .replace(/&igrave;/g, 'ì')
        .replace(/&Agrave;/g, 'À')
        .replace(/&eacute;/g, 'é')
    ;
}

// Convert content with XSLT in xsltPath if it has the given namespace.
// Call callback with the result.
function convert (content, xsltPath, namespace, callback) {
    if (content.indexOf(namespace) != -1)
        saxon.transform(content, xsltPath, {}, callback);
    else setTimeout(callback.bind(undefined, undefined, content), 0);
}

exports.akn2nir = function (aknXml, callback) {
    // AKN -> NIR 2.2
    convert(aknXml, pathAkn2Nir, AKN_NAMESPACE, function (err, result) {
        if (err) return callback(err);
        callback(undefined, result);
    });
};
