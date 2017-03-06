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
    Transform = require('stream').Transform,
    fs = require('fs'),
    path = require('path'),
    xmldom = require('xmldom'),
    R = require('ramda');

// AknToHtml is a Transform stream which converts
// an AkomaNtoso xml stream into a html stream.

util.inherits(AknToHtml, Transform);

var template = fs.readFileSync(path.resolve(__dirname, './html/template.html'), 'utf8'),
    styles = fs.readFileSync(path.resolve(__dirname, './html/akn.css'), 'utf8');

function AknToHtml(options) {
    var me = this;
    this.xmlString = '';
    Transform.call(this, options);
    me.on('finish', function () {
        me._htmlConversion();
    });
}

AknToHtml.prototype._flush = function(callback) {
    this.endConversion = callback;
}

AknToHtml.prototype._transform = function(chunk, encoding, done) {
    this.xmlString += chunk.toString('utf8');
    done();
}

AknToHtml.prototype._htmlConversion = function() {
    var doc = new xmldom.DOMParser().parseFromString(this.xmlString, 'text/xml');
    var content = this._transformDoc(doc);
    this.push(fillTemplate(content));
    this.endConversion();
}


AknToHtml.prototype._transformDoc = function(doc) {
    return doc ? translate(doc) : '';
}

var translateChildren = R.compose(R.into('', R.map(translate)), R.prop('childNodes')),
    translateAttribute = R.converge(R.objOf, [
        R.compose(R.concat('data-'), (R.compose(R.replace(':', '-'), R.prop('name')))),
        R.prop('value')
    ]),
    translateAttributes = R.compose(R.into({}, R.map(translateAttribute)), R.prop('attributes'));

function translate(node) {
    switch (node.nodeType) {
        case 3: // Text
            return node.textContent;
        case 1: // Element
        case 9: // Document
            // console.log(node.attributes)
            var content = translateChildren(node),
                attributes = (node.nodeType == 1 && node.hasAttributes()) ? translateAttributes(node) : {},
                renderFn = renderFunctions[node.nodeName] || renderFunctions.default;
            attributes.class = node.nodeName;
            return renderFn(node, attributes, content, render);
        default:
            return '';
    }
}

var renderFunctions = {
    default: function (node, attributes, content, render) {
        return render('div', attributes, content);
    }
};


function render (tag, attributes, content) {
    return [
        '<', tag ,' ',
            Object.keys(attributes).map(function (key) {
                return key + '="' + attributes[key] + '"';
            }).join(' '),
            '>',
            content,
        '</', tag ,'>'
    ].join('');
}

function fillTemplate(content) {
    return template
          .replace('{{style}}', styles)
          .replace('{{content}}', content);
}

module.exports = AknToHtml;
