require('colors');

var exist = require('./backend_exist.js');
var Readable = require('stream').Readable;
var Writable = require('stream').Writable;

// Characters to test: !#$&\'()*+,:;=?@[]è
var file = 'ci!#$&\'()*+,:;=?@[]èao.xml';
var file = 'ci#ao.xml';
var file = 'ci:ao.xml';
var file = '\'.xml';
var file = 'ci\'ao.xml';


var file = '!#$&\'()*+,:;=?@[]è';
var path = '/!#$&\'()*+,:;=?@[]€';

var file = 'ciao.xml';
var path = '/126 Suppl.Ord.';
var content = '<hello>World</hello>';

console.log(file.yellow);

step1();

// Save file
function step1 () {
    var input = new Readable();
    input.push(content);
    input.push(null);

    exist.putFile(input, path, file, function (err) {
        if (err) console.log(err);
        else {
            console.log('Saving file ok'.green);
            step2();
        }
    });
}

// List files
function step2 () {
    exist.getDir(path + '/', function (err, files) {
        if (err) {
            console.log(err);
        } else if (files.indexOf(path+'/'+file) == -1) {
            console.log('Reading dir failed'.red);
            console.log(files);
        } else {
            console.log('Reading dir ok'.green);
            step3();
        }
    });
}

// Read file;
function step3 () {
    var data = '';
    var output = new Writable();
    output._write = function (chunk, encoding, done) {
        data += chunk.toString();
        done();
    };

    output.on('error', function (err) {
        console.log('err'.blue);
        console.log(err);
    });

    exist.getFile(output, path, file, function (err) {
        if (err) {
            console.log(err.red);
        } else if (data != content) {
            console.log('Wrong content'.red);
            console.log(data);
        } else {
            console.log('Reading file ok'.green);
        }
    });
}
