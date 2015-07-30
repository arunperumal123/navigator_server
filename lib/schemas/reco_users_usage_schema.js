var mongoose = require('mongoose');

var request = require('request');



var users_usage_schema = new mongoose.Schema({
	users_id: {type: String,unique: true},
        facebook_ref_id: {type: String,unique:true},
        viewing_history: [
	   {
	      program_id:  {type:String},
              viewed_date: {type:String},
              last_viewed_time : {type: String},
              duration:    {type: String},   //minutes
            }
         ]    
        });

module.exports = users_usage_schema;
