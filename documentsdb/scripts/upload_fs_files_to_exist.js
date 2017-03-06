// Script used to upload recursively all files from filesystem to existdb
var exist = require('../utils/backend_exist.js'),
  recursive = require('recursive-readdir'),
  asyncLib = require('async'),
  path = require('path'),
  fs = require('fs');

if (process.argv.length < 3) {
  console.error('Missing source folder! \nUsage: script.js folder');
  process.exit();
}

var sourceDir = process.argv[2];

recursive(sourceDir, function (err, files) {
    if (err) throw err;
    var total = files.length;
    console.log('Files to upload: ' +total);
    asyncLib.eachSeries(files, function(item, callback) {
      var pathRelative = path.relative(sourceDir, item);
      var dirName = '/'+path.dirname(pathRelative);
      var fileName = path.basename(pathRelative);
      exist.putFile(fs.createReadStream(item), dirName, fileName, function(err) {
        if (err) console.error('>>> ERROR in uploading '+pathRelative, err);
        else console.log('Uploaded '+pathRelative);
        callback();
      });
    });
});
