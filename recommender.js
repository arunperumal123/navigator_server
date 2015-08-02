var request = require('request');
var inspect = require('util').inspect;
var fs = require('fs');
var mongoose = require('mongoose')
var async = require('async');
var CronJob = require('cron').CronJob;


var live_recos_model = require('./lib/models/reco_live_recos_model');
var users_pref_profile_model = require('./lib/models/reco_users_pref_profile_model');
var users_usage_model = require('./lib/models/reco_users_usage_model');

var epg_data_available_days = 14;



recommender = function()
{
  this.dbURL = 'mongodb://localhost:27017/usage_trend_and_reco';
  this.date;
  this.db;
  this.max_db_concurrency=5;

  this.init_pref_matrix_cron_job();
  this.init_live_recommender_cron_job();


};


recommender.prototype.init_pref_matrix_cron_job = function()
{
      var self = this;

      //setting up periodic timer to refresh the date information   
      var job = new CronJob({
                     cronTime: '0 */2 * * * *',
                      onTick: function() {
                              /*
                               * Runs every 2 mins
                               * 
                              */
      console.log('cron job. trigger.lets brush and refresh preference matrix');
      self.update_pref_matrix(self);
                        },
                         start: false,
                         timeZone: 'Asia/Kolkata'
                       });

      job.start();
}


recommender.prototype.init_live_recommender_cron_job = function()
{
    var self = this;

      //setting up periodic timer to refresh the date information   
      var job = new CronJob({
                     cronTime: '0 */3 * * * *',
                      onTick: function() {
                              /*
                               * Runs every 3 mins
                               * 
                              */
      console.log('cron job. trigger.lets brush and refresh recommendations');
      self.refresh_recommendations(this);
                        },
                         start: false,
                         timeZone: 'Asia/Kolkata'
                       });

      job.start();
}






recommender.prototype.get_date = function(offset)
{
   var full_date = new Date();
   full_date.setDate(full_date.getDate() + offset);
   var day = full_date.getDate();
   var month = full_date.getMonth() + 1;
   var calculated_date = full_date.getFullYear()+ "-" + month+ "-"+ full_date.getDate();
   return calculated_date;
};



recommender.prototype.update_usage = function(user,usage)
{
       //called by user to update usage , every 1 hour (production) , lab - 2 mins
       //router should call this function , ONLY after validating , the user is in a Valid session.
       //update usage db
       
      users_usage_model.findOne({"users_id":user.user_id},function(err,doc)
       {
	    console.log('got the user id');
            history_length = doc.viewing_history.length;
	    for (var i = 0 ; i < usage.length; i++)
	    {
		    console.log(' no of entries in usage db as of now is '+doc.viewing_history.length);
	
	            var item = { program_id :usage[i].program_id,
                                 viewed_date:usage[i].viewed_date,
	                         last_viewed_time: usage[i].last_viewed_time,
	                         duration: usage[i].duration
	                      } 
	
	
		    users_usage_model.findOneAndUpdate({users_id:user_id,viewing_history:item}
						                      ,function(err,response) {
				if(err) {
	                            console.log('error in updating the usage');
                                }
                      });
             }		    
        });

}



recommender.prototype.update_pref_matrix = function()
{
  //create cron job
  // prune usage history of each user
  // update pref database in details.

};


recommender.prototype.refresh_recommendations = function()
{

	//create cron job
	//refresh recommendations periodically /production - 1 hour. lab - 5 mins
	//calculate pref value for each program for each user.
	//update top 5 for each users.
}




recommender.prototype.trending_now   = function()
{

	//returns top watched programs right now.

}


var myrecommender = new recommender();


module.exports = recommender;

