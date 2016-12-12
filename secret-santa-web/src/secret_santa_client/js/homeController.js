app.controller('homeController', ['authentication', '$location', function(authentication, $location){
    var self = this;

    self.fail = false;
    self.success = false;

    $location.path( "/events" );
}]);