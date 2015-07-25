var mongoose = require('mongoose');

var request = require('request');



var channel_data_schema = new mongoose.Schema({
	channel_id: {type: String,unique: true},
        channel_number: {type: String,unique:true},
        channel_name: {type: String},
        channel_logo_id: {type: String},
        });

module.exports = channel_data_schema;
