
describe('NIR REF conversion', function () {
    var utils = require('./utils.js');

    it('urn:nir:stato:regio.decreto:1930-10-19;1398:codice.penale', done => {
        utils.convert('penale/main.xml', akn => {
            var urnNir = 'urn:nir:stato:regio.decreto:1930-10-19;1398:codice.penale';
            var uriAkn = '/akn/it/act/regio_decreto/stato/1930-10-19/1398!codice_penale';
            expect(utils.selectAttr('//akn:article//akn:ref/@refersTo', akn)).toEqual('#rif1');
            expect(utils.selectAttr('//akn:TLCReference[@eId="rif1"]/@href', akn)).toEqual(urnNir);
            expect(utils.selectAttr('//akn:article//akn:ref/@href', akn)).toEqual(uriAkn);
            done();
        });
    });

    it('should convert anchors to same document', done => {
        utils.convert('penale/allegato1.xml', akn => {
            var urnNir = '#art7-com1-let1';
            var uriAkn = '~art_7__para_1__point_1';
            var article = utils.select('//akn:article[@eId="art_8"]', akn)[0]
            expect(utils.selectAttr('.//akn:ref/@refersTo', article)).toEqual('#rif1');
            expect(utils.selectAttr('//akn:TLCReference[@eId="rif1"]/@href', akn)).toEqual(urnNir);
            expect(utils.selectAttr('.//akn:ref/@href', article)).toEqual(uriAkn);
            done();
        });
    });
});
