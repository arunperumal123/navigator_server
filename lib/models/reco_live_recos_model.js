var mongoose = require('mongoose');
var reco_trending_now_schema = require('../schemas/reco_trending_now_schema');
var trending_now_model = mongoose.model('trending_now_programs', reco_trending_now_schema);
module.exports = trending_now_model;
