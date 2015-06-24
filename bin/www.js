var app = require('../app.js'),
    config = require('../config/config.js');

// START THE SERVER
// =============================================================================
var port = process.env.PORT || 9080;

app.listen(port);

console.log('Magic happens on port ' + port);
