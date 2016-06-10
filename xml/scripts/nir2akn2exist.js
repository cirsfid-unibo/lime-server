// Convert all files in [path] with nir2akn and upload them to [existUrl]
// Script in ES6, execute with "babel-node xml/scripts/nir2akn2exist.js"

var glob = require('glob'),
    request = require('sync-request'),
    fs = require('fs'),
    nir2akn = require('../xml/nir.js').nir2akn;

const path = 'Norma_2016-new/';
const existUrl = 'http://sinatra.cirsfid.unibo.it:8080/exist/rest/julyportal_cassazione/'
const auth = 'Basic ' + new Buffer('admin:exist').toString('base64');

var files = glob.sync(path + '**/*!(nif).xml', {
  ignore: '**/*nif.xml'
});
// var files = glob.sync(path + '**/155_20110706/S2110095/S2110095.xml');
console.log(files.length);

var documents = files.map(file => ({
    path: file,
    filename: file.substring(file.indexOf('/') + 1),
    nir: fs.readFileSync(file, { encoding: 'utf8' })
}));


function next () {
    if (documents.length == 0) return;
    var doc = documents.pop();
    nir2akn(doc.nir, (err, akn) => {
        if (err) console.log(doc.filename, err);
        else {
            // console.log('akn', akn.substring(0, 1400));
            var res = request("PUT", existUrl + doc.filename, {
                body: akn,
                headers: { 'Authorization': auth }
            });
            console.log(doc.filename, res.statusCode);
        }
        next();
    });
}
next ();
