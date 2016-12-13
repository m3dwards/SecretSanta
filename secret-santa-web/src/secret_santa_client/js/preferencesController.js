app.controller('preferencesController', function ($scope, $routeParams, preferences, dates, venues, $rootScope, user, $q, eventUsers) {
        var self = this;

        var eventIdRaw = $routeParams.id;
        if (!eventIdRaw)
            $location.path('/events');

        self.eventId = parseInt(eventIdRaw);

        self.name = null;
        self.email = null;

        user.get(function (data) {
            self.name = data.name;
            self.email = data.email;
        });

        self.attending = false;
        self.doingPresents = false;

        self.availableVenues = ['Test Venue'];
        self.availableDates = [];

        $q.all(
            preferences.get({id: self.eventId}, function (data) {
                if (data.venue != null) {
                    self.attending = true;
                    self.doingPresents = data.doingPresents;
                    self.venue = data.venue;
                    self.selectedDates = data.selectedDates;
                }
            }),
            venues.query({id: self.eventId}, function (data) {
                self.availableVenues = data;
            }),
            dates.query({id: self.eventId}, function (data) {
                self.availableDates = [];

                angular.forEach(data, function (item) {
                    self.availableDates.push(new date(moment(new Date(item))));
                });
            })
        ).then(function () {
            if (self.venue != null) {
                if (self.selectedDates.length > 0) {
                    angular.forEach(self.availableDates, function (item) {
                        item.available = false;

                        angular.forEach(self.selectedDates, function (selected) {
                            if (item.date.diff(moment(selected)) === 0) {
                                item.available = true;
                            }
                        });
                    });
                }
            }
        });

        self.deleteUserPrompt = false;

        self.promptDeleteUser = function(){
            self.deleteUserPrompt = true;
        }

        self.deleteUserFromEvent = function(){
            eventUsers.delete({id: self.eventId}, self.email);
        };

        self.venue = null;

        self.busy = false;
        self.success = false;
        self.fail = false;

        self.formatDate = function (date) {
            return date.date.format('Do MMMM YYYY');
        };

        self.savePreferences = function () {
            var dates = [];

            self.busy = true;

            for (var i = 0; i < self.availableDates.length; i++) {
                var date = self.availableDates[i];
                dates.push({date: date.date.utc().format('YYYY-MM-DD'), available: date.available});
            }

            preferences.save({id: self.eventId},
                {
                    dates: dates,
                    venue: self.venue,
                    attending: self.attending,
                    doingPresents: self.doingPresents
                }, function (data) {
                    self.busy = false;
                    self.success = true;
                    self.fail = false;
                }, function (error) {
                    self.busy = false;
                    self.success = false;
                    self.fail = false;
                });
        };

        /*$scope.$on('ajax-state', function (e, args) {
         if (args.busy) {
         self.busy = true;
         }
         else {
         self.busy = true;

         if (args.success) {
         self.success = true;
         self.fail = false;
         }
         else {
         self.success = false;
         self.fail = true;
         }
         }
         });*/
    }
);