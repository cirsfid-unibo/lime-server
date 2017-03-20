
describe('AKN -> NIR quoted conversion', function () {
    var utils = require('./utils.js');

    it('should convert quoted structures', done => {
        utils.convert('LEGGE_22-maggio-2015.akn.xml', nir => {
            const virgoletteStruttura = utils.select('//nir:virgolette[@tipo="struttura"]',nir);
            expect(virgoletteStruttura.length).toEqual(5);
            const virgoletteParola = utils.select('//nir:virgolette[@tipo="parola"]',nir);
            expect(virgoletteParola.length).toEqual(34);
            done();
        });
    });
});
