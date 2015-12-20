app.controller('loginController', ['authentication', '$routeParams', function(authentication, $routeParams){
	var self = this;
	
	self.email = $routeParams.email;
	self.fail = false;
	self.success = false;
	
	self.login = function(){
		authentication.save({ email : self.email.toLowerCase() },
		function(data){
			if (data.valid)
			{
				self.success = true;
				self.invalid = false;
			}
			else
			{
				self.success = false;
				self.invalid = true;
			}
			self.fail = false;
		}, function(error){
			self.fail = true;
			self.success = false;
		});
	};
}]);