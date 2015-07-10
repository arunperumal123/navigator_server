var User = require('../data/models/user');

var notLoggedIn = require('./middleware/not_logged_in');
//var users = require('../data/users');
var load_user = require('./middleware/load_user');
var restrict_self = require('./middleware/restrict_to_self');

var async = require('async');
function userAuthProvider () {}

userAuthProvider.prototype.validateRequest = function () {
        User.findOne({username: req.body.username, password: req.body.password},
            function (err, user) {
                console.log('response arrived');
                if (err) {
                    console.log('user not found');
                    return next(err);
                }
                if (user) {
                    console.log('user found.loading user');
                    req.session.user = user;
                    res.redirect('/users');
                } else {
                    res.redirect('/session/new');
                }
            });
    };
