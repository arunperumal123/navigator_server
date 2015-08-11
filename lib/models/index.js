'use strict';

/**
 * Include the config file and required MongoDB package
 * */
var config      = require('../../config/config.js'),
    MongoClient = require('mongodb').MongoClient,
    Server      = require('mongodb').Server,
    ObjectID    = require('mongodb').ObjectId,
    mongoHost   = config.server.mongoHost,
    mongoPort   = config.server.mongoPort;

    var mongoose = require('mongoose');
    var epg_data_model = require('./epg_data_collection_model.js');
    var channel_data_model = require('./channel_data_collection_model.js');
	var users_usage_model = require('./reco_users_usage_model.js');
	var trending_now_model = require('./reco_trending_now_model.js');

var Model = function () {

    var self = this;

};

/*
 Find Channel ID/SourceId
 URL: http://localhost:8080/epg/channels?user=rovi
*/

Model.prototype.findAll = function (collectionName, callback) {
            channel_data_model.find({}, {"channel_id": 1,"channel_logo_id": 1,"channel_number": 1, "channel_name": 1},function (error, results) {
			
                if (error) {
                    callback(error);
                } else {
                    callback(results);
                }
            });
};

Model.prototype.getAllChannels = function (collectionName, callback) {
            channel_data_model.find({}, {"channel_id": 1,"channel_name": 1,"channel_number": 1}).toArray( function (error, results) {
                if (error) {
                    callback(error);
                } else {
					console.log("succcesss... ssss"+results);
                    callback(results);
                }
            });

};

Model.prototype.getChannelPrograms = function (collectionName,channelNo, callback) {
		            epg_data_model.aggregate([

                { "$match": {
                    "channel_index": channelNo/*,
                    $and: [
                            {"Programs.AiringTime": {$gte: userStartTime}},
                            {"Programs.AiringTime": {$lte: userEndTime}},
                        ]*/
                    },
					"$sort":  {
					
						"start_time":-1
					}
                }

            ],function(error,doc) {

                if (error){
                    console.log(" ERROR");
                    callback(error)
                }
                else {
                    console.log("Pass");
                    callback(doc);
                }
            });
	
};


Model.prototype.findById = function (id, callback) {
          epg_data_model.findOne({_id: rovi_collection.db.bson_serializer.ObjectID.createFromHexString(id)}, function (error, result) {
            if (error) {
                callback(error);
            } else {
                callback(result);
            }
          });
 // });
};

/*
 Find Program of a particular SourceId
 http://localhost:8080/epg/programs?user=rovi&sourceId=16503&userStartTime=2015-04-14T00:00:00Z&userEndTime=2015-04-14T03:30:00Z
*/

Model.prototype.findPrograms = function (collectionName, channelNo, pgmStartTime, pgmEndTime ,callback) {

console.log("collectionName="+collectionName+";channelNo="+channelNo);
  		epg_data_model.aggregate([

                { "$match": {
                    "channel_index": channelNo,
                    $and: [
                            {"start_time": {$gte: pgmStartTime}},
                            {"end_time": {$lte: pgmEndTime}},
                        ]
                    }
                },
				{ "$sort":  {
					"start_time":1
					}
				}

            ],function(error,doc) {
                if (error){
                    console.log(" ERROR");
                    callback(error)
                }
                else {
                    console.log("Pass");
                    callback(doc);
                }
            });
 
};

Model.prototype.getProgramInfo = function (collectionName, pgmId, callback) {
 
          epg_data_model.findOne({program_id:pgmId}, function (error, result) {
            if (error) {
                console.log(error);
                callback(error);
            } else {
                callback(result);
            }
          });

};



Model.prototype.findSimilarTestPrograms = function (collectionName, title, callback) {

    console.log('Log: Nishanth : title='+title);

  			epg_data_model.aggregate([

                { "$unwind": "$Programs" },
                { "$match": {"Programs.Title":{$regex :(".*"+title+".*")}}}

            ],function(error,doc) {

                if (error){
                    console.log(" ERROR");
                    callback(error)
                }
                else {
                    console.log("Pass");
                    callback(doc);
                }
            });

};

Model.prototype.findSimilarPrograms = function (collectionName, title, callback) {

    console.log('Log: Nishanth : title='+title+"; collectionName="+collectionName);

   
		var searchString= new RegExp(title, "i");
epg_data_model.aggregate([

                { "$match": {"title":{$regex :(searchString)}}}

            ],function(error,doc) {

                if (error){
                    console.log(" ERROR");
                    callback(error)
                }
                else {
                    console.log("Pass");
                    callback(doc);
                }
            });


};


Model.prototype.getProgramDetails = function (collectionName, programID, airingTime, callback) {

console.log("Nishanth:pid="+programID);
console.log("Nishanth:airingTime="+airingTime);


            epg_data_model.aggregate([

                { "$unwind": "$Programs" },
                { "$match": {
                    "Programs.ProgramId": {$eq: programID},
					$and: [
                            {"Programs.AiringTime": {$eq: airingTime}}
                        ]
                    }
                }

            ],function(error,doc) {

                if (error){
                    console.log(" ERROR");
                    callback(error)
                }
                else {
                    console.log("Pass");
                    callback(doc);
                }
            });

};
Model.prototype.setUsageDetails = function (username, pgmId, date, time, duration, callback) {
		
    console.log('setUsageDetails username: '+username+ ';'+ pgmId +"," +date+","+ time+","+ duration);
    var query = { users_id: username}; 
    users_usage_model.findOneAndUpdate(query,{users_id:username},{upsert:true},function(err, doc)
    {
		var item = { 
			program_id :pgmId,
			viewed_date:date,
			last_viewed_time: time,
			duration: duration
		}; 
		users_usage_model.update(
			{ users_id : username},
			{
				$push: {viewing_history:item}
			},
			{upsert:true}
			,function(err,response) {
				console.log('saved the entry '+item);
				if(err) {
					console.log('error in updating the usage.error is '+err);
				}
			}
		);						  
    });
	callback({Message : "Success"});  
};


Model.prototype.setcurrentlyViewingDetails = function (username, pgmId, date, time, callback) {
    console.log('setcurrentlyViewingDetails: username: '+username+ ';'+ pgmId +"," +date+","+ time);
	var item = { 
		users_id: username,
		program_id :pgmId,
		pgm_time:time,
		pgm_date: date
	}; 
	trending_now_model.update(
		{ users_id: username },
		item,
		{ upsert: true },
		function(err,response) {
			console.log('saved the entry '+item);
			if(err) {
				console.log('error in updating the usage.error is '+err);
			}
		}
    );
	callback({Message : "Success"});  
};


module.exports = new Model();
