angular.module('secretSanta')
	.controller('preferencesController', ['$scope', '$routeParams', '$rootScope', 'preferences',
	function($scope, $routeParams, $rootScope, preferences) {
		var self = this;
		
		self.userEmail = $routeParams.email == null ? $rootScope.email : $routeParams.email;
		$rootScope.email = self.userEmail;
		
		self.availableVenues = ['Red Lion', 'Parson'];
		self.availableDates = [
			new date(moment(new Date(2015,1,1))),
			new date(moment(new Date(2015,1,2))),
			new date(moment(new Date(2015,1,5))),
			new date(moment(new Date(2015,1,6)))
		];

		self.venue = null;
		
		self.formatDate = function(date){
			return date.date.format('MMMM Do YYYY');
		};
		
		self.savePreferences = function(){
			var dates = [];
			
			for (var i = 0; i < self.availableDates.length; i++)
			{
				var date = self.availableDates[i];
				dates.push({ date: date.date.utc().toDate(), selected: date.selected });
			}
			
			preferences.save({
				email: self.userEmail,
				dates: dates,
				venue: self.venue
			});
		};
	}
]);