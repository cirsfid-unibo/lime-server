
describe('NIR REF conversion', function () {
    var utils = require('./utils.js');

    fit('urn:nir:stato:regio.decreto:1930-10-19;1398:codice.penale', done => {
        utils.convert('penale/main.xml', akn => {
            console.log(utils.serialize(akn))
            var urnNir = 'urn:nir:stato:regio.decreto:1930-10-19;1398:codice.penale';
            var uriAkn = '/akn/it/act/regio_decreto/stato/1930-10-19/1398!codice_penale';
            expect(utils.selectAttr('//akn:article//akn:ref/@refersTo', akn)).toEqual('#rif1');
            expect(utils.selectAttr('//akn:TLCReference[@eId="rif1"]/@href', akn)).toEqual(urnNir);
            expect(utils.selectAttr('//akn:article//akn:ref/@href', akn)).toEqual(uriAkn);
            done();
        });
    });
});
