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
    return $resource('/authentication');
  }])
  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push(['$q', function ($q) {
      return {
        // optional method
        'request': function (config) {
          $("#busy").show();
          $('.hide-on-busy').hide();
          $('.ajax-success').hide();
          $('.ajax-failure').hide();
          return config;
        },
        'requestError': function (rejection) {

          $("#busy").hide();
          $('.hide-on-busy').show();
          $('.ajax-failure').show();
          return $q.reject(rejection);
        },
        'response': function (response) {
          $("#busy").hide();
          $('.hide-on-busy').show();
          $('.ajax-success').show();

          return response;
        },
        'responseError': function (rejection) {
          $("#busy").hide();
          $('.hide-on-busy').show();
          $('.ajax-failure').show();

          return $q.reject(rejection);
        }
      };
    }]);
  }]);;function date(date, available)
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
]);;app.controller('preferencesController', ['$scope', '$routeParams', '$rootScope', 'preferences', 'dates', 'venues',
	function($scope, $routeParams, $rootScope, preferences, dates, venues) {
		var self = this;

		var eventId = 1;
		
		self.userEmail = $routeParams.email == null ? $rootScope.email : $routeParams.email;
		$rootScope.email = self.userEmail;
		
		self.availableVenues = [];
		self.availableDates = [];

		venues.query({id: eventId}, function(data){
			self.availableVenues = data;
		});

		dates.query({id: eventId}, function(data){
			angular.forEach(data, function(item) {
				self.availableDates.push(new date(moment(new Date(item))));
			});
		});

		self.venue = null;
		
		self.formatDate = function(date){
			return date.date.format('Do MMMM YYYY');
		};
		
		self.savePreferences = function(){
			var dates = [];
			
			for (var i = 0; i < self.availableDates.length; i++)
			{
				var date = self.availableDates[i];
				dates.push({ date: date.date.utc().format('YYYY-MM-DD'), available: date.available });
			}
			
			preferences.save({
				email: self.userEmail,
				dates: dates,
				venue: self.venue
			});
		};
	}
]);;app.controller('loginController', ['authentication', function(authentication){
	var self = this;
	
	self.email = null;
	
	self.login = function(){
		// todo login	
	};
}]);