var User = require('../models/user');

var dbURL = 'mongodb://localhost:27017/epg_data_collection';




var mongoose = require('mongoose');
mongoose.connect(dbURL);
db=mongoose.connection;

function UserAuthProvider () {}

UserAuthProvider.prototype.validateRequest = function (username, password, callback) {


    User.findOne({username: username, password: password}, function (err, user) {
        console.log('response arrived');
        if (err) {
            console.log('user not found');
            callback(err);
        }
        if (user) {
            console.log('user found.loading user');
            callback(user);

        }
    });
};

UserAuthProvider.prototype.createNewUser = function (username,firstname,lastname, password,emailid,sex,age,callback) {

    User.create(
        {
            username: username,
            firstname: firstname,
            lastname: lastname,
            password: password,
            emailid: emailid,
            gender: sex,
            age: age


        }, function (err) {
            if (err) {
                console.log('error in inserting data' + err.code);
                callback(err);
            }
            else {
                console.log("insert seems successful");
                callback('insert seems successful');
            }
        }
    );

};

module.exports = new UserAuthProvider();