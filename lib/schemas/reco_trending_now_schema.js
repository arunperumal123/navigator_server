var mongoose = require('mongoose');

var request = require('request');

var trending_now_programs = new mongoose.Schema({
	users_id: {type: String,unique: true},
	      program_id:  {type:String},
          pgm_time : {type: String},
		  pgm_date :{type: String}
        });

module.exports = trending_now_programs;