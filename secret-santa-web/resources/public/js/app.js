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
      .when('/preferences/:email?', {
        templateUrl: 'preferences.html',
        controller: 'preferencesController',
        controllerAs: 'preferences',
        name: 'Preferences',
        path: '#/preferences',
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
        .when('/event/create', {
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
    }]);
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
app.controller('preferencesController', ['$scope', '$routeParams', 'preferences', 'dates', 'venues', '$rootScope', 'user',
	function ($scope, $routeParams, preferences, dates, venues, $rootScope, user) {
		var self = this;

		var eventId = 1;

		self.name = null;

        user.get(function (data) {
            self.name = data.name;
        });

		self.attending = false;
		self.doingPresents = false;

		self.availableVenues = ['Test Venue'];
		self.availableDates = [];

		preferences.get({ id: eventId }, function(data){
			self.attending = data.attending;
			self.doingPresents = data.doingPresents;
		});

		venues.query({ id: eventId }, function (data) {
			self.availableVenues = data;
		});

		dates.query({ id: eventId }, function (data) {
			self.availableDates = [];

			angular.forEach(data, function (item) {
				self.availableDates.push(new date(moment(new Date(item))));
			});
		});

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
				dates.push({ date: date.date.utc().format('YYYY-MM-DD'), available: date.available });
			}

			preferences.save({ id: eventId },
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
]);
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
app.controller('eventController', function(event, santa, $timeout, $location, user, preferences, $routeParams){
    var self = this;

    var eventIdRaw = $routeParams.id || '1';
    var eventId = parseInt(eventIdRaw);

    self.fail = false;
    self.success = false;

    self.event = { preferencesAvailable: false, venue : null, namesAvailable : false };
    self.preferences = {};

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

        if (data.date)
        {
            // TODO needs to be made UTC/correct timezone?
            var parsed = data.date.substring(6,10) + '-' +
                data.date.substring(3,5) + '-' +
                data.date.substring(0,2) + ' ' +
                data.date.substring(11,16);

            self.event.date = moment(parsed);
        }
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
});

app.controller('homeController', ['authentication', '$location', function(authentication, $location){
    var self = this;

    self.fail = false;
    self.success = false;

    $location.path( "/event" );
}]);
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