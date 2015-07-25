var mongoose = require('mongoose');

var request = require('request');



var data_overview_schema = new mongoose.Schema({
	data_provider: {type: String},
        data_start_date: {type: String},
        data_available_days: {type: String},
        data_available_channels: {type: String},
        data_region:             {type:String}
        });

module.exports = data_overview_schema;
