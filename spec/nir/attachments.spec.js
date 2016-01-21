
describe('NIR -> Attachment conversion', function () {
    var utils = require('./utils.js');

    it('penale/allegato1.xml', done => {

        utils.convert('penale/allegato1.xml', akn => {
            expect(utils.workUri(akn)).toEqual('/akn/it/act/regio_decreto/stato/1930-10-19/1398');
            expect(utils.workThis(akn)).toEqual('/akn/it/act/regio_decreto/stato/1930-10-19/1398!codice_penale');
            expect(utils.expressionUri(akn)).toEqual('/akn/it/act/regio_decreto/stato/1930-10-19/1398/ita@');
            expect(utils.expressionThis(akn)).toEqual('/akn/it/act/regio_decreto/stato/1930-10-19/1398/ita@!codice_penale');

            var attachmentOf = utils.select('//akn:attachmentOf', akn);
            expect(attachmentOf.length).toEqual(1);
            expect(utils.serialize(attachmentOf[0])).toEqual('<attachmentOf href="/akn/it/act/regio_decreto/stato/1930-10-19/1398!main" showAs="Documento principale"/>');

            done();
        });
    });

    it('penale/main.xml', done => {

        utils.convert('penale/main.xml', akn => {
            expect(utils.workUri(akn)).toEqual('/akn/it/act/regio_decreto/stato/1930-10-19/1398');
            expect(utils.workThis(akn)).toEqual('/akn/it/act/regio_decreto/stato/1930-10-19/1398!main');
            expect(utils.expressionUri(akn)).toEqual('/akn/it/act/regio_decreto/stato/1930-10-19/1398/ita@');
            expect(utils.expressionThis(akn)).toEqual('/akn/it/act/regio_decreto/stato/1930-10-19/1398/ita@!main');

            var hasAttachment = utils.select('//akn:hasAttachment', akn);
            expect(hasAttachment.length).toEqual(1);
            expect(utils.serialize(hasAttachment[0])).toEqual('<hasAttachment href="/akn/it/act/regio_decreto/stato/1930-10-19/1398!codice_penale" showAs="codice_penale"/>');

            done();
        });
    });
});
