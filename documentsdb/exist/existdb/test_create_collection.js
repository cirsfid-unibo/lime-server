var Connection = require("./index");
var fs = require("fs");

var options = {
    host: "137.204.140.124",
    port: 8080,
    rest: "/exist/rest",
    auth: "admin:exist"
};

var connection = new Connection(options);
var xquery = fs.readFileSync("../../data/xql/create_collection.xql", "UTF-8");
var query = connection.query(xquery, { chunkSize: 100 });

query.bind("userName", "admin");
query.bind("password","exist");
query.bind("collectionName","testCollection");

query.on("error", function(err) {
    console.log("An error occurred: " + err);
});

query.each(function(ajax_response) {
	console.log(ajax_response);
});