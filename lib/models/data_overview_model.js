var mongoose = require('mongoose');
var data_overview_schema = require('../schemas/data_overview_schema');
var data_overview_model = mongoose.model('Channel_List',data_overview_schema);
module.exports = data_overview_model;
