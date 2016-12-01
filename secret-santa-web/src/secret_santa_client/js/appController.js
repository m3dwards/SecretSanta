app.controller('appController', ['$rootScope', '$scope', '$route', '$location', 'user',
	function ($rootScope, $scope, $route, $location, user){
		var self = this;

        user.get(function (data) {
            self.name = data.name;
        }, function (error) {
			$location.path('/login');
		});

		self.routes = [];
		self.routeIsActive = function(route){
			var path = $location.path();

			// todo replace :artifacts with query string params

			return route.regexp.test(path);
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