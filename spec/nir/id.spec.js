
fdescribe('NIR Urn -> ID conversion', function () {
    var utils = require('./utils.js');

    it('should convert ids', done => {
        var expected = [
          'art_3',
          'art_321',
          'art_321bis',
          'art_321ter',
          'art_321quater',
          'art_321quinquies',
          'art_321sexies',
          'art_321septies',
          'art_321octies',
          'art_321nonies',
          'book_IV',
          'book_IVbis',
          'chp_IV',
          'title_IV',
          'chp_1',
          'chp_11',
          'chp_11__point_2bis',
          'chp_11__point_2',
          'chp_11__point_f',
          'chp_11__point_fbis'
        ];
        utils.convert('example.xml', akn => {
            var blocks = utils.select('//akn:body//*[@eId]', akn);
            blocks.forEach((el, i) => {
              var num = utils.serialize(utils.select('akn:num/text()', el, true));
              var eid = utils.selectAttr('@eId', el);
              console.log(i, num, eid);
              expect(eid).toEqual(expected[i]);
            });
            // console.log(utils.serialize(akn));
            done();
        });
    });
});
