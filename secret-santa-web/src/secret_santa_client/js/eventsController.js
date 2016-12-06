app.controller('eventsController', function(events, $timeout, $location, user) {
    var self = this;

    self.events = [];
    self.name = null;

    user.get(function (data) {
        self.name = data.name;
    });

    events.query({}, function(data){
        self.events = data;
    })
});