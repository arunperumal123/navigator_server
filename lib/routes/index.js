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
 

   Provider.getAllChannels('channel_list', function (result) {
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
    var collectionName = 'channel_list';

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

// route for morelike this programs (http://localhost:8080/epg/programs/morelikethis)

router.get('/programs/morelikethis', function(req, res) {

    var collectionName = req.app.get('epgCollection');
    var collectionName = 'epg_collection';


    Provider.getProgramInfo(collectionName, req.query.pgmId, function (result) {
        var cast= result.cast,
            genre=result.genre,
            title=result.title,
            director=result.director,
            channel_index=result.channel_index,
            start_time=result.start_time,
            end_time=result.end_time,
            pgmStartTime = req.query.pgmStartTime,
            pgmEndTime = req.query.pgmEndTime;


        Provider.getMoreLikeThisPrograms(collectionName, pgmStartTime, pgmEndTime, function (result) {

        for( var i = 0; i < result.length; i++) {
            result[i].pref = 0;

            if ( director !== undefined && director && result[i].director !== undefined && result[i].director  ){
                var director_info = director.split(",");
                var director_info_result = result[i].director.split(",");
                for (var j = 0; j < director_info_result.length; j++) {
                    for (var k =0; k < director_info.length; k++) {
                        if (director_info_result[j] == director_info[k]) {
                            result[i].pref += 4;
                        }
                    }
                }
            }

            if ( cast !== undefined && cast && result[i].cast !== undefined && result[i].cast  ){
                var cast_info = cast.split(",");
                var cast_info_result = result[i].cast.split(",");
                for (var j = 0; j < cast_info_result.length; j++) {
                    for (var k =0; k < cast_info.length; k++) {
                        if (cast_info_result[j] == cast_info[k]) {
                            result[i].pref += 3;
                        }
                    }
                }
            }

            if ( title !== undefined && title && result[i].title !== undefined && result[i].title ) {
                var title_info = title.split(" ");
                var title_info_result = result[i].title.split(" ");
                for (var j = 0; j < title_info_result.length; j++) {
                    for (var k = 0; k < title_info.length; k++) {
                        if (title_info_result[j] == title_info[k]) {
                            result[i].pref += 2;
                        }
                    }
                }
            }

            if ( genre !== undefined && genre && result[i].genre !== undefined && result[i].genre ) {
                if (result[i].genre == genre) {
                    result[i].pref += 1;
                }
            }

            if ( start_time !== undefined && start_time && result[i].start_time !== undefined && result[i].start_time && end_time !== undefined && end_time && result[i].end_time !== undefined && result[i].end_time) {
                if (result[i].channel_index == channel_index && result[i].start_time == start_time && result[i].end_time == end_time) {
                    result[i].pref =0;
                }
            }
        }

        function sortByKey(result, pref) {
            return result.sort(function(a, b) {
                var x = a[pref];
                var y = b[pref];
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
        }
        var result= sortByKey(result,"pref").reverse();

        res.json(result.slice(0,8));

    });
});

});
module.exports = router;
