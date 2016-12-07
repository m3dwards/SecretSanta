app.controller('editEventController', function ($scope, $routeParams, event, preferences, dates, venues, eventUsers, $location) {

    var self = this;
    self.eventId = $routeParams.id;

    self.fail = false;
    self.success = false;


    self.formatDate = function (date) {
        return date.format('Do MMMM YYYY');
    };

    self.creating = false;
    self.event = { name:null, date:null };
    self.addedDates = [];
    self.addedVenues = [];
    self.addedAttendees = [];
    self.name = null;

    self.newDate = moment().format('d MMMM YYYY');
    self.newVenue = null;
    self.newAttendee = null;
    self.newAttendeeValid = true;

    if (!self.eventId)
    {
        self.creating = true;
    }
    else
    {
        event.get({id:self.eventId}, function(data){
            self.name = data.name;
        });

        venues.query({id: self.eventId}, function (data) {
            self.addedVenues = data;
        });

        dates.query({id: self.eventId}, function (data) {
            self.addedDates = [];

            angular.forEach(data, function (item) {
                self.addedDates.push(moment(item));
            });
        });
    }


    self.addDate = function(date){
        self.addedDates.push(moment(date));

        return false;
    }

    self.removeDate = function(date){
        self.addedDates.pop(date);

        return false;
    }

    self.addVenue = function(venue){
        self.addedVenues.push(venue);

        return false;
    }

    self.removeVenue = function(venue){
        self.addedVenues.pop(venue);

        return false;
    }

    self.addAttendee = function(attendee){
        self.newAttendeeValid = true;

        if (attendee.indexOf(';') > 0)
        {
            var splits = attendee.split(';');

            for (var i = 0; i < splits.length; i++){
                if (!validateEmail(splits[i]))
                {
                    self.newAttendeeValid = false;
                }
            }

            for (var i = 0; i < splits.length; i++)
            {
                self.addedAttendees.push(attendee.trim());
            }

            return false;
        }
        else if (attendee.indexOf(',') > 0)
        {
            var splits = attendee.split(',');

            for (var i = 0; i < splits.length; i++){
                if (!validateEmail(splits[i]))
                {
                    self.newAttendeeValid = false;
                }
            }

            for (var i = 0; i < splits.length; i++)
            {
                self.addedAttendees.push(attendee.trim());
            }

            return false;
        }

        if (!validateEmail(attendee)) {
            self.newAttendeeValid = false;
            return false;
        }

        self.addedAttendees.push(attendee);

        return false;
    }

    self.validateNewAttendee = function(){
        if (validateEmail(self.newAttendee))
        {
            self.newAttendeeValid = true;
        }
    }

    self.removeAttendee = function(attendee){
        self.addedAttendees.pop(attendee);

        return false;
    }

    self.saveEvent = function(){
        if (self.creating){
            event.save({
                name: self.name
            }, function(response){
                saveDatesAndVenues(response.event_id);
            });
        }
        else{
            saveDatesAndVenues(self.eventId);
        }
    }

    function saveDatesAndVenues(eventId){
        var converted = [];
        for (var i = 0; i < self.addedDates.length; i++)
        {
            converted.push(self.addedDates[i].format('YYYY-MM-DD 00:00:00'));
        }

        dates.save({id: eventId}, {dates: converted});

        venues.save({id:eventId}, {venues:self.addedVenues});

        eventUsers.save({id:eventId}, self.addedAttendees)
    }

    function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    //$location.path( "/event/:id/edit" );
});