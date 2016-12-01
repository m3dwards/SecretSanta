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
      .when('/event/', {
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