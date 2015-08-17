var mongoose = require('mongoose');
var reco_live_recos_schema = require('../schemas/reco_live_recos_schema');
var reco_live_recos_model = mongoose.model('reco_live_recos_schema', reco_live_recos_schema);
module.exports = reco_live_recos_model;
