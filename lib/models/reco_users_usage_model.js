var mongoose = require('mongoose');
var users_usage_schema = require('../schemas/reco_users_usage_schema');
var users_usage_model = mongoose.model('users_usage', users_usage_schema);
module.exports = users_usage_model;
