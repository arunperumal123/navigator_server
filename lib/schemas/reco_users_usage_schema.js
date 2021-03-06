var mongoose = require('mongoose');

var request = require('request');

var viewing_history_schema = new mongoose.Schema({
	      program_id:  {type:String},
              viewed_date: {type:String},
              last_viewed_time : {type: String},
              duration:    {type: String},   //minutes
          });

var users_usage_schema = new mongoose.Schema({
	users_id: {type: String,unique: true},
        /*facebook_ref_id: {type: String},*/
        viewing_history: [viewing_history_schema]
        });

module.exports = users_usage_schema;
