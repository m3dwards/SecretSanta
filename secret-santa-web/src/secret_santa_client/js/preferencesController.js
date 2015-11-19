app.controller('preferencesController', ['$scope', '$routeParams', '$rootScope', 'preferences', 'dates', 'venues',
	function($scope, $routeParams, $rootScope, preferences, dates, venues) {
		var self = this;

		var eventId = 1;
		
		self.userEmail = $routeParams.email == null ? $rootScope.email : $routeParams.email;
		$rootScope.email = self.userEmail;
		
		self.availableVenues = [];
		self.availableDates = [];

		venues.query({id: eventId}, function(data){
			self.availableVenues = data;
		});

		dates.query({id: eventId}, function(data){
			self.availableDates = data;
		});

		self.venue = null;
		
		self.formatDate = function(date){
			return date.date.format('Do MMMM YYYY');
		};
		
		self.savePreferences = function(){
			var dates = [];
			
			for (var i = 0; i < self.availableDates.length; i++)
			{
				var date = self.availableDates[i];
				dates.push({ date: date.date.utc().format('YYYY-MM-DD'), available: date.available });
			}
			
			preferences.save({
				email: self.userEmail,
				dates: dates,
				venue: self.venue
			});
		};
	}
]);