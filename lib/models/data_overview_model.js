var mongoose = require('mongoose');
var data_overview_schema = require('../schemas/data_overview_schema');
var data_overview_model = mongoose.model('epg_overview_information',data_overview_schema);
module.exports = data_overview_model;
