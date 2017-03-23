var akn2nir = require('../../xml/xml/nir').akn2nir,
    xmldom = require('xmldom'),
    xpath = require('xpath'),
    R = require('ramda'),
    fs = require('fs');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
jasmine.getEnv().defaultTimeoutInterval = 15000;

var cache = {};
var parser = new xmldom.DOMParser();
var serializer = new xmldom.XMLSerializer();
exports.convert = function (file, callback) {
    if (cache[file]) callback(cache[file]);
    var xml = fs.readFileSync('spec/data/' + file, { encoding: 'utf-8' });
    akn2nir(xml, function (err, nir) {
        if (err) return console.log(err);
        var dom = parser.parseFromString(nir);
        callback(dom);
    });
};
exports.parse = parser.parseFromString.bind(parser);
exports.serialize = serializer.serializeToString.bind(serializer);
exports.select = xpath.useNamespaces({
  akn: 'http://docs.oasis-open.org/legaldocml/ns/akn/3.0/WD17',
  nir: 'http://www.normeinrete.it/nir/2.2/',
  xlink: 'http://www.w3.org/1999/xlink'
});
exports.selectAttr = (xpath, dom) => R.prop('value', exports.select(xpath, dom, true) || {});

exports.convertUri = function (uri, callback) {
    var xml = `<akomaNtoso xmlns="http://docs.oasis-open.org/legaldocml/ns/akn/3.0/WD17"><ref href="${uri}"></ref></akomaNtoso>`;
    akn2nir(xml, function (err, nir) {
        if (err) return console.log(err);
        const ref = exports.selectAttr('//nir:rif/@xlink:href', parser.parseFromString(nir));
        callback(ref);
    });
};