describe('NIR metadata references', function () {
    var utils = require('./utils.js');

    it('activeRef: urn:nir:stato:regio.decreto:1930-10-19;1398:codice.penale', done => {
        utils.convert('stato_legge_2000-09-29;300.xml', akn => {
            var ref = utils.selectAttr('//akn:activeRef[1]/@href', akn);
            expect(ref).toEqual('/akn/it/act/regio_decreto/stato/1930-10-19/1398!codice_penale');
            done();
        });
    });

    it('passiveRef: urn:nir:presidente.repubblica:decreto:1973-01-23;43:testo.unico', done => {
        utils.convert('example.xml', akn => {
            var ref = utils.selectAttr('//akn:passiveRef[1]/@href', akn);
            expect(ref).toEqual('/akn/it/act/decreto/presidente_repubblica/1973-01-23/43!testo_unico');
            done();
        });
    });

    it('alias: urn:nir:stato:legge:2000-09-29;299', done => {
        utils.convert('example.xml', akn => {
            // console.log(utils.serialize(akn))
            // utils.serialize(utils.select(akn, '//akn:meta'));
            var ref = utils.selectAttr('//akn:FRBRalias[2]/@value', akn);
            expect(ref).toEqual('/akn/it/act/decreto_legge/stato/2000-09-29/299');
            done();
        });
    });
})