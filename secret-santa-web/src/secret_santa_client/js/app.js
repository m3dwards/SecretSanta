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
  }]);