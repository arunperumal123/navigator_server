'use strict';

/**
 * Include the config file and required MongoDB package
 * */
var config      = require('../../config/config.js'),
    MongoClient = require('mongodb').MongoClient,
    Server      = require('mongodb').Server,
    ObjectID    = require('mongodb').ObjectId,
    mongoHost   = config.server.mongoHost,
    mongoPort   = config.server.mongoPort,
    DB          = config.server.DB;

    var mymongo=require('mongodb');



//var mongostr='mongodb://arunperumal:navigator@ds053080.mongolab.com:53080/heroku_85bs2bx5'
//var mongostr='mongodb://arunperumal:navigator@ds053080.mongolab.com:53080/'+DB;
var mongostr='mongodb://arunperumal:rafaelnadal@ds053080.mongolab.com:53080/heroku_85bs2bx5';

//var mongostr='mongodb://localhost:27017/'+DB;

var Model = function (host, port) {

    var self = this;
    console.log('setting up the model');
    console.log('Mongolab uri is '+process.env.MONGOLAB_URI);

    /*
    // Set up the connection to the local db
    //var mongoclient = new MongoClient(new Server("arunperumal:navigator@ds53080.mongolab.com",53080/heroku_85bs2bx5), {native_parser: true});
    MongoClient.connect(mongouri,{ server: { auto_reconnect: true } }, function(err,db) {
     console.log('entering mongodb callback code');
     if(err) {
	     console.log('arun.did i fail to connect here?');
	      throw err;
     }
        // Keep the database reference in a property
        self.db = db;
	console.log('crossed the error code and happily returning');
	*/

/*
   var mongoclient = new MongoClient(new Server("ds053080.mongolab.com", 53080), {native_parser: true});

    // Open the connection to the server
    mongoclient.open(function(err, MONGOCLIENT) {
        if (!MONGOCLIENT) {
            console.error("Error! Exiting... Must start MongoDB first");
        }

        // Keep the database reference in a property
        self.db = MONGOCLIENT.db(DB);

	*/

mymongo.connect(mongostr, {}, function(error, db){
console.log("connected, db:  "+mongostr+"==" + db);

self.db = db;

db.addListener("error", function(error){
console.log("Error connecting to MongoLab");
});
       console.log('do i reach mongo here');


    });
};

Model.prototype.getCollection = function(collectionName, callback) {
    this.db.collection(collectionName, function(error, rovi_collection) {
        if( error ) {
            callback(error);
        } else {
            callback(null, rovi_collection);
        }
    });
};

/*
 Find Channel ID/SourceId
 URL: http://localhost:8080/epg/channels?user=rovi
*/

Model.prototype.findAll = function (collectionName, callback) {
    this.getCollection(collectionName, function (error, rovi_collection) {
        if (error) {
            callback(error);
        } else {
            rovi_collection.find({}, {"channel_id": 1,"channel_logo_id": 1,"channel_number": 1, "channel_name": 1}).toArray( function (error, results) {
                if (error) {
                    callback(error);
                } else {
                    callback(results);
                }
            });
        }
    });
};

Model.prototype.getAllChannels = function (collectionName, callback) {
    this.getCollection(collectionName, function (error, rovi_collection) {
	console.log(collectionName+"====="+rovi_collection);
        if (error) {
            callback(error);
    	    console.log(error);
        } else {
            rovi_collection.find({}, {"channel_id": 1,"channel_name": 1,"channel_number": 1}).toArray( function (error, results) {
                if (error) {
                    callback(error);
                } else {
					console.log("succcesss... ssss"+results);
                    callback(results);
                }
            });
        }
    });
};

Model.prototype.getChannelPrograms = function (collectionName,channelNo, callback) {
    this.getCollection(collectionName, function (error, rovi_collection) {
	console.log(collectionName+"====="+rovi_collection+"=="+channelNo);
        if (error) {
            callback(error);
	    console.log(error);
        } else {
		            rovi_collection.aggregate([

                { "$match": {
                    "channel_index": channelNo/*,
                    $and: [
                            {"Programs.AiringTime": {$gte: userStartTime}},
                            {"Programs.AiringTime": {$lte: userEndTime}},
                        ]*/
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
		/*
            rovi_collection.find({}).toArray( function (error, results) {
                if (error) {
                    callback(error);
                } else {
					console.log("succcesss... ssss"+results);
                    callback(results);
                }
            });*/
        }
    });
};


Model.prototype.findById = function (id, callback) {
  this.getCollection(function (error, rovi_collection) {
      if (error) {
          callback(error);
      } else {
          rovi_collection.findOne({_id: rovi_collection.db.bson_serializer.ObjectID.createFromHexString(id)}, function (error, result) {
            if (error) {
                callback(error);
            } else {
                callback(result);
            }
          });
      }
  });
};

/*
 Find Program of a particular SourceId
 http://localhost:8080/epg/programs?user=rovi&sourceId=16503&userStartTime=2015-04-14T00:00:00Z&userEndTime=2015-04-14T03:30:00Z
*/

Model.prototype.findPrograms = function (collectionName, sourceId, pgmStartTime, pgmEndTime ,callback) {

console.log("collectionName="+collectionName+";sourceId="+sourceId);
    this.getCollection(collectionName, function (error, rovi_collection) {
        if (error) {
            callback(error);
        } else {
		
		rovi_collection.aggregate([

                { "$match": {
                    "channel_index": sourceId,
                    $and: [
                            {"start_time": {$gte: pgmStartTime}},
                            {"end_time": {$lte: pgmEndTime}},
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
 /*           rovi_collection.aggregate([

                { "$unwind": "$Programs" },
                { "$match": {
                    "SourceId": parseInt(sourceId),
                    $and: [
                            {"Programs.AiringTime": {$gte: userStartTime}},
                            {"Programs.AiringTime": {$lte: userEndTime}},
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
            });*/
        }
    });
};

Model.prototype.getProgramInfo = function (collectionName, pgmId, callback) {

console.log("collectionName="+collectionName+";pgmId="+pgmId);
    this.getCollection(collectionName, function (error, rovi_collection) {
        if (error) {
            console.log(error);
            callback(error);
        } else {
          rovi_collection.findOne({program_id:pgmId}, function (error, result) {
            if (error) {
                console.log(error);
                callback(error);
            } else {
                callback(result);
            }
          });
			/*		
			rovi_collection.aggregate([

                { "$match": {
                    "_id": "55ab12ce00f5d76423c9627a"
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
            });*/
         }
    });
};



Model.prototype.findSimilarTestPrograms = function (collectionName, title, callback) {

    console.log('Log: Nishanth : title='+title);

    this.getCollection(collectionName, function (error, rovi_collection) {
        if (error) {
            callback(error);
        } else {
			rovi_collection.aggregate([

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

/*
		var searchString= new RegExp(title, "i");
	        rovi_collection.find({"Programs.Title":searchString}).toArray( function (error, results) {
                if (error) {
                    callback(error);
                } else {
				    console.log('Log: oooooopppp Nishanth : title='+title);

                    callback(results);
                }
            });
			*/
        }
    });
};

Model.prototype.findSimilarPrograms = function (collectionName, title, callback) {

    console.log('Log: Nishanth : title='+title+"; collectionName="+collectionName);

    this.getCollection(collectionName, function (error, rovi_collection) {
        if (error) {
            callback(error);
        } else {

		var searchString= new RegExp(title, "i");
rovi_collection.aggregate([

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


	        /*rovi_collection.find({"Programs.Title":searchString}).toArray( function (error, results) {
                if (error) {
                    callback(error);
                } else {
                    callback(results);
                }
            });*/
        }
    });
};


Model.prototype.getProgramDetails = function (collectionName, programID, airingTime, callback) {

console.log("Nishanth:pid="+programID);
console.log("Nishanth:airingTime="+airingTime);


    this.getCollection(collectionName, function (error, rovi_collection) {
        if (error) {
            callback(error);
        } else {
            rovi_collection.aggregate([

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
        }
    });
	 /*   this.getCollection(collectionName, function (error, rovi_collection) {
        if (error) {
            callback(error);
        } else {
            rovi_collection.aggregate([

                { "$unwind": "$Programs" },
                { "$match": {
                    "_id": {$eq: "553dcdf1baa13725e383532f"}
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
        }
    });*/
};

module.exports = new Model(mongoHost, mongoPort);
