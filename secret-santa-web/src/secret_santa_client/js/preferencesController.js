app.controller('preferencesController', ['$scope', '$routeParams', 'preferences', 'dates', 'venues', '$rootScope',
	function ($scope, $routeParams, preferences, dates, venues, $rootScope) {
		var self = this;

		var eventId = 1;

		self.userEmail = $routeParams.email == null ? $rootScope.email : $routeParams.email;
		$rootScope.email = self.userEmail;

		self.attending = false;
		self.doingPresents = false;

		self.availableVenues = ['Test Venue'];
		self.availableDates = [
			new date(moment(new Date(2015, 12, 1))),
			new date(moment(new Date(2015, 12, 2))),
			new date(moment(new Date(2015, 12, 3))),
			new date(moment(new Date(2015, 1, 1))),
			new date(moment(new Date(2015, 1, 2))),
			new date(moment(new Date(2015, 1, 3))),
			new date(moment(new Date(2015, 2, 14))),

		];

		preferences.get({ id: eventId }, function(data){
			self.attending = data.attending;
			self.doingPresents = data.doingPresents;
		});

		venues.query({ id: eventId }, function (data) {
			self.availableVenues = data;
		});

		dates.query({ id: eventId }, function (data) {
			self.availableDates = [];

			angular.forEach(data, function (item) {
				self.availableDates.push(new date(moment(new Date(item))));
			});
		});

		self.venue = null;

		self.busy = false;
		self.success = false;
		self.fail = false;

		self.formatDate = function (date) {
			return date.date.format('Do MMMM YYYY');
		};

		self.savePreferences = function () {
			var dates = [];
			
			self.busy = true;

			for (var i = 0; i < self.availableDates.length; i++) {
				var date = self.availableDates[i];
				dates.push({ date: date.date.utc().format('YYYY-MM-DD'), available: date.available });
			}

			preferences.save({ id: eventId },
			{
				email: self.userEmail,
				dates: dates,
				venue: self.venue
			}, function (data) {
				self.busy = false;
				self.success = true;
				self.fail = false;
			}, function (error) {
				self.busy = false;
				self.success = false;
				self.fail = false;
			});
		};

		/*$scope.$on('ajax-state', function (e, args) {
			if (args.busy) {
				self.busy = true;
			}
			else {
				self.busy = true;

				if (args.success) {
					self.success = true;
					self.fail = false;
				}
				else {
					self.success = false;
					self.fail = true;
				}
			}
		});*/
	}
]);