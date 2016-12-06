var express = require('express');
var event = require('./routes/event');
var mongoUtil = require( 'mongoUtil' );

var app = express();

mongoUtil.connectToServer( function( err ) {
    event(app, mongoUtil.getDb());
});

app.listen(4000);