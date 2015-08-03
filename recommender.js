var request = require('request');
var inspect = require('util').inspect;
var fs = require('fs');
var mongoose = require('mongoose');
var async = require('async');
var CronJob = require('cron').CronJob;


var live_recos_model = require('./lib/models/reco_live_recos_model');
var users_pref_profile_model = require('./lib/models/reco_users_pref_profile_model');
var users_usage_model = require('./lib/models/reco_users_usage_model');
var epg_index_model = require('./lib/models/index');

var epg_data_available_days = 14;



recommender = function()
{
    this.date;
    this.max_db_concurrency=5;
  this.init_pref_matrix_cron_job();
  this.init_live_recommender_cron_job();


};


recommender.prototype.init_pref_matrix_cron_job = function()
{
      var self = this;

      //setting up periodic timer to refresh the date information   
      var job = new CronJob({
                     cronTime: '*/5 * * * * *',
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
      console.log('let me search for one entry here.coming with id as '+user+ 'do i have model here');
     var query = { users_id: user}; 
       users_usage_model.findOneAndUpdate(query,{users_id:user},{upsert:true},function(err,doc)
       {
	    console.log('got the user id');
      	    var history_length;
	    
	    if(doc.viewing_history) {
                console.log(' no of entries in usage db as of now is '+doc.viewing_history.length);
            }
	    else {
		   history_length =0;
	    }

	    for (var i = 0 ; i < usage.length; i++)
	    {
	
	            var item = { program_id :usage[i].program_id,
                                 viewed_date:usage[i].viewed_date,
	                         last_viewed_time: usage[i].last_viewed_time,
	                         duration: usage[i].duration
	                      } 
	
	
		    users_usage_model.update({users_id:user},{$push:{viewing_history:item}},{upsert:true}
						                      ,function(err,response) {
				console.log('saved the entry '+item);
				if(err) {
	                            console.log('error in updating the usage.error is '+err);
                                }
                      });
             }		    
        });

}

recommender.prototype.search = function include(arr, obj) {
    for(var i=0; i<arr.length; i++) {
        if (arr[i].name == obj)
	       	return i;
    }
    return -1;
}



recommender.prototype.update_pref_matrix = function()
{
       var self = this;	
       users_usage_model.find({},function(err,docs)
       {
          console.log('no of users needs recommendation badly is '+docs.length);
            
	  for (var i =0; i < docs.length; i++)
	  {
	       var doc = docs[i];
	       var usage_users_id = doc.users_id;	  
               console.log('lets dump their history right now.history length is '+doc.viewing_history.length);
	       for (var j =0;j<doc.viewing_history.length;j++)
	        {
		      console.log('program id of the program watched is '+doc.viewing_history[j].program_id);
                      epg_index_model.getProgramInfo(null,doc.viewing_history[j].program_id,function(doc) {
		   	      var cast_insert_position=0;
			      if(doc) {
				      var cast_info = doc.cast.split(",");
				      var director_info = doc.director;
				      var genre_info = doc.genre;
				      var title_info = doc.title.split(" ");


                                      users_pref_profile_model.findOneAndUpdate( {users_id:usage_users_id},{users_id:usage_users_id},{upsert:true,new:true}
						                      ,function(err,doc) {
				           console.log('got the entry '+doc);
                                           var index;

						 console.log('the cast name is '+cast_info[0]);  
                                                 if(doc.cast) {
					             index =  self.search(doc.cast,cast_info[0]);
		                                     if(index != -1) {
			                                   mycast.cast_index = doc.cast[index].cast_index + 3;
						           doc.cast[index].cast_index += 3;
		                                      }
	                                              else {
		                                          doc.cast.push({name:cast_info[0],cast_index:3});
	                                               }
				                    }
					            else {
		                                       doc.cast.push({name:cast_info[0],cast_index:3});
                                                     }
					            
				                     doc.save();


  	                             });
                              }
                       });       
                }
            }
        });
}


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


recommender.prototype.test_recommender = function()
{
  console.log(' testing the recommender ');
  var usage = [];

  var element1 = {program_id:"1719998813",viewed_date:"2015-08-02",last_viewed_time:"00:15",duration:600};
  var element2 = {program_id:"1719998814",viewed_date:"2015-08-02",last_viewed_time:"03:15",duration:1200};
  var element3 = {program_id:"1752453850",viewed_date:"2015-08-02",last_viewed_time:"02:00",duration:400};

  usage.push(element1);
  usage.push(element2);
  usage.push(element3);

  this.update_usage("123",usage);

}

//expose to outside world.
exports.recommender = recommender;


