var Connection = require("./index");
var fs = require("fs");

var options = {
    host: "sinatra.cirsfid.unibo.it",
    port: 8080,
    rest: "/exist/rest",
    auth: "admin:exist"
};

var connection = new Connection(options);
var xquery = fs.readFileSync("../../data/xql/list_documents.xql", "UTF-8");
var query = connection.query(xquery, { chunkSize: 100 });

query.bind("userName", "admin");
query.bind("password","exist");
query.bind("requestedCollection","/db");

query.on("error", function(err) {
    console.log("An error occurred: " + err);
});

query.each(function(ajax_response) {
	console.log(ajax_response);
});