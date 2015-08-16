/*
 * Include Model for Rovi. This Rovi Model will interact with MongoDB for getting
 * data.
 *
 * After receiving data from DB Collection, it will be returned to Client
  */
'use strict';

var Model = require('../models/');

function Provider () {}

// Returns the list of channels as a JSON
Provider.prototype.getChannels = function (collectionName, callback) {

    console.log('getChannels call '+ collectionName);	 
    //Call findAll with a callback to RoviProvider in Models
    Model.findAll(collectionName, callback);
};
Provider.prototype.getChannelPrograms = function (collectionName, channelNo, callback) {

    console.log('getChannels call');	 
    //Call findAll with a callback to RoviProvider in Models
    Model.getChannelPrograms(collectionName, channelNo, callback);
};


// Returns a particular channel's details
Provider.prototype.getChannelById = function (id, callback) {

};

Provider.prototype.getProgramInfo = function (collectionName, pgmId, callback) {
    Model.getProgramInfo(collectionName, pgmId, callback);
};

Provider.prototype.getSearchResults = function (collectionName, title, callback) {
    Model.findSimilarPrograms(collectionName, title, callback);
};
Provider.prototype.getSearchTestResults = function (collectionName, title, callback) {
    Model.findSimilarTestPrograms(collectionName, title, callback);
};
Provider.prototype.getAllChannels = function (collectionName, callback) {
    Model.getAllChannels(collectionName, callback);
};

// Returns the program information of a single or all channels
Provider.prototype.getPrograms = function (collectionName,  sourceId, pgmStartTime, pgmEndTime, callback) {

    console.log('getPrograms call');	 
    Model.findPrograms(collectionName, sourceId, pgmStartTime, pgmEndTime, callback);
};


Provider.prototype.getProgramDetails = function (collectionName, id, airingTime, callback) {
    Model.getProgramDetails(collectionName, id, airingTime, callback);
};


Provider.prototype.getMoreLikeThisPrograms = function (collectionName, pgmStartTime, pgmEndTime, callback) {

    Model.findMoreLikeThisPrograms(collectionName, pgmStartTime, pgmEndTime, callback);
};

Provider.prototype.setUsageDetails = function (username, pgmId, date, time, duration, callback) {

	console.log("module:"+ username +"," + pgmId+"," +date+"," +time+"," +duration);

    Model.setUsageDetails(username, pgmId, date, time, duration, callback);
};


Provider.prototype.setcurrentlyViewingDetails = function (username, pgmId, date, time, callback) {
    Model.setcurrentlyViewingDetails(username, pgmId, date, time, callback);
};

Provider.prototype.getRecommendationDetails = function (username, callback) {
    Model.getRecommendationDetails(username, callback);
};

Provider.prototype.getTrendingnowDetails = function(callback) {
    Model.getTrendingnowDetails(callback);
};

module.exports = new Provider();
