app.controller('userDetailsController', function ($scope, $routeParams, preferences, dates, venues, $rootScope, user, $q, $location) {
    var self = this;

    self.busy = false;

    self.name = null;
    self.email = null;
    self.isNewUser = false;
    self.user = null;

    user.get(function (data) {
        self.user = data;
        self.name = data.name;
        self.isNewUser = !self.name;

        self.email = data.email;
    });

    self.saveUser = function () {
        self.busy = true;

        user.update({ name: self.name, email: self.email }, function (response) {
            $location.path('/events');
        });
    }
});