describe('NIR modifications', function () {
    var utils = require('./utils.js');

    it('modifiche passive destination urn:nir:senato.repubblica:delibera:1989-06-07;nir-19890607', done => {
        utils.convert('example.xml', akn => {
            var ref = utils.selectAttr('//akn:passiveModifications/akn:textualMod/akn:destination/@href', akn);
            expect(ref).toEqual('/akn/it/act/delibera/senato_repubblica/1989-06-07/nir-19890607~rif7');
            done();
        });
    });
});
