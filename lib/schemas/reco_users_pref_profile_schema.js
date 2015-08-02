var mongoose = require('mongoose');

var request = require('request');

var genre_index_schema = new mongoose.Schema({
	name:  {type:String,unique:true},
        genre_index : {type:Number},
      });


var cast_index_schema = new mongoose.Schema({
	name:  {type:String,unique:true},
        cast_index : {type:Number},
      });


var director_index_schema = new mongoose.Schema({
	name:  {type:String,unique:true},
        director_index : {type:Number},
      });


var title_words_index_schema = new mongoose.Schema({
	name:  {type:String,unique:true},
        title_words_index : {type:Number},
      });


var users_pref_profile_schema = new mongoose.Schema({
	users_id: {type: String,unique: true},
        facebook_ref_id: {type: String,unique:true},
        genre:   [genre_index_schema],
        cast:    [cast_index_schema],
        director:   [director_index_schema],
        title_words:   [title_words_index_schema]
  });

module.exports = users_pref_profile_schema;
