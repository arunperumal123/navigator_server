var mongoose = require('mongoose');
var epg_data_schema = require('../schemas/epg_data_collection_schema');
var epg_data_model = mongoose.model('EPG_collection', epg_data_schema);
module.exports = epg_data_model;
