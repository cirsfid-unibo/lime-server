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
    Transform = require('stream').Transform,
    path = require('path'),
    xmldom = require('xmldom'),
    pdfMake = require('pdfmake');

// AknToPdf is a Transform stream which converts
// an AkomaNtoso xml stream into a pdf stream.

util.inherits(AknToPdf, Transform);

function AknToPdf(options) {
    var me = this;
    this.xmlString = '';
    Transform.call(this, options);
    me.on('finish', function () {
        me._pdfConversion();
    });
}

AknToPdf.prototype._flush = function(callback) {
    this.endConversion = callback;
}

AknToPdf.prototype._transform = function(chunk, encoding, done) {
    this.xmlString += chunk.toString('utf8');
    done();
}

AknToPdf.prototype._pdfConversion = function() {
    var me = this;
    var doc = new xmldom.DOMParser().parseFromString(me.xmlString, 'text/xml');
    var content = me._transformDoc(doc);
    var printer = new pdfMake({
        Helvetica: {
            normal: 'Helvetica',
            bold: 'Helvetica-Bold',
            italics: 'Helvetica-Oblique',
            bolditalics: 'Helvetica-BoldOblique'
        }
    });
    // TODO: move styles to file
    var pdf = printer.createPdfKitDocument({
        content: content,
        styles: {
            preface: {
                margin: [0,15,0,10]
            },
            preamble: {
                margin: [0,15,0,15]
            },
            body: {
                margin: [0,15,0,15]
            },
            footer: {
                alignment: 'center',
                margin: [0,10,0,0]
            },
            num: {
                alignment: 'center',
                margin: [0,0,5,0],
                bold: true,
                fontSize: 14
            },
            heading: {
                alignment: 'center',
                margin: [0,0,0,10],
            },
            'item>num': {
                alignment: 'left',
                fontSize: 12
            },
            'paragraph>num': {
                alignment: 'left',
                fontSize: 12
            }
        },
        defaultStyle: {
            font: 'Helvetica',
            lineHeight: 1.5
        },
        footer: function(currentPage, pageCount) {
            return {
                text: currentPage.toString(), 
                style: 'footer'
            };
        }
    });
    pdf.end();
    pdf.on('data', function(chunk) {
        me.push(chunk);
    });
    pdf.on('end', function () {
        me.endConversion();
    });
}

AknToPdf.prototype._transformDoc = function(doc) {
    var me = this, content = [];

    var transformNode = function(node, cnt, cfg) {
        if(!node.nodeName) return;
        cfg = cfg || {};
        var translateFn = translateFunctions[node.nodeName] || generic;
        translateFn(node, cnt, cfg);
    }
    
    var generic = function(node, cnt, cfg) {
        var children = node.childNodes;
        for (var i = 0; i < children.length; i++)
            transformNode(children[i], cnt, cfg);
    }

    var getText = function(node, cfg) {
        cfg = cfg || {};
        var text = (cfg.noTrim) ? node.textContent : node.textContent.trim();
        text = text.replace(/\n/g, ' ').replace(/ +/g, ' ');
        return text;
    }

    var getParents = function(node, limit) {
        var parents = [];
        while(node.parentNode && limit--) {
            node = node.parentNode;
            parents.push(node.nodeName);
        }
        return parents;
    }

    var toArray = function(iterable) {
        var arr = [];
        for (var i = 0; i < iterable.length; i++)
            arr.push(iterable[i]);

        return arr;
    }

    var createParagraph = function() {
        return {text:[]};
    }

    var addStyle = function(cfg, node) {
        var style = [node.nodeName];
        if (node.parentNode)
            style.push(node.parentNode.nodeName+'>'+style[0]);
        cfg.style = style;
        return cfg;
    }

    var block = function(node, cnt, cfg) {
        var st = addStyle({stack: []}, node);
        cnt.push(st);
        var children = node.childNodes;
        for (var i = 0; i < children.length; i++)
            transformNode(children[i], st.stack, cfg);
    }

    var addText = function(text, cnt) {
        var p = cnt[cnt.length-1];

        // Ignore space in the beggining of the block
        if (!p && text == ' ') return;
        // Add the space to the previous element text
        if (p && text == ' ' && typeof p.text === 'string')
            return p.text+=text;

        if (!p || !Array.isArray(p.text)) {
            p = createParagraph();
            cnt.push(p);
        } else if (typeof text === 'string') {
            var lastText = p.text[p.text.length-1];
            if (lastText && typeof lastText === 'string')
                return p.text[p.text.length-1] += text;
        }
        p.text.push(text);
    }

    var inline = function(node, cnt, cfg) {
        addText(addStyle({text: getText(node, cfg)}, node), cnt);
    }

    var inlineBlock = function(node, cnt, cfg) {
        cnt.push(addStyle({text: getText(node, cfg)}, node));
    }

    var textContainer = function(node, cnt, cfg) {
        var parents = getParents(node, 2);
        var lastItem = cnt[cnt.length-1];
        if (lastItem && lastItem.style && lastItem.style[0] == 'num' &&
                parents.indexOf('paragraph') != -1 ||
                parents.indexOf('item') != -1) {
            var st = addStyle({stack: [], width: '*'}, node);
            lastItem.width = 'auto';
            var columns = {columns: [lastItem, st]};
            cnt[cnt.length-1] = columns;
            generic(node, st.stack, {noTrim: true});
        } else
            block(node, cnt, {noTrim: true});
    }

    var translateFunctions = {
        '#text': function(node, cnt, cfg) {
            var text = getText(node, cfg);
            // If there is a space in the end of the container ignore it
            if (!text || text == ' ' && !node.nextSibling) return;
            addText(text, cnt);
        },
        'meta': function() {},
        'eol': function(node, cnt) {
            cnt.push(createParagraph());
        },
        'content': function(node, cnt, cfg) {
            var hasPchild = toArray(node.childNodes).some(function(node) {
                return node.nodeName == 'p';
            });
            if (hasPchild) // avoid to create a 'content' stack
                return generic.apply(me, arguments); 

            textContainer.apply(me, arguments);
        },
        'date': inline,
        'docDate': inline,
        'docTitle': inlineBlock,
        'num': inlineBlock,
        'heading': inlineBlock,
        'p': textContainer,
        'blockList': textContainer,
        'preamble': block,
        'preface': block,
        'body': block,
        'mainBody': block,
        'conclusions': block,
        'item': block,
        'title': block,
        'chapter': block,
        'article': block,
        'section': block,
        'paragraph': block
    }

    transformNode(doc, content);
    //console.log(JSON.stringify(content, null, 4));
    return content;
}



module.exports = AknToPdf;