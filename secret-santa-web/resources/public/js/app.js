var app = angular.module('secretSanta', ['ngRoute', 'ngResource'])

app.config(['$routeProvider', '$locationProvider',
  function ($routeProvider, $locationProvider) {
    $routeProvider
    /*.when('/', {
      templateUrl: 'home.html',
      name: 'Home',
      path: '#/',
      includeInNav: true
    })*/
      .when('/login', {
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
        includeInNav: true
      });

    //$locationProvider.html5Mode(true);
  }])
  .factory('preferences', ['$resource', function ($resource) {
    return $resource('/preferences');
  }])
  .factory('dates', ['$resource', function ($resource) {
    return $resource('/event/:id/dates');
  }])
  .factory('venues', ['$resource', function ($resource) {
    return $resource('/event/:id/venues');
  }])
  .factory('authentication', ['$resource', function ($resource) {
    return $resource('/authentication/:id');
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
};app.controller('appController', ['$scope', '$route', '$location', 
	function ($scope, $route, $location){
		var self = this;
		
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

		self.availableVenues = ['Test Venue'];
		self.availableDates = [new date(moment(new Date(2015, 12, 1)))];

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

			preferences.save({
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
]);;app.controller('loginController', ['authentication', function(authentication){
	var self = this;
	
	self.email = null;
	
	self.login = function(){
		// todo login	
	};
}]);