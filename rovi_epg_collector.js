var OAuth = require('oauth-1.0a');
var request = require('request');
var inspect = require('util').inspect;
var fs = require('fs');
var mongoose = require('mongoose')
var async = require('async');
var CronJob = require('cron').CronJob;
var math = require('mathjs');



var epg_data_model = require('./lib/models/epg_data_collection_model.js');
var channel_data_model = require('./lib/models/channel_data_collection_model.js');
var data_overview_model = require('./lib/models/data_overview_model.js');

var epg_data_available_days = 14;



epg_data_collector = function()
{
//  this.dbURL = 'mongodb://localhost:27017/epg_data_collection'; //local database
  this.dbURL = 'mongodb://arunperumal:rafaelnadal@ds053080.mongolab.com:53080/heroku_85bs2bx5';
  this.date;
  this.db;
  this.chan_pages_read=0;
  this.max_db_concurrency=5;
  this.oauth = OAuth({
    consumer: {
//	public: 'd46034891f895b9c0ea374ffb1d6198f8bda45fbf1d8e909c675018f58232b98', //arun's key
//        secret: 'ff36ecaaf4e630c94279d6ac9294e94acc8139d77189bcb32070aed4b203b7f1'
	    public: '058128a8b1caaf7fe352651e474697fe724795991b08e31338e4aedd0d4beee8',
	    secret: 'cdc8642287040943359543ffcd6fd7094c549584486b6cc7d638c39340b95de0' 
       },
       signature_method: 'HMAC-SHA1'
    });
  this.channel_data_output =[];

  this.channel_no_index=0;
  this.date = this.get_date(0);
  console.log('date now is '+this.date);

};




epg_data_collector.prototype.get_date = function(offset)
{
   var full_date = new Date();
   full_date.setDate(full_date.getDate() + offset);
   var day = full_date.getDate();
   var month = full_date.getMonth() + 1;
   month = pad(month,2);
   var calculated_date = full_date.getFullYear()+ "-" + month+ "-"+ pad(full_date.getDate(),2);
   return calculated_date;
};




pad  = function(num, size) {  //funny, i didn't find a lib to do this. size is the precision value
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}



epg_data_collector.prototype.dump_channel_data_to_db  = function(epg_collector,channel_data_done)
{
  mongoose.connect(this.dbURL);
  this.db = mongoose.connection;
  this.db.on('error', console.error.bind(console, 'mongodb connection error:'));

  var epg_collector = epg_collector; //get a local copy, as it is useful to access in callback context.
  var channel_data_done = channel_data_done;

  this.db.once('open', function (callback) {
        console.log('hey. mongoose mandayan is open');
        console.log('total no. of channels blocks are  '+epg_collector.channel_data_output.length);
                  	  
        function dump_channel_element_to_db(channel_element,callback)
    	{
	    //	console.log('dumping data to db.. with element id '+channel_element.source.id);
	        var logo_id = "";
		if(channel_element.source.logo) {
			logo_id = channel_element.source.logo.id;
		}	
        	channel_data_model.create(   
         	{
                	channel_id: channel_element.source.id,  //TODO. at this point. I consider only one window
			channel_number: channel_element.channel_number,
              		channel_name: channel_element.source.name,
              		channel_logo_id:logo_id 
             	},function(err) {
			if(err)
                        {
	                 // if(err.code = 11000)
                        //     console.log('attempt to insert duplicate entry');
                        }   		
			callback(err,channel_element.source.id,channel_element.channel_number);
             	});
     	}
          
     	var queue = async.queue(dump_channel_element_to_db,this.max_db_concurreny);

        console.log('channel data output length is '+epg_collector.channel_data_output.length+'block length is '+epg_collector.channel_data_output[0].size);

     	for(var i=0; i<epg_collector.channel_data_output.length;i++)
     	{
		console.log('pushing data of block '+i);
        	for(var j=0;j<epg_collector.channel_data_output[i].size;j++)
          	{
			var channel_element = epg_collector.channel_data_output[i].channels[j].windows[0];
			epg_collector.channel_no_index += 1;
			channel_element.channel_number = epg_collector.channel_no_index;  
              		queue.push(channel_element,function(err, channel_id,channel_number) {
                 		 if (err) {
					if(err.code == 11000) {
				//		console.log('duplicate entry error, when inserting channel id'+channel_id);
					}	
                  		}
                  	    	//console.log('pushed channel number'+channel_number+ 'total channels are'+epg_collector.channel_data_output[0].total);
			    	if(channel_number == epg_collector.channel_data_output[0].total)
				{
				       console.log('got entire channel data. ');
				       channel_data_done();
			        }  	       
                	});
           	} 		 
      	}
    });
};



epg_data_collector.prototype.get_channel_info = function(channel_data_done)
{

  console.log('calling get channel info');
  var page_to_read = this.chan_pages_read+1;
  var channel_data_done = channel_data_done;

  var channel_data = {
    url: 'http://cloud.rovicorp.com/data/2/2/lookup/service/341759807;offering=AU,BR,CA,CN,IN,EUR,LTA,RU,SEA,US,TR/channels?page='+page_to_read+'&size=50',
    method: 'GET'
   };

   var self = this;
   request({
      url: channel_data.url,
      method: channel_data.method,
      form: channel_data.data,
      headers: this.oauth.toHeader(this.oauth.authorize(channel_data, null))
      }, function(error, response, body) {
           console.log('channel data is ready for page'+page_to_read);
           self.channel_data_output.push(JSON.parse(body));
	   console.log(self.chan_pages_read);
	   if(self.channel_data_output[self.chan_pages_read].total > page_to_read*50)
	   {
	       console.log('collecting channel data not done.go next iteration');	   
	       self.chan_pages_read+=1;
               self.get_channel_info(channel_data_done);
           }
           else
	   {
	       console.log('channel collection is done. lets dump totally to db'+self.channel_data_output[self.chan_pages_read].total+'read so far is'+(page_to_read*50));	    
               self.dump_channel_data_to_db(self,channel_data_done);
	   } 
      });
};


/**********************************************************************************************************************************************/

epg_data_collector.prototype.get_epg_info = function(epg_collector,epg_collection_done)
{
	console.log('entering epg data query. channel data index value is '+this.channel_no_index);
	var program_data_done = program_data_done; //local copy . for callbacks sake
	var self = this;


        function dump_epg_data_done(programs_data)
		{
		   var max_days_offset = epg_data_available_days-1;
       //            console.log(' $$$$$$$$$$$$$$$ data collected for channel '+programs_data.channel_index+ ' for day '+programs_data.date_index);
	//	   console.log('max channel is '+self.channel_no_index+ ' and max date is '+ self.get_date(max_days_offset));
		   if((programs_data.channel_index == self.channel_no_index) && (programs_data.date_index == self.get_date(max_days_offset))) {
			    console.log('finally all epg data for all channels all day is collected. inform to root');
			   epg_collection_done();
		   }
                }
	   
	var self = this;

	for (var i=0; i < epg_data_available_days;i++) //for next 14 days
	{
		for(var j=1;j <= epg_collector.channel_no_index;j++)  //for all the channels
		{
			epg_collector.get_epg_schedule(j,epg_collector.get_date(i),function(programs_data) {
                                console.log('got data for channel '+j+' and for day '+i+'dumping to db now');
                  		epg_collector.dump_epg_data_to_db(epg_collector,programs_data,dump_epg_data_done);
			});  
		}
		
		if((i == (epg_data_available_days -1)) && (j == epg_collector.channel_no_index)) {
			program_data_done();
		}
	}
};




epg_data_collector.prototype.get_epg_schedule  = function(channel_index,date_requested,callback)
{

  console.log('Requesting rovi for epg data of channel '+channel_index+ ' for the date '+date_requested);
  var program_data = {
      url: 'http://cloud.rovicorp.com/data/2/2/lookup/service/341759807;offering=AU,BR,CA,CN,IN,EUR,LTA,RU,SEA,US,TR/schedule/' + date_requested+ '?page='+channel_index+'&size=1&duration=24&inprogress=true',
    	method: 'GET'
   };

   var self = this;
   setTimeout(function() {
    request({
        url: program_data.url,
        method: program_data.method,
        form: program_data.data,
        headers: self.oauth.toHeader(self.oauth.authorize(program_data, null))
       }, function(error, response, body) {
             if(error)
	      {
	         console.log('error output is received for gathering epg for channel '+channel_index + ' for date '+date_requested +' is '+error);
		 console.log('retrying one more');
		 self.get_epg_schedule(channel_index,date_requested,callback);
	      }
              else
	      { 
                  var program_data_output; 
                  program_data_output = JSON.parse(body);
	          program_data_output.channel_index = channel_index;
		  program_data_output.date_index = date_requested;
	          callback(program_data_output);
	      }
       });
    },100*channel_index); 
};



epg_data_collector.prototype.dump_epg_data_to_db  = function(epg_collector,programs_data,dump_epg_data_done)
{	
    console.log('entering epg program to db');  //Note. this code is not opening db. It works under assumption that channel dumping opened db already.FIXME

    var epg_collector = epg_collector;  //for callback functions reference.

   function dump_program_element_to_db(program_element,callback)
  {
//      console.log('actual inserting program index '+program_element.program_index+' of channel '+program_element.channel_index+ ' for date '+program_element.start);
       epg_data_model.create(
       {
	  channel_index: program_element.channel_index,
          program_id: program_element.id,
          program_synopses_id: program_element.links.data_airing_synopses.id,
          genre:program_element.category,
	  title:program_element.title,
	  start_time:program_element.start,
	  end_time:program_element.end,
	  audio_type:program_element.audio,
	  exhibition:program_element.exhibition   
         }, function(err) {
               if(err) { 
		   console.log('macha. error in program inserting data for channel index '+program_element.channel_index+ ' error code '+err.code);
	           if(err.code = 11000)
                       console.log('attempt to insert duplicate entry for channel index '+program_element.channel_index);
                    callback(err,program_element.channel_index,program_element.program_index);

	       }
	       else {  }
           }  	     
         );
    }  

    //var queue = async.queue(dump_program_element_to_db,epg_collector.max_db_concurreny);

  //  console.log('length of programs for this channel index '+programs_data.channel_index+ ' is '+ programs_data.schedule[0].airings.length)
    
    var max_program_index = programs_data.schedule[0].airings.length -1; 	    
    for(var k=0;k<programs_data.schedule[0].airings.length;k++)
    {
	    var program_element = programs_data.schedule[0].airings[k];
	    program_element.channel_index = programs_data.channel_index;  //to make channel no available for DB
	    program_element.program_index = k;

//	         console.log('attempt inserting program no '+k+' of channel '+programs_data.channel_index+ ' for date '+program_element.start);
	         dump_program_element_to_db(program_element,function(err,channel_index,program_index) {
	               //queue.push(program_element,function(err, channel_index,program_id) {
                        if (err) {
	    	            if(err.code == 11000) {
	                         console.log('duplicate entry error, when inserting program of id '+program_index + ' from channel '+channel_index);
		            }	
                        }
		        console.log('program index is '+program_index+' and max program index is '+max_program_index);
		        if(program_index == max_program_index) {
			     dump_epg_data_done(programs_data);
		        }	     
            });
    }   
};



//*********************************************************************************************************************

//collect cast and crew information




epg_data_collector.prototype.get_cast_info = function(mycollector,doc,callback)
{


  var program_data = {
    url: 'http://cloud.rovicorp.com/data/2/2/lookup/airing/'+ doc.program_synopses_id+ '/credits;isCast=true?page=1&size=20&by=',
    method: 'GET'
   };

   var self = this;
   request({
      url: program_data.url,
      method: program_data.method,
      form: program_data.data,
      headers: this.oauth.toHeader(this.oauth.authorize(program_data, null))
      }, function(error, response, body) {
	   if(error)
           {
	      console.log('error in getting cast.for program synopses id '+doc.program_synopses_id+ ' error is '+error);
	   }
           else 
	   { 
	       var data = JSON.parse(body);
              callback(mycollector,doc,data);
	   }
      });
};




epg_data_collector.prototype.get_director_info = function(mycollector,doc,callback)
{

  //console.log('calling get director info');

  var program_data = {
    url: 'http://cloud.rovicorp.com/data/2/2/lookup/airing/'+ doc.program_synopses_id+ '/credits;isCast=false?page=1&size=20&by=',
    method: 'GET'
   };

   var self = this;
   request({
      url: program_data.url,
      method: program_data.method,
      form: program_data.data,
      headers: this.oauth.toHeader(this.oauth.authorize(program_data, null))
      }, function(error, response, body) {
          if(error) {
		  console.log('error occured on director fetch. error is '+error);
	  }
	  else
	  {
             var data = JSON.parse(body);
//	   console.log('data is '+data);
           callback(mycollector,doc,data);
	  } 
      });
};




epg_data_collector.prototype.get_synopses_info = function(mycollector,doc,callback)
{

  //console.log('calling get synopses info for '+doc.program_synopses_id);

  var program_data = {
    url: 'http://cloud.rovicorp.com/data/2/2/lookup/airing/'+doc.program_synopses_id+'/synopses/first?by=length%3D50,length%3D50,length%3D50,length%3D50',
    method: 'GET'
   };

   var self = this;
   request({
      url: program_data.url,
      method: program_data.method,
      form: program_data.data,
      headers: this.oauth.toHeader(this.oauth.authorize(program_data, null))
      }, function(error, response, body) {
	   if(error) {
		   console.log('error in getting synopses.for program id '+doc.program_synopses_id + 'error is '+error);
	   }
	   else {
	       var data = JSON.parse(body);
	       console.log(data);
               callback(mycollector,doc,data);
	   }    
      });
};



epg_data_collector.prototype.update_addon_epg_info = function(mycollector)
{

     console.log('let us collect cast crew information and update in database');

  var mycollector = mycollector; //get local copy


  function update_cast_to_db(mycollector,doc,data)
  {
      if(data.credits)
      {	      
	var actors;  //we collect upto 3 actors for simplicity. and assuming top 3 are most important.
        if(data.credits[0] && data.credits[0].person)
	  actors = data.credits[0].person.name;

        if(data.credits[1] && data.credits[1].person)
	  actors += ','+ data.credits[1].person.name;

       if(data.credits[2] && data.credits[2].person)
	  actors += ',' + data.credits[2].person.name;

       console.log('actors available . they are '+actors);
  	//console.log('consolidated actors name is '+actors);
        epg_data_model.update({program_id:doc.program_id},{cast:actors},{upsert:true},function(err,response) {
	       if(err) {
	         console.log('error in updating the program with cast for id '+doc.program_id);
               }
         });
       }
  }  


  function update_director_to_db(mycollector,doc,data)
  {

      var director = null;

      if(data.credits)
      {	      
	  for(var i =0; i < data.size;i++)
	  {
		  if(data.credits[i].credit == 'Director')
		  {
			  console.log('got the director. his name is '+data.credits[i].person.name);
			  director = data.credits[i].person.name;
			  break;
		  }
	  }

	  if(director)
	  {
   	      epg_data_model.update({program_id:doc.program_id},{director:director},{upsert:true},function(err,response) {
	            if(err) {
	              console.log('error in updating the program with director for id '+doc.program_id);
                    }
              });
           }
	   else {
		   console.log('no director data available for program id '+doc.program_id);
	   }
        }
   }




  
  function update_synopses_to_db(mycollector,doc,data)
  {
       console.log('synopses data is available for' +doc.program_synopses_id+ ' let us dump it');
  
       if(data.synopses)
       {
          console.log('got the synopsis. it is '+data.synopses.synopsis);
          epg_data_model.update({program_id:doc.program_id},{synopsis:data.synopses.synopsis},{upsert:true},function(err,response) {
             if(err) {
                  console.log('error in updating the program with synopsis for id '+doc.program_id);
             }
          });
       } 
   }

     //README - The key here to keep ROVI happy is to setup the timers, so they don't clash. Setup a fixed offset of huge amount of time for 2nd/3rd
     epg_data_model.find({},function(err,docs) { 
	    //for(var i =0; i < docs.length;i++) {
	    for(var i =6500; i < 11500;i++) {   //let's do 9800 calls per day to keep rovi happy
		var doc = docs[i]; 
	        setTimeout(function(mycollector,doc) {mycollector.get_cast_info(mycollector,doc,update_cast_to_db); },((i-6500)*1000),mycollector,doc);
	     //   setTimeout(function(mycollector,doc) {mycollector.get_director_info(mycollector,doc,update_director_to_db);},((5000*1000 + i-6500)*5000),mycollector,doc);
//	        setTimeout(function(mycollector,doc) {mycollector.get_synopses_info(mycollector,doc,update_synopses_to_db);},i*20000,mycollector,doc);
	     }
     });
 }

epg_data_collector.prototype.start_collection = function(mycollector)
{
   var mycollector = this;
    
    mongoose.connect(mycollector.dbURL);
    mycollector.db = mongoose.connection;
    mycollector.db.on('error', console.error.bind(console, 'mongodb connection error:'));

    console.log('Initiating EPG data collection');

    mycollector.db.once('open', function (callback) {

       console.log('EPG collector:start collection: connected to database.');
      //update date , channel collection fields for clients to know what data to expect.
      data_overview_model.update(                      
      {	data_provider: "rovi"},
      { data_start_date: "2015-07-21",    //for production, this should be current date
      data_available_days: epg_data_available_days,   //defined above
      data_available_channels: "89",   //TODO. update this after collection of all information.
      	data_region:"US-EST"  }, 
      {upsert:true},function(err) {
		if(err)
        	{
         		if(err.code = 11000)
              		console.log('attempt to insert duplicate entry for data overview');
                        else
	                   console.log('error in updating document.error is '+err);
         	}
		else {
		        console.log('updated overview collection with data gathering date');
		}	
        });       

	    /*

       // pull channel information data and epg data serially.
        async.series([
           function(callback) {
    		   mycollector.get_channel_info(function() {
			   console.log('really channel data collection is done');
			   callback(null,null);  //null,null stands for error,data. TODO code them better.
		     }); 
               },
	    
	    function(callback) {
	            console.log('lets start music. epg data collection');
		    mycollector.get_epg_info(mycollector,function() {
			    console.log('getting all epg program data is also done');
		            callback(null,null);
		    });    
	    }
        ], function (error,results) {
	       console.log(' oh my god. i have collected both channel and epg data');
            if (error) {
            //handle readFile error or processFile error here
           }
          }
      );

     */

     //when channel collection and epg collection is done and tested, lets start updating cast/crew
     // setTimeout(function() { mycollector.update_addon_epg_info(mycollector);},1000*10);  //after 200 seconds
   });
}



epg_data_collector.prototype.update_collection = function(mycollector)
{

    mongoose.connect(mycollector.dbURL);
    mycollector.db = mongoose.connection;
    mycollector.db.on('error', console.error.bind(console, 'mongodb connection error:'));

    console.log('Initiating EPG data refresh');

    mycollector.db.once('open', function (callback) {
  
       console.log('EPG collector:update collection: connected to database.');
        //check out, whether we need refresh right now at initialization. 
	data_overview_model.find({},function(err,docs) {

	     var info = docs[0];
             var database_date;	     
             var todays_date= mycollector.get_date(0);
	     if(info)
	     {
	        database_date = info.data_start_date;
	        console.log('database date is '+info.data_start_date + ' today date is '+todays_date);
	     
	     }
	     if(todays_date.localeCompare(database_date) == 0)
	     {
		 console.log('epg data is already upto date. no need to refresh now');
	     }
             else
	     {
	       console.log('database info needs refresh. lets do it now');
               refresh_epg_dates(mycollector);
             }
        });      


        //setting up periodic timer to refresh the date information   
	var job = new CronJob({
                             cronTime: '00 49 23 * * 1-7',
                             onTick: function() {
                                         /*
                                         * Runs every day
                                         * at 00:00 AM. 
                                         */
				      console.log('cron job. trigger.lets brush and refresh EPG days');
				      rotate_epg_dates(mycollector);
                   
			     },
                             start: false,
                             timeZone: 'Asia/Kolkata'
                          });

         job.start();


         function get_database_first_date(callback)
	 {	 
  	       var first_date = new Date();
               data_overview_model.find({},function(err,data) { 
	           var overview = data[0]; 
                   console.log('first date, as per database is '+overview.data_start_date);
	           var tokens = overview.data_start_date.split("-");	
                   var first_date = new Date();
	           first_date.setYear(tokens[0]);
	           var month = tokens[1]-1;
	           first_date.setMonth(month);
	           first_date.setDate(tokens[2]); 
                   callback(first_date);
	       });	
	 }	
 
          function update_document_time(program_data,callback)
	  {
	         console.log('updating start time '+program_data.new_start_time + ' for program id '+program_data.program_id);
	         epg_data_model.update({program_id:program_data.program_id},{"start_time":program_data.new_start_time,
	                                                         "end_time":program_data.new_end_time},{upsert:true},function(err,response) {
	               if(err) {
	                    console.log('error in updating date for programid '+doc.program_id);
	     	            callback(err,program_data.program_id);
                       }
                 });
          }


          function get_offsetted_date(date, offset) //this gets offsetted day in custom format, we used.
	  {
                var new_date = new Date();
		      
	        var date_attributes = date.split("-");
	        new_date.setYear(date_attributes[0]);
	        var set_month = date_attributes[1]-1;
	        new_date.setMonth(set_month);
	        new_date.setDate(parseInt(date_attributes[2])+ offset);

                var month = new_date.getMonth()+1;        
	        month = pad(month,2);
	        var calculated_date = new_date.getFullYear()+ "-" + month+ "-"+ pad(new_date.getDate(),2);
	        return calculated_date;
	  }

          
	  function set_database_first_date(first_date,offset)
	  {
	        first_date.setDate(first_date.getDate() + offset);		  
                var month = first_date.getMonth() + 1;
		var new_date = first_date.getFullYear() + "-" +  pad(month,2) + "-" + pad(first_date.getDate(),2);
                console.log('so the new date for updated database is '+new_date);

                data_overview_model.update(   
		        {data_provider:"rovi"},{data_start_date: new_date},{upsert:true},    
                         function(err) {
		                  console.log('##################################updated database starting date########################');
                         });       
         }  

         function rotate_epg_dates(mycollector)       //move current date to 15th date.
         {
              // the function code starts here  
              get_database_first_date(function(first_date) {
	          console.log('first date from database is '+first_date);
	          rotate_database_dates(first_date);
		  set_database_first_date(first_date,1); //update current date to tomorrow.
              });	  

              function rotate_database_dates(first_date)
	      {
                   var month = first_date.getMonth() + 1;
		   var db_date = first_date.getFullYear() + "-" + pad(month,2) + "-" + pad(first_date.getDate(),2);
		   console.log('current first date as per database is '+db_date);
                    
		   epg_data_model.find({"start_time":{$regex:db_date}},function(err,docs) {
			   console.log('total docs found is '+docs.length);
                         
                           for (var k =0; k< docs.length;k++)  {
                                   var doc = docs[k];
                                   var start_time_tokens = doc.start_time.split("T");
			           var start_updated_date = get_offsetted_date(start_time_tokens[0],epg_data_available_days);
				   var new_start_time = start_updated_date+'T'+ start_time_tokens[1];
			           console.log('old start time is '+doc.start_time+ ' new start time is '+new_start_time);
  		                   var end_time_tokens = doc.end_time.split("T");
			           var end_updated_date = get_offsetted_date(end_time_tokens[0],epg_data_available_days);
			           var new_end_time = end_updated_date+'T'+end_time_tokens[1];
			           console.log('old end time is '+doc.end_time+ ' new end time is '+new_end_time);
				   var program_data = {new_start_time:new_start_time,new_end_time:new_end_time,program_id:doc.program_id};

				   console.log(' value of start time is '+program_data.new_start_time + 'value of end time is '+program_data.new_end_time);
				   //TODO. For some reason, queue is not working except for channel. needs debug.
				    update_document_time(program_data,function(err,program_id) {  
				   //  queue.push(program_data,function(err,program_id) {
					if(err) {
						console.log('error in updating program id '+program_id + ' with new times');
					}	
			         });
                             }


		   });	   
	      }

	 }





          function refresh_epg_dates(mycollector)
          {
                  // the function code starts here  
                 get_database_first_date(function(first_date) {
	              console.log('first date from database is '+first_date);
	              update_database_dates(first_date);
                 });	  

	          function update_database_dates(first_date)
	          {

		      var current_date = new Date();
	              console.log('database first date is '+first_date + 'current date is '+current_date);
                      var timeDiff = math.abs(current_date.getTime() - first_date.getTime());
                      var diffDays = math.floor(timeDiff / (1000 * 3600 * 24));
		      console.log('diff among dates is '+diffDays); 


                      if(diffDays != 1)
		      {


		        epg_data_model.find({},function(err,docs) {
			   console.log('got '+docs.length+ 'entries .update all of them');     
	                   for(var k =0; k < docs.length;k++) {
		                 var doc = docs[k];
			           var start_time_tokens = doc.start_time.split("T");
			           var start_updated_date = get_offsetted_date(start_time_tokens[0],diffDays);
				   var new_start_time = start_updated_date+'T'+ start_time_tokens[1];
			           console.log('old start time is '+doc.start_time+ ' new start time is '+new_start_time);
  		                   var end_time_tokens = doc.end_time.split("T");
			           var end_updated_date = get_offsetted_date(end_time_tokens[0],diffDays);
			           var new_end_time = end_updated_date+'T'+end_time_tokens[1];
			           console.log('old end time is '+doc.end_time+ ' new end time is '+new_end_time);
				   var program_data = {new_start_time:new_start_time,new_end_time:new_end_time,program_id:doc.program_id};

				   console.log(' value of start time is '+program_data.new_start_time + 'value of end time is '+program_data.new_end_time);
				   //TODO. For some reason, queue is not working except for channel. needs debug.
				    update_document_time(program_data,function(err,program_id) {  
				   //  queue.push(program_data,function(err,program_id) {
					if(err) {
						console.log('error in updating program id '+program_id + ' with new times');
					}	
			         });  
			    }
			 });

                           //update database first date
                           set_database_first_date(first_date,diffDays);
                     
                       }
		       else  //because heroku dyno sleeps on inactivity (for 1 dyno users), cron job may not hit. This is work around to counter that.
		       {
                           console.log('difference between dates is just 1. so better rotate the epg and refresh');
                           rotate_epg_dates(mycollector);  
		       }

                      }		 

              }
   });
}


//expose to outside world.
exports.epg_data_collector = epg_data_collector;

