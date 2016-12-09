var app = angular.module('secretSanta', ['ngRoute', 'ngResource'])
var root = '';

app.config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'home.html',
                controller: 'homeController',
                controllerAs: 'home',
                name: 'Home',
                path: '#/',
                includeInNav: false
            })
            .when('/login/:email?', {
                templateUrl: 'login.html',
                controller: 'loginController',
                controllerAs: 'login',
                name: 'Login',
                path: '#/login',
                includeInNav: false
            })
            .when('/event/:id/preferences', {
                templateUrl: 'preferences.html',
                controller: 'preferencesController',
                controllerAs: 'preferences',
                name: 'Preferences',
                path: '#/preferences',
                includeInNav: false
            })
            .when('/events', {
                templateUrl: 'events.html',
                controller: 'eventsController',
                controllerAs: 'events',
                path: '#/events',
                name: 'My Events',
                includeInNav: true
            })
            .when('/event/create', {
                templateUrl: 'edit-event.html',
                controller: 'editEventController',
                controllerAs: 'event',
                name: 'Edit Event',
                includeInNav: false
            })
            .when('/event/:id?', {
                templateUrl: 'event.html',
                controller: 'eventController',
                controllerAs: 'event',
                name: 'Event',
                includeInNav: false
            })
            .when('/event/:id/edit', {
                templateUrl: 'edit-event.html',
                controller: 'editEventController',
                controllerAs: 'event',
                name: 'Edit Event',
                includeInNav: false
            })
            .when('/admin/', {
                templateUrl: 'admin.html',
                controller: 'adminController',
                controllerAs: 'admin',
                name: 'Admin',
                includeInNav: false
            })
            .when('/event/:id/dates', {
                templateUrl: 'date-report.html',
                controller: 'dateReportController',
                controllerAs: 'report',
                name: 'Date Report',
                includeInNav: false
            });

        //$locationProvider.html5Mode(true);
    }])
    .factory('user', ['$resource', function ($resource) {
        return $resource(root + '/user');
    }])
    .factory('preferences', ['$resource', function ($resource) {
        return $resource(root + '/event/:id/preferences');
    }])
    .factory('dates', ['$resource', function ($resource) {
        return $resource(root + '/event/:id/dates');
    }])
    .factory('venues', ['$resource', function ($resource) {
        return $resource(root + '/event/:id/venues');
    }])
    .factory('authentication', ['$resource', function ($resource) {
        return $resource(root + '/login');
    }])
    .factory('event', ['$resource', function ($resource) {
        return $resource(root + '/event/:id');
    }])
    .factory('santa', ['$resource', function ($resource) {
        return $resource(root + '/event/:id/reveal-name');
    }])
    .factory('events', ['$resource', function ($resource) {
        return $resource(root + '/events');
    }])
    .factory('eventUsers', ['$resource', function ($resource) {
        return $resource(root + '/event/:id/users');
    }])
    .factory('eventUser', ['$resource', function ($resource) {
        return $resource(root + '/event/:id/user', null,
            {
                'update': {method: 'PUT'}
            });
    }])
    .factory('emailUsers', ['$resource', function ($resource) {
        return $resource(root + '/event/:id/email-all-users');
    }])
    .factory('dateReport', ['$resource', function ($resource) {
        return $resource(root + '/event/:id/no-go-dates');
    }])
    .factory('venueReport', ['$resource', function ($resource) {
        return $resource(root + '/event/:id/selected-venue');
    }])


    .directive('jqdatepicker', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, ngModelCtrl) {
                element.datepicker({
                    showOtherMonths: true,
                    selectOtherMonths: true,
                    dateFormat: 'dd MM yy', //'d MM, yy',
                    yearRange: '-0:+1'
                }).prev('.input-group-btn').on('click', function (e) {
                    e && e.preventDefault();
                    element.focus();
                });
                $.extend($.datepicker, {
                    _checkOffset: function (inst, offset, isFixed) {
                        return offset;
                    }
                });

                element.datepicker('widget').css({'margin-left': -element.prev('.input-group-btn').find('.btn').outerWidth() + 3});
            }
        };
    })
    .directive('bstoggle', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                element.bootstrapSwitch('state', ngModel.$$rawModelValue || false)
                    .on('switchChange.bootstrapSwitch', function (event, state) {
                        ngModel.$setViewValue(state);
                    });

                scope.$watch(attrs['ngModel'], function (v) {
                    element.bootstrapSwitch('state', v || false);
                });
            }
        };
    });
/*.factory('ajaxInterceptor', ['$q', '$rootScope', '$injector',
 function ($q, $rootScope, $injector) {
 return {
 // optional method
 'request': function (config) {
 $rootScope.$broadcast('ajax-state', { busy: true, success: false });
 return config;
 },
 'requestError': function (rejection) {
 $rootScope.$broadcast('ajax-state', { busy: false, success: false });
 return $q.reject(rejection);
 },
 'response': function (response) {
 $rootScope.$broadcast('ajax-state', { busy: false, sucess: true });
 return response;
 },
 'responseError': function (rejection) {
 $rootScope.$broadcast('ajax-state', { busy: false, success: false });
 return $q.reject(rejection);
 }
 };
 }])
 .config(['$httpProvider', '$rootScope', function ($httpProvider) {
 $httpProvider.interceptors.push('ajaxInterceptor');
 }]);*/
function date(date, available)
{
	var self = this;
	
	self.date = date;
	self.available = available != null ? available : true;
}
app.controller('appController', ['$rootScope', '$scope', '$route', '$location', 'user',
	function ($rootScope, $scope, $route, $location, user){
		var self = this;

        user.get(function (data) {
            self.name = data.name;
        }, function (error) {
			$location.path('/login');
		});

		self.routes = [];
		self.routeIsActive = function(route){
			var path = $location.path();

			// todo replace :artifacts with query string params

			return route.regexp.test(path);
		};
		
		angular.forEach($route.routes, function (config,route){			
			if (config.includeInNav == true)
				self.routes.push(config);
		});
		
		self.test = function(){
			console.log(self.routes);
		}
	}
]);
app.controller('dateReportController', function ($scope, $routeParams, $location, dateReport, eventUsers, dates, $q) {

    var self = this;
    self.eventId = $routeParams.id;

    self.fail = false;
    self.success = false;
    self.totalAttendees = 0;

    self.dateData = [];

    self.formatDate = function (date) {
        return date.format('Do MMMM YYYY');
    };

    $q.all(
        eventUsers.query({id:self.eventId}, function(data){
          self.totalAttendees = data.length;
        })
    ).then(function(){
        dateReport.query({id: self.eventId}, function(data){
            //[{"date":"2016-12-08T00:00:00Z","name":"Aaron Rhodes"},{"date":"2016-12-06T00:00:00Z","name":"Aaron Rhodes"}]

            dates.query({id:self.eventId}, function(dates){
                var tempData = [];

                for (var i = 0; i < dates.length; i++){
                    tempData.push({ date: moment(dates[i]), names:[]});
                }

                for (var i = 0; i < data.length; i++)
                {
                    var dateItem = null;

                    for (var b = 0; b < tempData.length; b++)
                    {
                        if (tempData[b].date === moment(data[i].date))
                        {
                            dateItem = tempData[b];
                            break;
                        }
                    }

                    if (!dateItem)
                    {
                        console.log('DATE NOT FOUND');
                    }
                    else
                        dateItem.names.push(data[i].name);
                }

                for (var i = 0; i < tempData.length; i+=4)
                {
                    var tmp = [];

                    for (var b = i; (b < i + 4) && b < tempData.length; b++) {
                        tmp.push(tempData[b]);
                    }

                    self.dateData.push(tmp);
                }
            });
        });
    });

    self.getStyle = function(column){
        if (self.totalAttendees > 0) {
            var colours = [
                '#27AE60',
                '#27AE60',
                '#F39C12',
                '#F39C12',
                '#E67E22',
                '#E67E22',
                '#D35400',
                '#D35400',
                '#C0392B',
                '#C0392B'
            ];

            var calc = parseInt((column.names.length / self.totalAttendees) * 100);
            return {
                'background-color' : colours[parseInt(calc / 10)],
                'text-align':'center',
                'font-size':'20px',
                'color':'white',
                'border':'1px solid white',
                'padding': '30px'
            };
        }
        else
        {
            return {
                'background-color': '#BDC3C7',
                'text-align':'center',
                'font-size':'20px',
                'color':'white',
                'border':'1px solid white',
                'padding': '30px'
            };
        }
    }
});
app.controller('editEventController', function ($scope, $routeParams, event, preferences, dates, venues, eventUsers, $location, eventUser, emailUsers) {

    var self = this;
    self.eventId = $routeParams.id;

    self.fail = false;
    self.success = false;


    self.formatDate = function (date) {
        return date.format('Do MMMM YYYY');
    };

    self.creating = false;
    self.event = {name: null, date: null};
    self.addedDates = [];
    self.addedVenues = [];
    self.addedAttendees = [];
    self.name = null;
    self.namesAvailable = false;
    self.preferencesAvailable = false;

    self.newDate = moment().format('d MMMM YYYY');
    self.newVenue = null;
    self.newAttendee = null;
    self.newAttendeeValid = true;

    self.emailContent = null;

    if (!self.eventId) {
        self.creating = true;
    }
    else {
        event.get({id: self.eventId}, function (data) {
            self.name = data.name;
            self.namesAvailable = data.namesAvailable;
            self.preferencesAvailable = data.preferencesAvailable;
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

        eventUsers.query({id: self.eventId}, function (data) {
            self.addedAttendees = data;

            for (var i = 0; i < self.addedAttendees.length; i++) {
                self.addedAttendees[i].initialName = self.addedAttendees[i].name;
            }
        });
    }


    self.addDate = function (date) {
        self.addedDates.push(moment(date));

        self.newDate = moment().format('d MMMM YYYY');

        return false;
    };

    self.removeDate = function (date) {
        self.addedDates.splice(self.addedDates.indexOf(date), 1);

        return false;
    };

    self.addVenue = function (venue) {
        self.addedVenues.push(venue);

        self.newVenue = null;

        return false;
    };

    self.removeVenue = function (venue) {
        self.addedVenues.splice(self.addedVenues.indexOf(venue), 1);

        return false;
    };

    self.addAttendee = function (attendee) {
        self.newAttendeeValid = true;

        if (attendee.indexOf(';') > 0) {
            var splits = attendee.split(';');

            for (var i = 0; i < splits.length; i++) {
                if (!validateEmail(splits[i])) {
                    self.newAttendeeValid = false;
                }
            }

            for (var i = 0; i < splits.length; i++) {
                self.addedAttendees.push({email: splits[i].trim(), name: null, admin: false, initialName: null});
            }

            self.newAttendee = null;

            return false;
        }
        else if (attendee.indexOf(',') > 0) {
            var splits = attendee.split(',');

            for (var i = 0; i < splits.length; i++) {
                if (!validateEmail(splits[i])) {
                    self.newAttendeeValid = false;
                }
            }

            for (var i = 0; i < splits.length; i++) {
                self.addedAttendees.push({email: splits[i].trim(), name: null, admin: false, initialName: null});
            }

            self.newAttendee = null;

            return false;
        }

        if (!validateEmail(attendee)) {
            self.newAttendeeValid = false;
            return false;
        }

        self.addedAttendees.push({email: attendee.trim(), name: null, admin: false, initialName: null});

        self.newAttendee = null;

        return false;
    };

    self.validateNewAttendee = function () {
        if (validateEmail(self.newAttendee)) {
            self.newAttendeeValid = true;
        }
    };

    self.removeAttendee = function (attendee) {
        self.addedAttendees.splice(self.addedAttendees.indexOf(attendee), 1);

        return false;
    };

    self.saveEvent = function () {
        if (self.creating) {
            event.save({
                name: self.name
            }, function (response) {
                saveDatesVenuesAttendees(response.event_id);
            });
        }
        else {
            saveDatesVenuesAttendees(self.eventId);
        }

        $location.path('/event/' + self.eventId)
    };

    self.emailAttendees = function (message) {
        emailUsers.save({id: self.eventId}, {message: message});
        self.emailContent = null;
    };

    function saveDatesVenuesAttendees(eventId) {
        var converted = [];
        for (var i = 0; i < self.addedDates.length; i++) {
            converted.push(self.addedDates[i].format('YYYY-MM-DD 00:00:00'));
        }

        dates.save({id: eventId}, {dates: converted});

        venues.save({id: eventId}, {venues: self.addedVenues});

        eventUsers.query({id: self.eventId}, function (serverAttendees) {
            var found = false;

            for (var i = 0; i < serverAttendees.length; i++) {
                found = false;

                for (var b = 0; b < self.addedAttendees.length; b++) {
                    if (self.addedAttendees[b].email === serverAttendees[i].email) {
                        // need to delete this person
                        found = true;
                    }
                }

                if (!found) {
                    eventUser.delete({id: self.eventId}, serverAttendees[i].email);
                }
            }

            for (var i = 0; i < self.addedAttendees.length; i++) {
                found = false;

                for (var b = 0; b < serverAttendees.length; b++) {
                    if (self.addedAttendees[i].email === serverAttendees[b].email) {
                        found = true;
                    }
                }

                if (found) {
                    eventUser.update({id: eventId}, self.addedAttendees[i]);
                }
                else {
                    eventUser.save({id: eventId}, self.addedAttendees[i]);
                }
            }
        });
    }

    function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    //$location.path( "/event/:id/edit" );
});
app.controller('eventController', function(event, santa, $timeout, $location, user, preferences, $routeParams, eventUsers, $q){
    var self = this;

    var eventIdRaw = $routeParams.id || '1';
    self.eventId = parseInt(eventIdRaw);

    self.fail = false;
    self.success = false;

    self.event = { preferencesAvailable: false, venue : null, namesAvailable : false };
    self.preferences = {};

    self.santaVisible = false;
    self.santaSaysNo = false;

    self.name = null;
    self.email = null;
    self.admin = false;

    self.eventUsers = [];

    self.santa = "Uh oh, something is wrong here..";
    self.timeout = 0;

    self.newDate = null;

    $q.all(
        user.get(function (data) {
            self.name = data.name;
            self.email = data.email;
        })
    ).then(function(){
        eventUsers.query({ id: self.eventId },function(data){
            self.eventUsers = data;

            angular.forEach(data, function(item){
                if (item.email === self.email)
                {
                    self.admin = item.admin;
                }
            })
        });
    });



    preferences.get({ id: self.eventId }, function(data){
        if (data.venue != null) {
            self.preferences.attending = true;
            self.preferences.doingPresents = data.doingPresents;
        }
    });

    event.get({ id: self.eventId }, function (data) {
        self.event = data;
        self.event.venueSelected = data.venue != null;
        self.event.dateSelected = data.date != null;

        if (data.date)
        {
            // TODO needs to be made UTC/correct timezone?
            /*var parsed = data.date.substring(6,10) + '-' +
                data.date.substring(3,5) + '-' +
                data.date.substring(0,2) + ' ' +
                data.date.substring(11,16);

            self.event.date = moment(parsed);*/

            self.event.date = moment(data.date);
        }
    });

    if (self.event.namesAvailable) {
        santa.save({id: self.eventId}, {},
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
});

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
app.controller('homeController', ['authentication', '$location', function(authentication, $location){
    var self = this;

    self.fail = false;
    self.success = false;

    $location.path( "/event" );
}]);
app.controller('loginController', ['authentication', '$routeParams', function(authentication, $routeParams){
	var self = this;
	
	self.email = $routeParams.email;
	self.fail = false;
	self.success = false;
	
	self.login = function(){
		authentication.save({ email : self.email.toLowerCase() },
		function(data){
			if (data.valid)
			{
				self.success = true;
				self.invalid = false;
			}
			else
			{
				self.success = false;
				self.invalid = true;
			}
			self.fail = false;
		}, function(error){
			self.fail = true;
			self.success = false;
		});
	};
}]);
app.controller('preferencesController', function ($scope, $routeParams, preferences, dates, venues, $rootScope, user, $q, eventUsers) {
        var self = this;

        var eventId = $routeParams.id || 1;

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
            preferences.get({id: eventId}, function (data) {
                if (data.venue != null) {
                    self.attending = true;
                    self.doingPresents = data.doingPresents;
                    self.venue = data.venue;
                    self.selectedDates = data.selectedDates;
                }
            }),
            venues.query({id: eventId}, function (data) {
                self.availableVenues = data;
            }),
            dates.query({id: eventId}, function (data) {
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
            eventUsers.delete({id: eventId}, self.email);
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

            preferences.save({id: eventId},
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