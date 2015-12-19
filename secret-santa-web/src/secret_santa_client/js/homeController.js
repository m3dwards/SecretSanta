app.controller('homeController', ['authentication', function(authentication){
    var self = this;

    self.fail = false;
    self.success = false;

    self.login = function(){
        authentication.save({ email : self.email },
            function(data){
                self.fail = false;
                self.success = true;
            }, function(error){
                self.fail = true;
                self.success = false;
            });
    };
}]);