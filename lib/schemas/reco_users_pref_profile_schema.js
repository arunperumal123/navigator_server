var mongoose = require('mongoose');

var request = require('request');



var users_pref_profile_schema = new mongoose.Schema({
	users_id: {type: String,unique: true},
        facebook_ref_id: {type: String,unique:true},
        genre:   [
           {
		   genre_name: {type: String,unique:true},
                   genre_index: {type:Integer}
           }
         ],
         
        cast:   [
           {
		   actor_name: {type: String,unique:true},
                   actor_index: {type:Integer}
           }
         ],

        director:   [
           {
		   director_name: {type: String,unique:true},
                   director_index: {type:Integer}
           }
         ],

        title_words:   [
           {
		   title_word_name: {type: String,unique:true},
                   title_word_index: {type:Integer}
           }
         ]
    
  });

module.exports = users_pref_profile_schema;
