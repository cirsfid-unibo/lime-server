// Script used to extract all <num> tags in a dataset
var glob = require('glob'),
    colors = require('colors'),
    fs = require('fs'),
    xmldom = require('xmldom'),
    utils = require('../../spec/nir/utils.js');

const path = 'Norma_*/';

var files = glob.sync(path + '**/*!(nif).xml', {
    ignore: '**/*nif.xml'
});

files.forEach(file => {
    console.log('file', file);
    var nir = fs.readFileSync(file, { encoding: 'utf8' });
    var dom = utils.parse(nir);
    var results = utils.select('//nir:num/text()', dom);
    results.forEach(r => {
      console.log(utils.serialize(r));
    });
});
