console.log("11111111");
var request = require('request');
console.log("222");

var inspect = require('util').inspect;
console.log("333");

var fs = require('fs');
var mongoose = require('mongoose');
var async = require('async');
var CronJob = require('cron').CronJob;
console.log("444");


var live_recos_model = require('./lib/models/reco_live_recos_model');
console.log("555");

var users_pref_profile_model = require('./lib/models/reco_users_pref_profile_model');
console.log("666");

var users_usage_model = require('./lib/models/reco_users_usage_model.js');
console.log("777");

var epg_index_model = require('./lib/models/index');
console.log("888");


var epg_data_available_days = 14;
console.log("999");

console.log("last");

recommender = function()
{
    this.date;
    this.max_db_concurrency=5;
	
	//this.update_pref_matrix(this);
    this.refresh_recommendations(this);

	//this.init_pref_matrix_cron_job();
	//this.init_live_recommender_cron_job();
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
console.log("xxxxxxx");
       var self = this;	
       users_usage_model.find({},function(err,usage_docs)
       {
          console.log('no of users needs recommendation badly is '+usage_docs.length);
            
	  for (var i =0; i < usage_docs.length; i++)
	  {
	       var user_usage_doc = usage_docs[i];
	       var user_usage_id = user_usage_doc.users_id;	  
          
	               console.log('lets dump their history right now.history length is '+user_usage_doc.viewing_history.length);
	             for (var j =0;j<user_usage_doc.viewing_history.length;j++)
	              {
		              console.log('program id of the program watched is '+user_usage_doc.viewing_history[j].program_id);
                               epg_index_model.getProgramInfo(null,user_usage_doc.viewing_history[j].program_id,function(program_doc) {
		 	                

                                      users_pref_profile_model.findOneAndUpdate( {users_id:user_usage_id},{users_id:user_usage_id},{upsert:true,new:true}
						                      ,function(err,pref_profile_doc) {
											  
				       
				                 if(program_doc) {

				                    var cast_info = (program_doc.cast)?program_doc.cast.split(","): new Array();
				                    var director_info = program_doc.director;
				                    var genre_info =    program_doc.genre;
				                    var title_info = (program_doc.title)?program_doc.title.split(" "): new Array();

                                                    console.log('doc value is '+user_usage_doc);
						    console.log('j value is '+j);
						    var preference_bump =3; 
							//TODO. We got to calculate bump value as duration/constant. However, current code is asynchronous and it makes passing duration as a problem. 
							//Each sub module needs to be modularized and duration attribute has to be passed as param to maintain that. 
                                                    var index;

						    console.log('as of now, the doc looks as '+pref_profile_doc);
						    /*************update cast data *********************/
                                                    
						   for (var k =0; k<cast_info.length;k++)
					           { 

						        if(pref_profile_doc.cast) {
					                     index =  self.search(pref_profile_doc.cast,cast_info[k]);
		                                             if(index != -1) {
							 	 console.log('existing cast entry.updating existing stuff '+cast_info[k]);
						                 pref_profile_doc.cast[index].pref_index += preference_bump;
		                                             }
	                                                     else {
						                console.log('no existing cast entry.adding stuff '+cast_info[k]);
		                                                pref_profile_doc.cast.push({name:cast_info[k],pref_index:preference_bump});
	                                                     }
				                         }
					                 else {
							     console.log('pushing first cast entry with name'+cast_info[k]);
		                                             pref_profile_doc.cast.push({name:cast_info[k],pref_index:preference_bump});
                                                         }
						   }
                                                   /************ end of cast update *********************/
                

						    /*************update director data *********************/
                                                    
						        if(pref_profile_doc.director) {
					                     index =  self.search(pref_profile_doc.director,director_info);
		                                             if(index != -1) {
							 	 console.log('existing director entry.updating existing stuff '+director_info);
						                 pref_profile_doc.director[index].pref_index += preference_bump;
		                                             }
	                                                     else {
						                console.log('no existing director entry.adding stuff '+director_info);
		                                                pref_profile_doc.director.push({name:director_info,pref_index:preference_bump});
	                                                     }
				                         }
					                 else {
							     console.log('pushing first director entry with name'+director_info);
		                                             pref_profile_doc.director.push({name:director_info,pref_index:preference_bump});
                                                         }
                                                   /************ end of director update *********************/


						    /*************update genre data *********************/
                                                    
						        if(pref_profile_doc.genre) {
					                     index =  self.search(pref_profile_doc.genre,genre_info);
		                                             if(index != -1) {
							 	 console.log('existing genre entry.updating existing stuff '+genre_info);
						                 pref_profile_doc.genre[index].pref_index += preference_bump;
		                                             }
	                                                     else {
						                console.log('no existing genre entry. adding stuff '+genre_info);
		                                                pref_profile_doc.genre.push({name:genre_info,pref_index:preference_bump});
	                                                     }
				                         }
					                 else {
							     console.log('pushing first gnere entry with name'+genre_info);
		                                             pref_profile_doc.genre.push({name:genre_info,pref_index:preference_bump});
                                                         }
                                                   /************ end of genre update *********************/

						    /*************update title words data *********************/
                                                    
						   for (var k =0; k < title_info.length;k++)
					           { 

						        if(pref_profile_doc.title_words) {
					                     index =  self.search(pref_profile_doc.title_words,title_info[k]);
		                                             if(index != -1) {
							 	 console.log('existing title words entry.updating existing stuff '+title_info[k]);
						                 pref_profile_doc.title_words[index].pref_index += preference_bump;
		                                             }
	                                                     else {
						                console.log('no existing title words entry.adding stuff '+title_info[k]);
		                                                pref_profile_doc.title_words.push({name:title_info[k],pref_index:preference_bump});
	                                                     }
				                         }
					                 else {
							     console.log('pushing first title entry with name'+title_info[k]);
		                                             pref_profile_doc.title_words.push({name:title_info[k],pref_index:preference_bump});
                                                         }
						   }
                                                   /************ end of title words update *********************/

				   		    pref_profile_doc.save();
						 }

  	                                });
                                 });       
                        }
              }
        });
}


recommender.prototype.refresh_recommendations = function(username)
{
	username = "nc";//for testing
	console.log("refresh_recommendations");
	var recItems = new Array();
    var that = this;
	users_pref_profile_model.findOne({users_id:username},function(err, usage_docs) {
		//console.log("cast="+usage_docs.cast);


			//console.log("genre="+usage_docs.genre);
			//console.log("director="+usage_docs.director);
			//console.log("title_words="+usage_docs.title_words);
		epg_index_model.findSimilarPrograms(null, "empire", function(program_doc) { // replace with actualquery
		
			var len = program_doc.length;
			for(var i=0;i<len;i++) {
				var item = program_doc[i];
				var pref = 0;
				console.log("===============================================================");

				var title = (item.title)?item.title.split(" "): new Array();
				var cast = (item.cast)? item.cast.split(","): new Array();
				var genre = item.genre;
				var director = item.director;
				console.log("item.cast="+cast);
				for (var z=0; z < cast.length; z++) {
					index =  that.search(usage_docs.cast, cast[z]);
					if(index!=-1) {
					    pref += parseInt(usage_docs.cast[index].pref_index,10);	
					}
					console.log("cast ="+cast[z]+"="+index);
				}
				
				console.log("pref after cast="+pref);
				for (var z=0; z < title.length; z++) {
					index =  that.search(usage_docs.title_words, title[z]);
					if(index!=-1) {
						console.log(usage_docs.title_words[index]);
					    pref += parseInt(usage_docs.title_words[index].pref_index,10);	
					}
					console.log("title ="+title[z]+"="+index);
				}
				console.log("pref aftertitle="+pref);

				if(genre) {
					index =  that.search(usage_docs.genre, title[z]);
					if(index!=-1) {
   						console.log(usage_docs.genre[index]);
					    pref += parseInt(usage_docs.genre[index].pref_index,10);	
					}
					console.log("genre ="+genre+"="+index);
				}
				console.log("pref after genre="+pref);

				if(director) {
					index =  that.search(usage_docs.director, title[z]);
					if(index!=-1) {
   						console.log(usage_docs.director[index]);
					    pref += parseInt(usage_docs.director[index].pref_index,10);	
					}
					console.log("director ="+director+"="+index);
				}				
				
				if(pref >0 ){
					item.preference= pref;
					recItems.push(item);				
				}
				console.log("===============================================================");
			}
			console.log("program_doc 111 ");
			console.log(program_doc.length);
			console.log("recItems =qq"+ recItems);	
			console.log("Sorted recItems ="+ recItems);	
							console.log("===============================================================");
				console.log("===============================================================");

			for(var p=0;p<recItems.length;p++){
				console.log(recItems[p]);
			}
			recItems.sort(that.sortByPreferenceDesc);
			
							console.log("===============================================================");
				console.log("===============================================================");

			//for(var p=0;p<recItems.length;p++){
				//console.log(recItems[p]);
			//}			
			console.log("Sorted recItems ="+ recItems);	
			
			
			live_recos_model.findOneAndUpdate( {users_id:username},{users_id:username},{upsert:true,new:true}
						                      ,function(err, live_reco_doc) {									  
											  console.log(live_reco_doc);
											  /*
											  for(var q=0;q<recItems.length;q++) {
											  console.log(recItems[q]);
												live_recos_model.update({users_id:username},{$push:{reco_programs:recItems[q]}},{upsert:true}
						                      ,function(err,response) {
											  console.log("ERROR="+err);
											  											  console.log("response="+response);

											  });
											  }*/
									
			                                               //live_reco_doc.push(recItems);
															//live_reco_doc.save();
											  
											  });
											  
											  				   		    
			//
			
			//write query to insert to reco db
		});
			
	});


	//create cron job
	//refresh recommendations periodically /production - 1 hour. lab - 5 mins
	//calculate pref value for each program for each user.
	//update top 5 for each users.
}
// a and b are object elements of your array

recommender.prototype.sortByPreferenceDesc   = function(item1, item2)
{
  return parseInt(item2.preference, 10) - parseInt(item1.preference, 10);	
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

//myrecommender = new recommender();
