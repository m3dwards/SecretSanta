app.controller('appController', ['$scope', '$route', '$location', 'user',
	function ($scope, $route, $location, user){
		var self = this;

		user.get(function (data) {
				// we're authenticated
			}, function (error) {
				$location.path('/login');
			});

		self.routes = [];
		self.routeIsActive = function(route){
			return route.regexp.test($location.path());
		};
		
		angular.forEach($route.routes, function (config,route){			
			if (config.includeInNav == true)
				self.routes.push(config);
		});
		
		self.test = function(){
			console.log(self.routes);
		}
	}
]);