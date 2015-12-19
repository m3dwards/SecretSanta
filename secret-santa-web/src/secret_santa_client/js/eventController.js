app.controller('eventController', ['event', 'santa', '$timeout', function(event, santa, $timeout){
    var self = this;

    var eventId = 1;

    self.fail = false;
    self.success = false;

    self.event = null;

    self.santaVisible = false;

    self.santa = "Jim McJefferson";

    /*event.query({ id: eventId }, function (data) {
        self.event = data;
    });*/

    santa.save({ id: eventId }, {},
        function(data){
            self.santa = data;
            self.fail = false;
            self.success = true;
        }, function(error){
            self.fail = true;
            self.success = false;
        }
    );

    self.showSanta = function(){
        self.santaVisible = true;

        $timeout(function(){
            self.santaVisible = false;
        }, 2000);

        return false;
    };
}]);