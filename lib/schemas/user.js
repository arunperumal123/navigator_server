var mongoose = require('mongoose');

var request = require('request');


// simple but incomplete email regexp:
var emailRegexp = /.+\@.+\..+/;


var UserSchema = new mongoose.Schema({
	username: {type:String,unique:true},
        name: mongoose.Schema.Types.Mixed, //a classic case, where you defined originally name as string, then later you changed it as two component strings. you have both types of data in database. In order to be backward compatible,we declare data type as mixed.
        password: String,
        email: {
         type: String,
         required: true,
         match: emailRegexp
       },
       gender: {
          type: String,
          required: true,
          uppercase: true,
          'enum': ['M', 'F']
         },
       bio: {
          type: String,
          required: true,
         },
      twitter: {
        type: String,
        validate: [twitterHandleExists, 'Please provide a valid twitter handle'],
        set: filterTwitterHandle,
        get: filterTwitterHandle  
       }
});

//we maintain first name and last name seperately in database. but for users' view, we want to give a virtual db entry as "full name"
UserSchema
.virtual('full_name')
.get(function() {
if (typeof this.name === 'string') {  //in case the data received is older type, then return as same value. else if it is new type, we combine both and return.
return this.name;
}
return [this.name.first, this.name.last].join(' ');
})
.set(function(fullName) {
var nameComponents = fullName.split(' ');
this.name = {last:nameComponents.pop(),first:nameComponents.join(' ')};
});

//declaring a virtual attribute as part of schema. This members won't be in schema.but calculated run time.
UserSchema
.virtual('twitter_url')
.get(function() {
if (this.twitter) {
return 'http://twitter.com/' + encodeURIComponent(this.twitter);
}
});

function twitterHandleExists(handle, done) {
request('http://twitter.com/' + encodeURIComponent(handle), function(err, res) {
if (err) {
console.error(err);
return done(false);
}
if (res.statusCode > 299) {
done(false);
} else {
done(true);
}
});
}



function filterTwitterHandle(handle) {
if (! handle) {
return;
}
handle = handle.trim();
if (handle.indexOf('@') === 0) {
handle = handle.substring(1);
}
return handle;
}



module.exports = UserSchema;
