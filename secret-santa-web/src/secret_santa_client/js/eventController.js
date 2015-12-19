app.controller('eventController', ['event', 'santa', '$timeout', '$location', function(event, santa, $timeout, $location){
    var self = this;

    var eventId = 1;

    self.fail = false;
    self.success = false;

    self.event = null;

    self.santaVisible = false;
    self.santaSaysNo = false;

    self.santa = "Uh oh, something is wrong here..";

    self.timeout = 0;

    /*event.query({ id: eventId }, function (data) {
        self.event = data;
    });*/

    santa.save({ id: eventId }, {},
        function(data){
            if (data.allowed == false) {
                self.santaSaysNo = true;
            }
            else {
                self.santa = data.name;
            }

            self.fail = false;
            self.success = true;
        }, function(error){
            $location.path('/login')
        }
    );

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