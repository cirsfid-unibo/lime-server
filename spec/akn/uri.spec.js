
describe('AKN uri -> NIR urn conversion', function () {
    var utils = require('./utils.js');

    it('should convert simple uri to urn', done => {
        utils.convertUri('/akn/it/act/2015-05-22/68/!main', urn => {
            expect(urn).toEqual('urn:nir:stato:legge:2015-05-22;68');
            done();
        });
    });

    it('should convert uri with subtype to urn', done => {
        utils.convertUri('/akn/it/act/decreto.legislativo/2015-05-22/68/!main', urn => {
            expect(urn).toEqual('urn:nir:stato:decreto.legislativo:2015-05-22;68');
            done();
        });
    });

    it('should convert uri with subtype and author to urn', done => {
        utils.convertUri('/akn/it/act/decreto/presidente.repubblica/1988-09-22/447/!main', urn => {
            expect(urn).toEqual('urn:nir:presidente.repubblica:decreto:1988-09-22;447');
            done();
        });
    });

    it('should convert uri with attachment to urn', done => {
        utils.convertUri('/akn/it/act/2015-05-22/68/!allegato1', urn => {
            expect(urn).toEqual('urn:nir:stato:legge:2015-05-22;68:allegato1');
            done();
        });
    });

    it('should convert uri with version to urn', done => {
        utils.convertUri('/akn/it/act/legge/2015-05-22/68/ita@2015-05-29/!main', urn => {
            expect(urn).toEqual('urn:nir:stato:legge:2015-05-22;68@2015-05-29');
            done();
        });
    });
});
