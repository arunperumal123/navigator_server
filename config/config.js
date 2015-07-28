var path = require('path');

module.exports = {
  "server": {
    "listenPort": 9080,                                   // The port on which the server is to listen (means that the app is at http://localhost:3000 for instance)
    "securePort": 8433,                                   // The HTTPS port on which the server is to listen (means that the app is at https://localhost:8433 for instance)
    "distFolder": path.resolve(__dirname, '../../client/dist'),  // The folder that contains the application files (note that the files are in a different repository) - relative to this file
    "mongoHost" : 'arunperumal:navigator@ds53080.mongolab.com',
    "mongoPort"           : 53080,
    "DB"                  : 'rovi_epg_db',
    "roviCollection"      : "epg_collection",
    "epgCollection"	  : "epg_collection",
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
