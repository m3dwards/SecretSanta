angular.module('secretSanta', ['ngRoute', 'ngResource'])
.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'preferences.html',
        controller: 'preferencesController',
        controllerAs: 'preferences'
      });

    //$locationProvider.html5Mode(true);
}])
.factory('dates', function($resource) {
  return $resource('/api/entries/:id'); // Note the full endpoint address
});