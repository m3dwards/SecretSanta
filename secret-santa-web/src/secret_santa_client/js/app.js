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
  .factory('options', ['$resource', function ($resource) {
    return $resource('/options');
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
  }]);