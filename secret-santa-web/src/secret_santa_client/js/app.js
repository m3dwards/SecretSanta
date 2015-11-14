angular.module('secretSanta', ['ngRoute', 'ngResource'])
.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
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
.factory('preferences', function($resource) {
  return $resource('/preferences');
});