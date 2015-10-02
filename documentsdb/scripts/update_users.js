
// Script to change all users password in db.users to the hash of itself.
// This is used for data migration.

var db = require('../utils/mongodb.js'),
    bcrypt = require('bcryptjs');

setTimeout(function () {
    db.users.find({}).toArray(function (err, results) {
        results.forEach(function (user) {
            console.log(user.username);
            db.users.update({username:user.username}, {
                $set: {
                    password: bcrypt.hashSync(user.password)
                }
            });
        })
    });
}, 2000)













