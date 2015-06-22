/*
 * Copyright (c) 2014 - Copyright holders CIRSFID and Department of
 * Computer Science and Engineering of the University of Bologna
 * 
 * Authors: 
 * Monica Palmirani – CIRSFID of the University of Bologna
 * Fabio Vitali – Department of Computer Science and Engineering of the University of Bologna
 * Luca Cervone – CIRSFID of the University of Bologna
 * 
 * Permission is hereby granted to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The Software can be used by anyone for purposes without commercial gain,
 * including scientific, individual, and charity purposes. If it is used
 * for purposes having commercial gains, an agreement with the copyright
 * holders is required. The above copyright notice and this permission
 * notice shall be included in all copies or substantial portions of the
 * Software.
 * 
 * Except as contained in this notice, the name(s) of the above copyright
 * holders and authors shall not be used in advertising or otherwise to
 * promote the sale, use or other dealings in this Software without prior
 * written authorization.
 * 
 * The end-user documentation included with the redistribution, if any,
 * must include the following acknowledgment: "This product includes
 * software developed by University of Bologna (CIRSFID and Department of
 * Computer Science and Engineering) and its authors (Monica Palmirani, 
 * Fabio Vitali, Luca Cervone)", in the same place and form as other
 * third-party acknowledgments. Alternatively, this acknowledgment may
 * appear in the software itself, in the same form and location as other
 * such third-party acknowledgments.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var express = require('express'),
    bcrypt = require('bcryptjs'),
    passport = require('passport'),
    BasicStrategy = require('passport-http').BasicStrategy,
    Boom = require('boom'),
    VError = require('verror'),
    db = require('../utils/mongodb.js'),
    config = require('../config.json').users;

var router = express.Router();

// User object:
// { 
//     username: string,            Username/Email
//     password: string,            Password hash
//     properties: {                Read only configuration
//        folders: [ string... ]    Folders the user can read/write
//     },
//     preferences: {               User defined writable configuration
//        ...
//     }
// }


// Register a new user.
// POST /Users
// {
//    username: string
//    password: string
//    preferences: generic object
// }
router.post('/', function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;

    var preferences = req.body.preferences || {};

    if (!username) return next(Boom.badRequest('Missing username parameter'));
    if (!password) return next(Boom.badRequest('Missing password parameter'));

    db.users.updateOne({
        username: username
    }, {
        $setOnInsert: { 
            username: username,
            password: hash(password),
            preferences: preferences
        }
    }, { 
        upsert: true
    }, function (err, r) {
        if (err)
            next(new VError(err, 'Error registering user'));
        else if (r.upsertedCount == 0)
            next(Boom.badRequest('User already exists'));
        else
            res.send('User created').end();
    });
});

// Passport middleware authentication strategy 
passport.use(new BasicStrategy(function (username, password, next) {
    db.users.findOne({
        username: username
    }, function(err, user) {
        if (err) 
            next(new VError(err, 'Error searching for user'));
        else if (!user || !checkPassword(password, user.password))
            next(undefined, false)
        else {
            user.properties = {
                folders: ['/' + user.username + '/'].concat(config.shared_folders)
            }
            next(undefined, user);
        }
    });
}));




router.use(passport.initialize());
router.use(passport.authenticate('basic', { session: false }));

router.param('user', function (req, res, next, username) {
    if (!req.user)
        next(Boom.unauthorized('Basic auth failed'));
    else if (req.user.username != username)
        next(Boom.unauthorized('You can only access your user'));
    else next();
});

// Get user informations.
// GET /Users/marco@gmail.com
// Basic access authentication required (Http Authorization header)
// -> { 
//    username: string
//    password: string
//    preferences: generic object
//    properties: generic object
// }
router.get('/:user', function (req, res, next) {
    res.json({
        username: req.user.username,
        properties: req.user.properties,
        preferences: req.user.preferences
    }).end();
});

// Update user informations.
// PUT /Users/marco@gmail.com
// Basic access authentication required (Http Authorization header)
// {
//    password: string
//    preferences: generic object
// }
router.put('/:user', function (req, res, next) {
    var query = { username: req.user.username };
    var operation = {
        $set: {
            preferences: req.body.preferences || req.user.preferences,
            password: (req.body.password ? hash(req.body.password) : req.user.password)
        }
    }
    db.users.updateOne(query, operation, function (err, result) {
        if (err)
            next(new VError(err, 'Error updating user'));
        else
            res.send('Ok').end();
    });
});

exports.router = router;


// Private hash functions
// We use caching to improve performance.
function checkPassword(password, passwordHash) {
    return hash(password) == passwordHash;
}

function hash (password) {
    if (!hashCache[password]) {
        if (Object.keys(hashCache).length > 10000)
            hashCache = {};
        hashCache[password] = bcrypt.hashSync(password);
    }
    return hashCache[password];
}
