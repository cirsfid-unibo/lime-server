
describe('NIR Urn -> Content conversion', function () {
    var utils = require('./utils.js');

    fit('should convert quoted structures', done => {
        // Bug: content of list inside quoted text is lost
        // File urn:nir:stato:decreto.legge:1992-06-08;306
        // title_1__chp_2__art_1__para_6__point_2__content_1__mod_1__qstr_1
        utils.convert('stato_decreto_legge_1992-06-08;306.xml', akn => {
            var qstr = utils.select('//akn:quotedStructure[@eId="title_1__chp_2__art_1__para_6__point_2__content_1__mod_1__qstr_1"]', akn)[0];
            console.log(utils.serialize(qstr));
            // expect(qstr.getAttribute('startQuote')).toEqual('"');
            // expect(qstr.getAttribute('endQuote')).toEqual('"');
            // expect(qstr.textContent).toContain('delitti di partecipazione, promozione, direzione e organizzazione della associazione di tipo mafioso prevista dall');
            done();
        });
    });
});
