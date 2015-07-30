var mongoose = require('mongoose');

var request = require('request');


// simple but incomplete email regexp:
var emailRegexp = /.+\@.+\..+/;


var UserSchema = new mongoose.Schema({
    username: {type: String, unique: true},
    firstname: {type: String},
    lastname: {type: String},

    password: {type: String},
    emailid: {
        type: String,
        required: true,
        match: emailRegexp
    },
    gender: {
        type: String,
        uppercase: true,
        'enum': ['M', 'F']
    },
    age: {type: String, required: true}


});


module.exports =UserSchema;