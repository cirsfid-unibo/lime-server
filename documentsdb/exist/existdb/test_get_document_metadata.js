var Connection = require("./index");
var fs = require("fs");

var options = {
    host: "137.204.140.124",
    port: 8080,
    rest: "/exist/rest",
    auth: "admin:exist"
};

var connection = new Connection(options);
var xquery = fs.readFileSync("../../data/xql/get_document_metadata.xql", "UTF-8");
var query = connection.query(xquery, { chunkSize: 100 });

query.bind("userName", "provanew@lime.com");
query.bind("userPassword","prova");
query.bind("requestedFile","/db/wawe_users_documents/provanew.lime.com/diff/consolidamento/0.uy_bill_2008.xml");

query.on("error", function(err) {
    console.log("An error occurred: " + err);
});

query.each(function(ajax_response) {
	console.log(ajax_response);
});