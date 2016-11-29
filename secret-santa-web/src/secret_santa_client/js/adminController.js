app.controller('adminController', ['$scope', '$routeParams', 'preferences', 'dates', 'venues', '$rootScope',
    function ($scope, $routeParams, preferences, dates, venues, $rootScope) {

    var self = this;

    self.fail = false;
    self.success = false;

    $location.path( "/admin" );
}]);