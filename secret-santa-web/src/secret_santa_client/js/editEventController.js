app.controller('editEventController', function ($scope, $routeParams, event, preferences, dates, venues, $location) {

    var self = this;

    self.fail = false;
    self.success = false;

    self.creating = false;
    self.event = { name:null, date:null };

    if (!$routeParams.id)
    {
        self.creating = true;
    }


    self.save = function(){
        if (self.creating){
            event.save({})
        }
    }


    //$location.path( "/event/:id/edit" );
});