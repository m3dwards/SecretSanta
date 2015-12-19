app.controller('loginController', ['authentication', '$routeParams', function(authentication, $routeParams){
	var self = this;
	
	self.email = $routeParams.email;
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