angular.module('secretSanta')
	.controller('preferencesController', ['$scope', '$routeParams', '$rootScope', 'preferences',
	function($scope, $routeParams, $rootScope, preferences) {
		var self = this;
		
		self.userEmail = $rootScope.email == null ? $routeParams.email : $rootScope.email;
		$rootScope.email = self.userEmail;
		
		self.availableVenues = ['Red Lion', 'Parson'];
		self.availableDates = [
			{ date: moment(new Date(2015,1,1)), selected: false },
			{ date: moment(new Date(2015,1,2)), selected: false },
			{ date: moment(new Date(2015,1,5)), selected: false },
			{ date: moment(new Date(2015,1,6)), selected: false }
		]

		self.venue = null;
		
		self.formatDate = function(date){
			return date.date.format('MMMM Do YYYY');
		};
		
		self.savePreferences = function(){
			var dates = [];
			
			for (var i = 0; i < self.availableDates.length; i++)
			{
				var date = self.availableDates[i];
				dates.push({ date: date.date.toDate(), selected: date.selected });
			}
			
			preferences.save({
				email: self.userEmail,
				dates: dates,
				venue: self.venue
			});
		};
	}
]);