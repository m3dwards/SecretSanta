app.controller('preferencesController', ['$scope', '$routeParams', 'preferences', 'dates', 'venues', '$rootScope', 'user',
	function ($scope, $routeParams, preferences, dates, venues, $rootScope, user) {
		var self = this;

		var eventId = 1;

		self.name = null;

        user.get(function (data) {
            self.name = data.name;
        });

		self.attending = false;
		self.doingPresents = false;

		self.availableVenues = ['Test Venue'];
		self.availableDates = [];

		preferences.get({ id: eventId }, function(data){
            if (data.venue != null) {
                self.attending = data.attending;
                self.doingPresents = data.doingPresents;
            }
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
				dates: dates,
				venue: self.venue,
				attending: self.attending,
				doingPresents: self.doingPresents
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