
describe('AKN -> NIR ref conversion', function () {
    var utils = require('./utils.js');

    it('should convert internal ref uri to urn', done => {
        utils.convert('LEGGE_22-maggio-2015.akn.xml', nir => {
            let ref = utils.select('//nir:rif[text() = "452-bis" and @xlink:href="#art452bis"]', nir);
            expect(ref.length).toEqual(4);
            ref = utils.select('//nir:rif[text() = "articolo 452-bis" and @xlink:href="#art452bis"]', nir);
            expect(ref.length).toEqual(2);
            done();
        });
    });

    it('should convert external ref uri to urn', done => {
        utils.convert('LEGGE_22-maggio-2015.akn.xml', nir => {
            let ref = utils.select('//nir:rif[text() = "articolo 1 della legge 7 febbraio 1992, n. 150"]', nir)[0];
            expect(ref.getAttribute('xlink:href')).toEqual('urn:nir:stato:legge:1992-02-07;150#art1');
            ref = utils.select('//nir:rif[text() = "articolo 6 della legge 7 febbraio 1992, n. 150"]', nir)[0];
            expect(ref.getAttribute('xlink:href')).toEqual('urn:nir:stato:legge:1992-02-07;150#art6');
            done();
        });
    });
});
