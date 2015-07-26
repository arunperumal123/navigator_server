var mongoose = require('mongoose');
var users_pref_profile_schema = require('../schemas/reco_users_pref_profile_schema');
var users_pref_profile_model = mongoose.model('users_pref_profile', users_pref_profile_schema);
module.exports = users_pref_profile_model;
