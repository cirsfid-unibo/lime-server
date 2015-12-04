
describe('NIR Urn -> Uri conversion', function () {
    var convert = require('./utils.js').convert,
        workUri = require('./utils.js').workUri,
        expressionUri = require('./utils.js').expressionUri;

    it('urn:nir:stato:legge:2000-09-29;300', done => {
        convert('stato_legge_2000-09-29;300.xml', akn => {
            var uri = workUri(akn);
            expect(uri).toEqual('/akn/it/act/legge/stato/2000-09-29/300');
            done();
        });
    });

    it('urn:nir:stato:legge:2000-09-29;300*entrata.vigore;2001-08-07', done => {
        convert('stato_legge_2000-09-29;300@2001-08-06.xml', akn => {
            expect(workUri(akn)).toEqual('/akn/it/doc/entrata_vigore/stato/2001-08-07/legge_2000-09-29_300');
            expect(expressionUri(akn)).toEqual('/akn/it/doc/entrata_vigore/stato/2001-08-07/legge_2000-09-29_300/ita@2001-08-07');
            done();
        });
    });
});
