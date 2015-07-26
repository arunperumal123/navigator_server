var mongoose = require('mongoose');

var request = require('request');



var users_live_reco_schema = new mongoose.Schema({
	users_id: {type: String,unique: true},
        facebook_ref_id: {type: String,unique:true},
        reco_programs:   [
           {
		   program_id: {type: String,unique:true},
                   program_title: {type:Integer}
           }
         ],
  });

module.exports = users_live_reco_schema;
