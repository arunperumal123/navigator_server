var mongoose = require('mongoose');

var request = require('request');



var reco_trending_now_schema = new mongoose.Schema({
	channel_index: {type: String,unique: true},
        program_id:    {type: String,unique:true},
        program_title: {type:String},
        live_viewing:  {type:Number}
  });

module.exports = reco_trending_now_schema;
