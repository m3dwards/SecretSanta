app.controller('eventController', ['event', 'santa', '$timeout', '$location', 'user', function(event, santa, $timeout, $location, user){
    var self = this;

    var eventId = 1;

    self.fail = false;
    self.success = false;

    self.event = { attending: null, doingPresents: null, preferencesAvailable: true, venueSelected: false, venue: null, dateSelected: false, date: null, namesAvailable: false };

    self.santaVisible = false;
    self.santaSaysNo = false;

    self.name = null;
    user.get(function (data) {
        self.name = data.name;
    });

    self.santa = "Uh oh, something is wrong here..";

    self.timeout = 0;

    /*event.query({ id: eventId }, function (data) {
        self.event = data;
    });*/

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