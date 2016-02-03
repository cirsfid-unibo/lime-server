
describe('NIR Urn -> Content conversion', function () {
    var utils = require('./utils.js');

    it('should convert quoted structures', done => {
        // Bug: content of list inside quoted text is lost
        // File urn:nir:stato:decreto.legge:1992-06-08;306
        // title_1__chp_2__art_1__para_6__point_2__content_1__mod_1__qstr_1
        utils.convert('stato_decreto_legge_1992-06-08;306.xml', akn => {
            // console.log(utils.serialize(utils.select('//*[@eId="art_4__para_6__point_b"]',akn)[0]));
            var qstr = utils.select('//akn:quotedStructure[@eId="art_4__para_6__point_b__content_1__mod_1__qstr_1"]', akn)[0];
            expect(qstr.getAttribute('startQuote')).toEqual('"');
            expect(qstr.getAttribute('endQuote')).toEqual('"');
            expect(qstr.textContent).toContain('delitti di partecipazione, promozione, direzione e organizzazione della associazione di tipo mafioso prevista dall');
            done();
        });
    });
});
