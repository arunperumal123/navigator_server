var mongoose = require('mongoose');
var trending_now_schema = require('../schemas/reco_trending_now_schema');
var trending_now_model = mongoose.model('trending_now_programs', trending_now_schema);