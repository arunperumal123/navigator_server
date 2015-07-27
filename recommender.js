var request = require('request');
var inspect = require('util').inspect;
var fs = require('fs');
var mongoose = require('mongoose')
var async = require('async');
var CronJob = require('cron').CronJob;


var live_recos_model = require('lib/models/reco_live_recos_model');
var users_pref_profile_model = require('lib/models/reco_users_pref_profile_model');
var users_usage_model = require('lib/models/reco_users_usage_model');

var epg_data_available_days = 14;



recommender = function()
{
  this.dbURL = 'mongodb://localhost:27017/usage_trend_and_reco';
  this.date;
  this.db;
  this.chan_pages_read=0;
  this.max_db_concurrency=5;
  this.channel_data_output =[];

  this.channel_no_index=0;

};




recommender.prototype.get_date = function(offset)
{
   var full_date = new Date();
   full_date.setDate(full_date.getDate() + offset);
   var day = full_date.getDate();
   var month = full_date.getMonth() + 1;
   var calculated_date = full_date.getFullYear()+ "-" + month+ "-"+ full_date.getDate();
   return calculated_date;
};



recommender.prototype.update_usage = function(username)
{
       //called by user to update usage , every 1 hour (production) , lab - 2 mins
       //update usage db
}



recommender.prototype.update_pref_matrix = function()
{
  //create cron job
  // prune usage history of each user
  // update pref database in details.

};


recommender.prototype.refresh_recommendations() = function()
{

	//create cron job
	//refresh recommendations periodically /production - 1 hour. lab - 5 mins
	//calculate pref value for each program for each user.
	//update top 5 for each users.
}




recommender.prototype.trending_now()   = function()
{

	//returns top watched programs right now.

}


var myrecommender = new recommender();
myrecommender.update_pref_matrix();
myrecommender.refresh_recommendations();




module.exports = recommender;

