/*
 * Session Routes
 */

'use strict';

var express = require('express'),
    userAuthRouter = express.Router(),
    UserAuthProvider = require('../modules/user_auth.js');



userAuthRouter.get('/session/new', function(req, res) {

    var username = req.query.name,
        password = req.query.password;

    UserAuthProvider.validateRequest(username, password, function (result) {
        res.json(result);
    });
});


userAuthRouter.get('/users/new', function(req, res) {

    var username = req.query.username,
        firstname=req.query.firstname,
        lastname=req.query.lastname,
        password = req.query.password,
        emailid=req.query.emailid,
        sex=req.query.sex,
        age=req.query.age;

    UserAuthProvider.createNewUser( username,firstname,lastname, password,emailid,sex,age, function (result) {
        res.json(result);
    });
});

module.exports = userAuthRouter;