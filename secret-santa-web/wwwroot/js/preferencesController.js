angular.module('secretSanta').controller('preferencesController', ['$scope', 'dates', function($scope, dates) {
	var self = this;
	
	self.availableVenues = ['Red Lion', 'Parson'];
	self.availableDates = [
		moment(new Date(2015,1,1)),
		moment(new Date(2015,1,2)),
		moment(new Date(2015,1,5)),
		moment(new Date(2015,1,6)),
	]
	
	self.selectedDates = [];
	self.venue = null;
	
	self.addDate = function(date){
		self.selectedDates.push(date);
	}
	
	self.removeDate = function(date){
		self.selectedDates.pop(date);
	}
	
	self.formatDate = function(date){
		return date.format('MMMM Do YYYY, h:mm:ss a');
	};
	
	self.savePreferences = function(){
		console.log('Saving preferences...');	
	};
}]);