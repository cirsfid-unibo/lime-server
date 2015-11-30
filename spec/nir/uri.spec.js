
describe('NIR Urn -> Uri conversion', function () {
    var convert,
        expressionUri;

    it('urn:nir:stato:legge:2000-09-29;300', done => {
        convert('stato_legge_2000-09-29;300.xml', akn => {
            var uri = expressionUri(akn);
            expect(uri).toEqual('/akn/it/act/legge/stato/2000-09-29/300/ita@/main');
            done();
        });
    });

    beforeAll(function () {
        var nir2akn = require('../../xml/xml/nir').nir2akn,
            xmldom = require('xmldom'),
            xpath = require('xpath'),
            fs = require('fs');

        var cache = {};
        var parser = new xmldom.DOMParser();
        convert = function (file, callback) {
            if (cache[file]) callback(cache[file]);
            var xml = fs.readFileSync('spec/data/' + file, { encoding: 'utf-8' });
            nir2akn(xml, function (err, akn) {
                var dom = parser.parseFromString(akn);
                callback(dom);
            });
        };

        var select = xpath.useNamespaces({ akn: 'http://docs.oasis-open.org/legaldocml/ns/akn/3.0/CSD13' });
        var selectAttr = (xpath, dom) => select(xpath, dom, true).value;
        expressionUri = dom => selectAttr('//akn:FRBRExpression/akn:FRBRthis/@value', dom);
    });
});
