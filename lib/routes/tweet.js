'use strict';

var express = require('express'),
    twitterRouter = express.Router(),
    TweetProvider = require('../modules/tweet.js');

twitterRouter.get('/read', function (req, res) {
    var hashTag = req.query.hashTag;

    TweetProvider.fetchTweets(hashTag, function (result) {
        res.json(result);
    });

});

twitterRouter.get('/write', function (req, res) {
    var hashTag = req.query.hashTag;

    TweetProvider.sendTweets(hashTag, function (result) {
        res.json(result);
    });

});

module.exports = twitterRouter;





