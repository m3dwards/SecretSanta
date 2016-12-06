var MongoClient = require( 'mongodb' ).MongoClient;

var _db;

module.exports = {

    connectToServer: function( callback ) {
        MongoClient.connect( "mongodb://ss:1Nh3r1t4nc3@ds159737.mlab.com:59737/secret-banta", function( err, db ) {
            _db = db;
            return callback( err );
        } );
    },

    getDb: function() {
        return _db;
    }
};