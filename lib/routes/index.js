'use strict';

var express = require('express');
var router = express.Router();

/* Make a call to rovi class which functions to interact with Rovi Model
 * to get the data.
 * Once data is returned from the rovi class's function, send that data
 * to client side
 * */

var Provider = require('../modules/');


router.get('/',function(req,res) {
      console.log('hey. I have hit here');   
	res.send('hello world');
	 res.end();
});

 router.get('/grid', function(req, res) {
 

     Provider.getAllChannels('channel_collection', function (result) {
     res.json(result);
    });
    //res.json({name:'NC',collection:collectionName});
 });

 router.get('/channelPrograms', function(req, res) {
 

     Provider.getChannelPrograms('epg_collection', req.query.channel, function (result) {
     res.json(result);
    });
    //res.json({name:'NC',collection:collectionName});
 });
 
 router.get('/search', function(req, res) {
 
     var collectionName = req.app.get('epgCollection');
	     var collectionName = 'epg_collection';

     var title = req.query.title;
     Provider.getSearchResults(collectionName, title, function (result) {
     res.json(result);
    });
    //res.json({name:'NC',collection:collectionName});
 });
 
 router.get('/program', function(req, res) {
 console.log("Nishanth");
 console.log("Nishanth"+req.query.id);
 
     var collectionName = req.app.get('epgCollection');
    var collectionName = 'epg_collection';

     Provider.getProgramDetails(collectionName, req.query.id,req.query.airingTime, function (result) {
     res.json(result);
    });
    //res.json({name:'NC',collection:collectionName});
 });
 
 router.get('/searchtest', function(req, res) {
 
     var collectionName = req.app.get('collectionName');
     var title = req.query.title;
     Provider.getSearchTestResults(collectionName, title, function (result) {
     res.json(result);
    });
    //res.json({name:'NC',collection:collectionName});
 });




// route without parameters (http://localhost:8080/epg/channels/)
router.get('/channels', function(req, res) {
    console.log('arun.entering channels query');
    // Get the Collection Name set based on User
	
    //var collectionName = req.app.get('channelCollection');
    var collectionName = 'channel_collection';

    // Call getChannels method of rovi Module
    Provider.getChannels(collectionName, function (result) {
        res.json(result);
    });
});

// route with parameters (http://localhost:8080/epg/channels/:channelId)
router.get('/channels/:id', function (req, res) {

});

// route for programs (http://localhost:8080/epg/programs)
router.get('/programs', function(req, res) {

     console.log('arun. entering programs query');
    // Get the Collection Name set based on User
   // var collectionName = req.app.get('collectionName');
    var collectionName = 'epg_collection';

    // Get SourceId/ChannelId, userStartTime, userEndTime from the req object
    var sourceId = req.query.channelNo,
        pgmStartTime = req.query.pgmStartTime,
        pgmEndTime = req.query.pgmEndTime;

    // Call getChannels method of rovi Module
    Provider.getPrograms(collectionName, sourceId, pgmStartTime, pgmEndTime, function (result) {
        res.json(result);
    });
});

// route for programs (http://localhost:8080/epg/programs)
router.get('/programInfo', function(req, res) {
    // Get the Collection Name set based on User
   // var collectionName = req.app.get('collectionName');
    var collectionName = 'epg_collection';

    // Get SourceId/ChannelId, userStartTime, userEndTime from the req object
    var pgmId = req.query.pgmId;


    // Call getChannels method of rovi Module
    Provider.getProgramInfo(collectionName, pgmId, function (result) {
        res.json(result);
    });
});

module.exports = router;
