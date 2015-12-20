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
  }]);*/