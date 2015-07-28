var mongoose = require('mongoose');

var request = require('request');



var epg_data_schema = new mongoose.Schema(
	             {
	                channel_index: {type: String},
	                program_id: {type: String},  //need to find a unique identifier
                        program_synopses_id: {type: String},
                        genre: {type: String},
                        title: {type: String},
                        start_time: {type: String},
                        end_time:  {type: String},
                        audio_type: {type: String},
                        exhibition: {type: String},
                        cast:       {type: String},
                        director:   {type: String},
    			synopsis:   {type: String}
                     }  
);

epg_data_schema.virtual('date')
                         .get(function() {
                             if (this.start_time) {
                                var tokens = this.start_time.split("T");
                                return tokens[0];
                             }
                           })
                          .set(function(date) {
			    	this.date = date;
			  });   	

module.exports = epg_data_schema;  
