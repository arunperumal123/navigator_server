var mongoose = require('mongoose');
var channel_data_schema = require('../schemas/channel_data_collection_schema');
var channel_data_model = mongoose.model('Channel_List', channel_data_schema);
module.exports = channel_data_model;
