module.exports = function(app, db){
    app.get('/event/', function(req, res, next){
        var collection = db.collection('events')
        collection.find({user: })

        res.status(200);
        res.send({'test': 'test'});
    });

    app.get('/event/:id', function(req, res, next){
        var id = req.params.id;

        res.status(200);
        res.send({'test':'test'});
    })

    app.post('/event/:id', function(req, res, next){
       res.status(200);
       res.send({'test':'test'});
    });
};