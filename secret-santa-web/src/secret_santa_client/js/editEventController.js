app.controller('editEventController', function ($scope, $routeParams, event, preferences, dates, venues, $location) {

    var self = this;

    self.fail = false;
    self.success = false;


    self.formatDate = function (date) {
        return date.format('Do MMMM YYYY');
    };

    self.creating = false;
    self.event = { name:null, date:null };
    self.addedDates = [moment('2016-12-01 19:30:00')];

    self.newDate = self.formatDate(moment());

    if (!$routeParams.id)
    {
        self.creating = true;
    }


    self.removeDate = function(date){
        self.addedDates.pop(date);

        return false;
    }


    self.save = function(){
        if (self.creating){
            event.save({})
        }
    }


    //$location.path( "/event/:id/edit" );
});