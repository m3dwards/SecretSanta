app.controller('editEventController', function ($scope, $routeParams, event, preferences, dates, venues, $location) {

    var self = this;

    self.fail = false;
    self.success = false;


    self.formatDate = function (date) {
        return date.format('Do MMMM YYYY');
    };

    self.creating = false;
    self.event = { name:null, date:null };
    self.addedDates = [];
    self.addedVenues = [];
    self.name = null;

    self.newDate = moment().format('d MMMM YYYY');
    self.newVenue = null;

    if (!$routeParams.id)
    {
        self.creating = true;
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

    self.saveEvent = function(){
        if (self.creating){
            event.save({
                name: self.name
            }, function(response){
                var eventId = response.event_id;

                var converted = [];
                for (var i = 0; i < self.addedDates.length; i++)
                {
                    converted.push(self.addedDates[i].format('YYYY-MM-DD 00:00:00'));
                }

                dates.save({id: eventId}, {dates: converted});

                venues.save({id:eventId}, {venues:self.addedVenues});
            });
        }
    }


    //$location.path( "/event/:id/edit" );
});