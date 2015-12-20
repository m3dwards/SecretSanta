var app = angular.module('secretSanta', ['ngRoute', 'ngResource'])

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
      .when('/event/', {
        templateUrl: 'event.html',
        controller: 'eventController',
        controllerAs: 'event',
        name: 'Event',
        includeInNav: false
      });

    //$locationProvider.html5Mode(true);
  }])
    .factory('user', ['$resource', function ($resource) {
        return $resource('/user');
    }])
    .factory('preferences', ['$resource', function ($resource) {
    return $resource('/event/:id/preferences');
  }])
  .factory('dates', ['$resource', function ($resource) {
    return $resource('/event/:id/dates');
  }])
  .factory('venues', ['$resource', function ($resource) {
    return $resource('/event/:id/venues');
  }])
  .factory('authentication', ['$resource', function ($resource) {
    return $resource('/login');
  }])
    .factory('event', ['$resource', function ($resource) {
        return $resource('/event/:id');
    }])
    .factory('santa', ['$resource', function ($resource) {
        return $resource('/event/:id/reveal-name');
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
  }]);*/;function date(date, available)
{
	var self = this;
	
	self.date = date;
	self.available = available != null ? available : true;
};app.controller('appController', ['$rootScope', '$scope', '$route', '$location', 'user',
	function ($rootScope, $scope, $route, $location, user){
		var self = this;

		user.get(function (data) {
				$rootScope.email = data.email;
				$rootScope.name = data.name;
			}, function (error) {
				$location.path('/login');
			});

		self.routes = [];
		self.routeIsActive = function(route){
			return route.regexp.test($location.path());
		};
		
		angular.forEach($route.routes, function (config,route){			
			if (config.includeInNav == true)
				self.routes.push(config);
		});
		
		self.test = function(){
			console.log(self.routes);
		}
	}
]);;app.controller('preferencesController', ['$scope', '$routeParams', 'preferences', 'dates', 'venues', '$rootScope',
	function ($scope, $routeParams, preferences, dates, venues, $rootScope) {
		var self = this;

		var eventId = 1;

		self.userEmail = $routeParams.email == null ? $rootScope.email : $routeParams.email;
		$rootScope.email = self.userEmail;

		self.attending = false;
		self.doingPresents = false;

		self.availableVenues = ['Test Venue'];
		self.availableDates = [
			new date(moment(new Date(2015, 12, 1))),
			new date(moment(new Date(2015, 12, 2))),
			new date(moment(new Date(2015, 12, 3))),
			new date(moment(new Date(2015, 1, 1))),
			new date(moment(new Date(2015, 1, 2))),
			new date(moment(new Date(2015, 1, 3))),
			new date(moment(new Date(2015, 2, 14))),

		];

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
				email: self.userEmail,
				dates: dates,
				venue: self.venue
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
]);;app.controller('loginController', ['authentication', '$routeParams', function(authentication, $routeParams){
	var self = this;
	
	self.email = $routeParams.email;
	self.fail = false;
	self.success = false;
	
	self.login = function(){
		authentication.save({ email : self.email },
		function(data){
			if (data.valid)
			{
				self.success = true;
			}
			else
			{
				self.invalid = true;
			}
			self.fail = false;
		}, function(error){
			self.fail = true;
			self.success = false;
		});
	};
}]);;app.controller('eventController', ['event', 'santa', '$timeout', '$location', 'user', function(event, santa, $timeout, $location, user){
    var self = this;

    var eventId = 1;

    self.fail = false;
    self.success = false;

    self.event = null;

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
}]);;app.controller('homeController', ['authentication', '$location', function(authentication, $location){
    var self = this;

    self.fail = false;
    self.success = false;

    $location.path( "/event" );
}]);