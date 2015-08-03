var path = require('path');


module.exports = {
  "server": {
    "listenPort": 9080,                                   // The port on which the server is to listen (means that the app is at http://localhost:3000 for instance)
    "securePort": 8433,                                   // The HTTPS port on which the server is to listen (means that the app is at https://localhost:8433 for instance)
    "distFolder": path.resolve(__dirname, '../../client/dist'),  // The folder that contains the application files (note that the files are in a different repository) - relative to this file
   "mongoHost" : 'mongodb://arunperumal:rafaelnadal@ds053080.mongolab.com:53080/heroku_85bs2bx5',
   //"mongoHost" : 'mongodb://localhost:27017/epg_data_collection',
    "roviCollection"      : "epg_collection",
    "epgCollection"	      :"epg_collection",
    "channelCollection"	  : "channel_list",
    "tribuneCollection"   : "tribune"
  },
  twitter: {
      consumerKey: 'lrDlPQpxVIjjJkZRrFKML39j7',
      consumerSecret:'UTAbXSkhvr4twQ0cLF1zk03Pjqhmi86gHmgvGJI9KuCbRihGZ7',
      accessToken: '3160833378-Szl7RSF2yogMR1jAlIeP8BR85QWvUTa5oJ0XFOG',
      accessTokenSecret: 'VTvNApA6ecGkAipq8pNjvCAcGkciv76VgADrSGHo59L9q'
  }
};
