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


var connecting_words = ["is", "and" , "with", "the", "of", "at", "in","a","for","an", "on", "by", "+", "-", ",", "&", " "]

function check_is_connecting_word(word)
{
   if(!word) return true;
   var len = connecting_words.length;
   for (var i =0; i<len ;i++)
   {
	   if(word.toUpperCase() == connecting_words[i].toUpperCase())  {
		 console.log('connecting word "'+word+ '", hence ignoring');
		 return true;
        }		 
   }
   return false;
}

recommender = function()
{
    this.date;
    this.max_db_concurrency=5;
	
	//for testing
	//this.update_pref_matrix(this);
    //this.refresh_recommendations(this);
    
	this.init_pref_matrix_cron_job();
	this.init_live_recommender_cron_job();
};


recommender.prototype.init_pref_matrix_cron_job = function()
{
      var self = this;

      //setting up periodic timer to refresh the date information   
      var job = new CronJob({
                     cronTime: '0 */1 * * * *',
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
                     cronTime: '0 */2 * * * *',
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

recommender.prototype.update_pref_matrix = function () {

    var self = this;	
	
      /* find every single user's document in the usage history collection.Each user has his own document */
      users_usage_model.find({},function(err,usageDocs) {
		console.log('no of users needs recommendation badly is '+usageDocs.length);
		
		var usageDocsLength = usageDocs.length;
		for (var i = 0; i < usageDocsLength; i++) {
			var userUsageDoc = usageDocs[i];		
			var userUsageId = userUsageDoc.users_id;	  
			console.log("User ID = "+ userUsageId);
			//if (userUsageId!='user1' ) continue;
			
			/* find preference matrix document of each user from pref matrix collection */
			users_pref_profile_model.findOneAndUpdate( {users_id: userUsageId},{users_id: userUsageId},{upsert:true,new:true}, userPrefModelCallback(userUsageDoc));		   
		}
		
		function userPrefModelCallback(userUsageDocObj) {
		
			return function(err, prefProfileDoc) {
				console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ ==>");
				console.log(userUsageDocObj);	
				console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ <==");

		  /*iterate through each of the viewing history data of the user */		
	            for (var j =0; j < userUsageDocObj.viewing_history.length; j++) {
					var usageDetails= {program_id:userUsageDocObj.viewing_history[j].program_id
				                 ,duration:userUsageDocObj.viewing_history[j].duration};
				    epg_index_model.getProgramInfo(null, usageDetails.program_id, progInfoModelCallback(userUsageDocObj, usageDetails, prefProfileDoc));
				    userUsageDocObj.viewing_history.splice(j,1); //remove the element from history.
		      	}
		           userUsageDocObj.save();
			}
		}
		
		function progInfoModelCallback(usageDetailsParam, usageDetailsParam, prefProfileDocParam) {
			return function(programDoc) {
			
				if(programDoc) {
					var castInfo = (programDoc.cast)?programDoc.cast.split(","):new Array();
					var directorInfo = programDoc.director;
					var genreInfo = programDoc.genre;
					var titleInfo = (programDoc.title)?programDoc.title.split(" "):new Array();

				    var preferenceBump =usageDetailsParam.duration/(20*60); //one point per every 20 secs watch 
                    var index;
    
                    if(castInfo) {
						updateCastPrefMatrix();
					}
					
					if(directorInfo) {
                        updateDirectorPrefMatrix();
					}
                    if(genreInfo) {
					    updateGenrePrefMatrix();
					}
				    if(titleInfo) {
				        updateTitlePrefMatrix();
					}  

					prefProfileDocParam.save(function(err){
						console.log("saved");
						console.log("ERROR="+err);
						//callback(err);
				    }); 

                    function updateCastPrefMatrix() {
						for (var k =0; k < castInfo.length; k++) { 
							if(prefProfileDocParam.cast) {
								index =  self.search(prefProfileDocParam.cast,castInfo[k]);
								if(index != -1) {
									// console.log('existing cast entry.updating existing stuff '+cast_info[k]);
									prefProfileDocParam.cast[index].pref_index += preferenceBump;
								}
								else {
									//console.log('no existing cast entry.adding stuff '+cast_info[k]);
									prefProfileDocParam.cast.push({name:castInfo[k],pref_index:preferenceBump});
								}
							}
							else {
								//console.log('pushing first cast entry with name'+cast_info[k]);
								prefProfileDocParam.cast.push({name:castInfo[k],pref_index:preferenceBump});
							}
						}
					}

					function updateDirectorPrefMatrix() { 
						if(prefProfileDocParam.director) {
							index =  self.search(prefProfileDocParam.director, directorInfo);
							if(index != -1) {
								//console.log('existing director entry.updating existing stuff '+directorInfo);
							prefProfileDocParam.director[index].pref_index += preferenceBump;
							}
							else {
								//console.log('no existing director entry.adding stuff '+director_info);
								prefProfileDocParam.director.push({name:directorInfo,pref_index:preferenceBump});
							}
						}
						else {
							//console.log('pushing first director entry with name'+director_info);
							prefProfileDocParam.director.push({name:directorInfo,pref_index:preferenceBump});
						}
					}                                              
                                                       
					function updateGenrePrefMatrix() { 
						if(prefProfileDocParam.genre) {
							index =  self.search(prefProfileDocParam.genre,genreInfo);
							if(index != -1) {
								//console.log('existing genre entry.updating existing stuff '+genre_info);
								prefProfileDocParam.genre[index].pref_index += preferenceBump;
							}
							else {
								//console.log('no existing genre entry. adding stuff '+genre_info);
								prefProfileDocParam.genre.push({name:genreInfo,pref_index:preferenceBump});
							}
						}
						else {
							//console.log('pushing first gnere entry with name'+genre_info);
							prefProfileDocParam.genre.push({name:genreInfo,pref_index:preferenceBump});
						}
						console.log("genre update: pref_profile_doc="+prefProfileDocParam.users_id);
					}    

					function updateTitlePrefMatrix() { 
						for (var k =0; k < titleInfo.length; k++) { 
							if(prefProfileDocParam.title_words) {
							
							   if(check_is_connecting_word(titleInfo[k])) continue;
							   
								index =  self.search(prefProfileDocParam.title_words,titleInfo[k]);
								if(index != -1) {
									//console.log('existing title words entry.updating existing stuff '+titleInfo[k]);
									prefProfileDocParam.title_words[index].pref_index += preferenceBump;
								}
								else {
									//console.log('no existing title words entry.adding stuff '+title_info[k]);
									prefProfileDocParam.title_words.push({name:titleInfo[k],pref_index:preferenceBump});
								}
							}
							else {
								//console.log('pushing first title entry with name'+title_info[k]);
								prefProfileDocParam.title_words.push({name:titleInfo[k],pref_index:preferenceBump});
							}
						}
					}     
				}	
			}
		}
	});
}

recommender.prototype.refresh_recommendations = function()
{
    var that = this;
	var directorWeightage = 5;
	var castWeightage = 3;
	var titleweightage = 2;
	var genreWeightage=1;
	
	// /*MODIFY*/fetch from user_collection
	users_usage_model.find({},function(err,usageDocs) {
		console.log('no of users needs recommendation badly is '+usageDocs.length);
		
		var usageDocsLength = usageDocs.length;
		for (var i = 0; i < usageDocsLength; i++) {
			var userUsageDoc = usageDocs[i];		
			var userUsageId = userUsageDoc.users_id;	  
			console.log("User ID = "+ userUsageId);

			//if (userUsageId!='nc3' ) continue;//test code
			users_pref_profile_model.findOne({users_id:userUsageId}, userPrefModelFetchCallback(userUsageDoc));			
		}
    });
	
	function userPrefModelFetchCallback(userUsageDocObj) {
		
		return function(err, userPrefData) {
		    console.log("USERPREF ERROR="+err);
			console.log(userPrefData);
			if(userPrefData) {
				var recItems = new Array();
				console.log('DATA='+userPrefData);
				epg_index_model.findUpcomingPrograms(function(programDoc){ // replace with actualquery
			
					var len = programDoc.length;
					console.log("=======================================================userID="+userUsageDocObj.users_id+";========len="+len);

					for(var i=0; i<len; i++) {
						var item = programDoc[i];
						//console.log(programDoc);
						var pref = 0;

						var title = (item.title)?item.title.split(" "): new Array();
						var cast = (item.cast)? item.cast.split(","): new Array();
						var genre = item.genre;
						var director = item.director;
						//console.log("item.cast="+cast);
						for (var z=0; z < cast.length; z++) {
							index =  that.search(userPrefData.cast, cast[z]);
							if(index!=-1) {
								pref += (parseInt(userPrefData.cast[index].pref_index,10) * castWeightage);	
							}
							//console.log("cast ="+cast[z]+"="+index);
						}
						
						//console.log("pref after cast="+pref);
						for (var z=0; z < title.length; z++) {
							index =  that.search(userPrefData.title_words, title[z]);
							if(index!=-1) {
								//console.log(userPrefData.title_words[index]);
								pref += (parseInt(userPrefData.title_words[index].pref_index,10) *titleweightage);	
							}
							//console.log("title ="+title[z]+"="+index);
						}
						//console.log("pref aftertitle="+pref);

						if(genre) {
							index =  that.search(userPrefData.genre, title[z]);
							if(index!=-1) {
								//console.log(userPrefData.genre[index]);
								pref += (parseInt(userPrefData.genre[index].pref_index,10) * genreWeightage);
							}
							//console.log("genre ="+genre+"="+index);
						}
						//console.log("pref after genre="+pref);

						if(director) {
							index =  that.search(userPrefData.director, title[z]);
							if(index!=-1) {
								//console.log(userPrefData.director[index]);
								pref += (parseInt(userPrefData.director[index].pref_index,10) * directorWeightage);	
							}
							//console.log("director ="+director+"="+index);
						}				
						
						if(pref >0 ){
							item.preference= pref;
							recItems.push(item);				
						}
					}
					//console.log("recItems =qq"+ recItems);	
					//console.log("===============================================================");			
					recItems.sort(that.sortByPreferenceDesc);
					
					console.log("================Completed sorting of results ===============================================");
			
					//console.log("Sorted recItems ="+ recItems);	
					var username = userUsageDocObj.users_id;
					live_recos_model.remove({users_id:username});
					var recItemsLen = recItems.length;
					recItemsLen = (recItemsLen>10)?10:recItemsLen;

					live_recos_model.findOneAndUpdate( {users_id:username},{users_id:username},{upsert:true,new:true}
									,function(err, liveRecoDoc) {
										//console.log(liveRecoDoc);
										liveRecoDoc.reco_programs.pull({});
										liveRecoDoc.save();
										for(var q=0;q<recItemsLen;q++) {
											//console.log(recItems[q]);
											liveRecoDoc.reco_programs.push(recItems[q]);	
										}
										liveRecoDoc.save();
									});
													  
				});
			}
		}
	}
}

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


