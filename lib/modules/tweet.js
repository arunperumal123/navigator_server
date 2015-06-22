'use strict';

var OAuth= require('oauth'),
    Twitter = require('node-twitter'),
    config = require('../../config/config.js');

//Tweet handling class
function TweetProvider () {

    this.oA= new OAuth.OAuth(
        "http://twitter.com/oauth/request_token",
        "http://twitter.com/oauth/access_token",
        'lrDlPQpxVIjjJkZRrFKML39j7', 'UTAbXSkhvr4twQ0cLF1zk03Pjqhmi86gHmgvGJI9KuCbRihGZ7',
        "1.0A", null, "HMAC-SHA1"
    );

    this.twitterSearchClient = new Twitter.SearchClient(
        config.twitter.consumerKey,
        config.twitter.consumerSecret,
        config.twitter.accessToken,
        config.twitter.accessTokenSecret
    );

    this.twitterStreamClient = new Twitter.StreamClient(
        config.twitter.consumerKey,
        config.twitter.consumerSecret,
        config.twitter.accessToken,
        config.twitter.accessTokenSecret
    );

    this.twitterRestClient = new Twitter.RestClient(
        config.twitter.consumerKey,
        config.twitter.consumerSecret,
        config.twitter.accessToken,
        config.twitter.accessTokenSecret
    );
}

//Process the response received from Twitter
var processTweets = function (tweets) {
    var result = {},
        tItem,
        tweetsLength = tweets.length;

    result.tData = [];

    for (var i = 0; i < tweetsLength; i++) {
        tItem = tweets [i];

        if (tItem.lang === 'en') {
            result.tData.push(tItem.text);
        }
    }

    return result;
};

//Fetch data from Twitter based on HashTag
TweetProvider.prototype.fetchTweets = function (hashTag, callBack) {

    this.twitterSearchClient.search({'q': hashTag}, function(error, result) {
        if (error) {
            callBack('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
        } else {
            var processedTweets = processTweets(result.statuses);
            callBack(processedTweets);
        }
    });
};

TweetProvider.prototype.sendTweets = function (hashTag, callBack) {

    this.twitterRestClient.statusesUpdate(
        { status: "I am watching #" + hashTag },
        function (err, data) {
            if (err) {
                callBack(err);
            } else {
                callBack(data.id);
            }
        }
    );
};

module.exports = new TweetProvider();