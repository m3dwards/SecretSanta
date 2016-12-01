app.controller('eventController', ['event', 'santa', '$timeout', '$location', 'user', 'preferences', function(event, santa, $timeout, $location, user, preferences){
    var self = this;

    var eventId = 1;

    self.fail = false;
    self.success = false;

    self.event = null;
    self.preferences = null;

    self.santaVisible = false;
    self.santaSaysNo = false;

    self.name = null;

    self.santa = "Uh oh, something is wrong here..";
    self.timeout = 0;

    user.get(function (data) {
        self.name = data.name;
    });

    preferences.get({ id: eventId }, function(data){
        self.preferences.attending = data.attending;
        self.preferences.doingPresents = data.doingPresents;
    });

    event.get({ id: eventId }, function (data) {
        self.event = data;
        self.event.venueSelected = data.venue != null;
        self.event.dateSelected = data.date != null;
    });

    if (self.event.namesAvailable) {
        santa.save({id: eventId}, {},
            function (data) {
                if (data.allowed == false) {
                    self.santaSaysNo = true;
                }
                else {
                    self.santa = data.name;
                }

                self.fail = false;
                self.success = true;
            }, function (error) {
                $location.path('/login')
            }
        );
    }

    self.showSanta = function(){
        self.santaVisible = true;

        self.timeout = 3;

        timeoutLoop();

        return false;
    };

    function timeoutLoop(){
        $timeout(function(){
            if (self.timeout == 1) {
                self.santaVisible = false;
            }
            else {
                self.timeout = self.timeout - 1;
                timeoutLoop();
            }
        }, 1000);
    }
}]);