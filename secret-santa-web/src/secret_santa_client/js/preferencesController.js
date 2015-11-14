angular.module('secretSanta')
	.controller('preferencesController', ['$scope', 'dates', '$routeParams', '$rootScope',
	function($scope, dates, $routeParams, $rootScope) {
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
			console.log(self);	
		};
	}
]);