'use strict';

// Call the packages and define app using express
var express = require('express'),
	bodyParser = require('body-parser'),
    serveStatic = require('serve-static'),
	config = require('./config/config.js'),
    routes = require('./lib/routes/'),
    twitterRouter = require('./lib/routes/tweet.js'),
    userAuthRouter= require('./lib/routes/user_auth.js'),
    mongoose = require('mongoose'),
	cors = require('cors'),
	morgan = require('morgan'),
	Err = require('custom-err'),
    path = require('path'),
    debug = require('debug'),
    router = express.Router(),
    methodOverride = require('method-override'),
	app = express(),

   epg_data_collector = require('./rovi_epg_collector').epg_data_collector,
   recommender = require('./recommender').recommender;


/*
* Tweeter related codes should be moved to related files
* */

// Connect to our mongo Database
//mongoose.connect('mongodb://localhost:27017/TweetDB');

// Create a new ntwitter instance
//var twit = new twitter(config.twitter);


// Parse application/json
app.use(bodyParser.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({"extended": true}));

// simulate DELETE and PUT
app.use(methodOverride());

// Logger
app.use(morgan('dev'));

// Cross-origin
app.use(cors());

// Serving Static files - images, channel logo

// Set server port
app.set('port', process.env.PORT || 8080);

// Set server port
app.set('env', 'DEVELOPMENT');

var ENV = app.get('env');

// Development error handler will print stacktrace
if (ENV === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}


console.log('mongo url is '+config.server.mongoHost);
mongoose.connect(config.server.mongoHost, {}, function(error, db){
      if(error) {
	      console.log('error in connecting to db - error '+error);
      }
      else {
	     console.log('got connection index.lets await opening of db'); 
     }});		

     var db = mongoose.connection;

     db.once('open',function()  { 
        start_services();
     });

function start_services()
{
      var db = config.server.DB;
      console.log('calling start services with db instance as '+db);
	        console.log('connected to database');    

    //set up rovi data collector here.
    var mycollector;
    var myrecommender;

     mycollector = new epg_data_collector();
     //mycollector.start_collection();    //call this function for getting ROVI data. This needs to implement purging. also valid ROVI keys.
     mycollector.update_collection(mycollector);   // call this function, if you want to update your static EPG data to match current dates.


     myrecommender = new recommender();
   //  myrecommender.test_recommender();

     // Call the router
     app.use('/', routes);

    // Call the Router
    app.use('/epg/', validate, routes);

    // Call Tweet Router for Twitter messages
    app.use('/tweet/', twitterRouter);

}


// Production error handler no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// Check for Rovi/Tribune User, set collection based on it
function validate (req, res, next) {
    /*
    * Extract the 'user' info from the URL
    * http://localhost:8080/epg/channels?user=rovi or
    * http://localhost:8080/epg/channels?user=tribune
    * */
    var user = req.query.user;

    if (user == "rovi") {
        app.set('collectionName', config.server.roviCollection);
    } else if (user == "tribune") {
        app.set('collectionName', config.server.tribuneCollection);
    }

    next();
}



//set up rovi data collector here.
//var mycollector;
//mycollector = new epg_data_collector();
//mycollector.start_collection();    //call this function for getting ROVI data. This needs to implement purging. also valid ROVI keys.
//mycollector.update_collection(mycollector);   // call this function, if you want to update your static EPG data to match current dates.





// Set a stream listener for tweets matching tracking keywords
/*twit.stream('statuses/filter', { track: 'scotch_io, #scotchio'}, function (stream) {
    streamHandler(stream);
});*/

// Call the router
app.use('/', routes);

// Call the Router
app.use('/epg/', validate, routes);

// Call Tweet Router for Twitter messages
app.use('/tweet/', twitterRouter);
app.use('/authentication/', userAuthRouter);


module.exports = app;
