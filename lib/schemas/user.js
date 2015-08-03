var mongoose = require('mongoose');

var request = require('request');


// simple but incomplete email regexp:
var emailRegexp = /.+\@.+\..+/;


var UserSchema = new mongoose.Schema({
    username: {type: String, unique: true,required: true},
    firstname: {type: String,required: true},
    lastname: {type: String},

    password: {type: String,required: true},
    emailid: {
        type: String,
        required: true,
        match: emailRegexp
    },
    gender: {
        type: String,
        required: true
    },
    age: {type: Number, required: true}


});


module.exports =UserSchema;