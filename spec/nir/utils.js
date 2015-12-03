var nir2akn = require('../../xml/xml/nir').nir2akn,
    xmldom = require('xmldom'),
    xpath = require('xpath'),
    fs = require('fs');

var cache = {};
var parser = new xmldom.DOMParser();
exports.convert = function (file, callback) {
    if (cache[file]) callback(cache[file]);
    var xml = fs.readFileSync('spec/data/' + file, { encoding: 'utf-8' });
    nir2akn(xml, function (err, akn) {
        if (err) return console.log(err);
        var dom = parser.parseFromString(akn);
        callback(dom);
    });
};

var select = xpath.useNamespaces({ akn: 'http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD13' });
var selectAttr = (xpath, dom) => select(xpath, dom, true).value;
exports.expressionUri = dom => selectAttr('//akn:FRBRExpression/akn:FRBRuri/@value', dom);
exports.workUri = dom => selectAttr('//akn:FRBRWork/akn:FRBRuri/@value', dom);
