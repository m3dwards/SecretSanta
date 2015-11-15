var app = angular.module('secretSanta', ['ngRoute', 'ngResource'])

app.config(['$routeProvider', '$locationProvider',
  function ($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'home.html',
        name: 'Home',
        path: '#/'
      })
      .when('/preferences/:email?', {
        templateUrl: 'preferences.html',
        controller: 'preferencesController',
        controllerAs: 'preferences',
        name: 'Preferences',
        path: '#/preferences'
      });

    //$locationProvider.html5Mode(true);
  }])
  .factory('preferences', ['$resource', function ($resource) {
    return $resource('/preferences');
  }])
  .config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push(function ($q) {
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
    });
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
			if (config.redirectTo == null)
				self.routes.push(config);
		});
		
		self.test = function(){
			console.log(self.routes);
		}
	}
]);;app.controller('preferencesController', ['$scope', '$routeParams', '$rootScope', 'preferences',
	function($scope, $routeParams, $rootScope, preferences) {
		var self = this;
		
		self.userEmail = $routeParams.email == null ? $rootScope.email : $routeParams.email;
		$rootScope.email = self.userEmail;
		
		self.availableVenues = ['Red Lion', 'Parson'];
		self.availableDates = [
			new date(moment(new Date(2015,1,1))),
			new date(moment(new Date(2015,1,2))),
			new date(moment(new Date(2015,1,5))),
			new date(moment(new Date(2015,1,6)))
		];

		self.venue = null;
		
		self.formatDate = function(date){
			return date.date.format('MMMM Do YYYY');
		};
		
		self.savePreferences = function(){
			var dates = [];
			
			for (var i = 0; i < self.availableDates.length; i++)
			{
				var date = self.availableDates[i];
				dates.push({ date: date.date.utc().toDate(), available: date.selected });
			}
			
			preferences.save({
				email: self.userEmail,
				dates: dates,
				venue: self.venue
			});
		};
	}
]);