/*
 * Session Routes
 */

'use strict';

var express = require('express'),
    userAuthRouter = express.Router(),
    userAuthProvider = require('../modules/user_auth.js');

var maxUsersPerPage = 5;

// simple but incomplete email regexp:
var emailRegexp = /.+\@.+\..+/;            //useful for pattern match validation for accepting email id.

module.exports = function(app) {
    app.dynamicHelpers({
        session: function(req, res) {
            return req.session;
        }
    });

    userAuthRouter.get('/session/new', notLoggedIn, function(req, res) {  //triggered for login requests
        res.render('session/new', {title: "Log in"});
    });



    userAuthRouter.post('/session', notLoggedIn, function(req, res) {  //triggered for post requests on login. We validate through a simple db call. passing username,pw.
        console.log('request for login reaches here');
        userAuthProvider.validateRequest(hashTag, function (result) {
            res.json(result);
        });
    });



    userAuthRouter.del('/session', function(req, res, next) {  //deleting the profile.
        req.session.destroy();
        res.redirect('/users');
    });
};



/*
 * User Routes
 */







module.exports = function(app) {

    /*  // This is simplified version of Getting all users. Next routine is paged display, and it is enabled.
     app.get('/users', function(req, res, next){
     User.find({}, function(err, users) {  //find is a default function available as part of Model.By specifying empty params, you are saying to get all data. Optionally, you can specify the sorting order also as User.find({}).sort('name', 1).exec(func{ ....}
     if (err) {
     return next(err);
     }
     res.render('users/index', {title: 'Users', users: users});
     });
     });

     */


    userAuthRouter.get('/users', function(req, res, next){
        var page = req.query.page && parseInt(req.query.page, 10) || 0;

        async.parallel([
                function(next) {
                    User.count(next);
                },

                function(next) {
                    User.find({})
                        .sort('name')
                        .skip(page * maxUsersPerPage)
                        .limit(maxUsersPerPage)
                        .exec(next);
                }
            ],
// final callback
            function(err, results) {
                if (err) {
                    return next(err);
                }

                var count = results[0];
                var users = results[1];

                var lastPage = (page + 1) * maxUsersPerPage >= count;

                res.render('users/index', {
                    title: 'Users',
                    users: users,
                    page: page,
                    lastPage: lastPage
                });
            }
        );  //end of async.parallel execution.


    });





    userAuthRouter.get('/users/new',not_logged_in,function(req, res) {
        res.render('users/new', {title: "New User"}); //currently, this is not working, as there is no users\new jade file is there
    });


    userAuthRouter.get('/users/:name',load_user,function(req, res, next){
        res.render('users/profile', {title: 'User profile', user: req.user});
    });


    /* primitive method of searching in database, and then allow creation of new profile. This method won't handle race condition in check and create
     app.post('/users',not_logged_in, function(req, res) {
     User.findOne({username: req.body.username}, function(err, user) {
     if (err) {
     return next(err);
     }
     if (user) {
     return res.send('Conflict', 409);
     }
     User.create(req.body, function(err) {
     if (err) {
     return next(err);
     }
     res.redirect('/users');
     });
     });
     });

     */

    /*better method for creating profile */

    userAuthRouter.post('/users',not_logged_in, function(req, res) {

        console.log('arun.bio body value is ' + req.body.gender2);
        User.create(req.body, function(err) {
            if (err) {
                if (err.code === 11000) {
                    res.send('Conflict', 409);
                } else if (err.name === 'ValidationError') {
                    return res.send(Object.keys(err.errors).map(function(errField) {
                        return err.errors[errField].message;
                    }).join('. '), 406);
                } else {
                    next(err);
                }
                return;
            }
            res.redirect('/users');
        });
    });






    userAuthRouter.del('/users/:name', load_user,restrict_self, function(req, res, next) {
        req.user.remove(function(err) {    //wondering, how req object has user attribute?. that's magic of load_user(), who finds user from database, and save as part of request object for our reference here.
            if (err) { return next(err); }
            res.redirect('/users');
        });
    });

};
