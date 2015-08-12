var mongoose = require('mongoose');

var request = require('request');

var reco_programs_schema = new mongoose.Schema(
	             {
	                channel_index: {type: String},
	                program_id: {type: String},  //need to find a unique identifier
                    genre: {type: String},
                    title: {type: String},
                    start_time: {type: String},
                    end_time:  {type: String},
                    audio_type: {type: String},
                    exhibition: {type: String},
                    cast:       {type: String},
                    director:   {type: String},
					synopsis:   {type: String},
					preference:  {type: String}
                }  
);

var reco_live_recos_schema = new mongoose.Schema({
	users_id: {type: String,unique: true},
        reco_programs: [reco_programs_schema]
        });
module.exports = reco_live_recos_schema;
