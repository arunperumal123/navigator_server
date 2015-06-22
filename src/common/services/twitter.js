/*
* Call APIS in the Node.js server to read twits based on program #hastag
* */
cloudStbApp.factory('twitter', [ '$http', '$q', function ($http, $q) {

    //Get twits based on #hashtag input parameter
    function getTwits (hashTag) {
        var _url = 'http://192.168.0.99:8080/tweet/read?hashTag=' + hashTag;

        return $http({method: 'GET', url: _url});
    }

    //Get twits based on #hashtag input parameter
    function sendTweets (hashTag) {
        var _url = 'http://192.168.0.99:8080/tweet/write?hashTag=' + hashTag;

        return $http({method: 'GET', url: _url});
    }

    return {
        getTwits: getTwits,
        sendTweets: sendTweets
    }
}]);