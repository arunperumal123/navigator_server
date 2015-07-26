var mongoose = require('mongoose');
var live_recos_schema = require('../schemas/reco_live_recos_schema');
var live_reco_model = mongoose.model('live_recommendation', live_recos_schema);
module.exports = live_reco_model;
