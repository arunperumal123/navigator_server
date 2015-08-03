var mongoose = require('mongoose');
var UserSchema = require('../schemas/user');
var User = mongoose.model('UserCollection', UserSchema);
module.exports = User;
