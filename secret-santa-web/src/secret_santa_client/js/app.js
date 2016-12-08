var app = angular.module('secretSanta', ['ngRoute', 'ngResource'])
var root = '';

app.config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'home.html',
                controller: 'homeController',
                controllerAs: 'home',
                name: 'Home',
                path: '#/',
                includeInNav: false
            })
            .when('/login/:email?', {
                templateUrl: 'login.html',
                controller: 'loginController',
                controllerAs: 'login',
                name: 'Login',
                path: '#/login',
                includeInNav: false
            })
            .when('/event/:id/preferences', {
                templateUrl: 'preferences.html',
                controller: 'preferencesController',
                controllerAs: 'preferences',
                name: 'Preferences',
                path: '#/preferences',
                includeInNav: false
            })
            .when('/events', {
                templateUrl: 'events.html',
                controller: 'eventsController',
                controllerAs: 'events',
                path: '#/events',
                name: 'My Events',
                includeInNav: true
            })
            .when('/event/create', {
                templateUrl: 'edit-event.html',
                controller: 'editEventController',
                controllerAs: 'event',
                name: 'Edit Event',
                includeInNav: false
            })
            .when('/event/:id?', {
                templateUrl: 'event.html',
                controller: 'eventController',
                controllerAs: 'event',
                name: 'Event',
                includeInNav: false
            })
            .when('/event/:id/edit', {
                templateUrl: 'edit-event.html',
                controller: 'editEventController',
                controllerAs: 'event',
                name: 'Edit Event',
                includeInNav: false
            })
            .when('/admin/', {
                templateUrl: 'admin.html',
                controller: 'adminController',
                controllerAs: 'admin',
                name: 'Admin',
                includeInNav: false
            });

        //$locationProvider.html5Mode(true);
    }])
    .factory('user', ['$resource', function ($resource) {
        return $resource(root + '/user');
    }])
    .factory('preferences', ['$resource', function ($resource) {
        return $resource(root + '/event/:id/preferences');
    }])
    .factory('dates', ['$resource', function ($resource) {
        return $resource(root + '/event/:id/dates');
    }])
    .factory('venues', ['$resource', function ($resource) {
        return $resource(root + '/event/:id/venues');
    }])
    .factory('authentication', ['$resource', function ($resource) {
        return $resource(root + '/login');
    }])
    .factory('event', ['$resource', function ($resource) {
        return $resource(root + '/event/:id');
    }])
    .factory('santa', ['$resource', function ($resource) {
        return $resource(root + '/event/:id/reveal-name');
    }])
    .factory('events', ['$resource', function ($resource) {
        return $resource(root + '/events');
    }])
    .factory('eventUsers', ['$resource', function ($resource) {
        return $resource(root + '/event/:id/users');
    }])
    .factory('eventUser', ['$resource', function ($resource) {
        return $resource(root + '/event/:id/user', null,
            {
                'update': {method: 'PUT'}
            });
    }])
    .factory('emailUsers', ['$resource', function ($resource) {
        return $resource(root + '/event/:id/email-all-users');
    }])


    .directive('jqdatepicker', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, ngModelCtrl) {
                element.datepicker({
                    showOtherMonths: true,
                    selectOtherMonths: true,
                    dateFormat: 'dd MM yy', //'d MM, yy',
                    yearRange: '-0:+1'
                }).prev('.input-group-btn').on('click', function (e) {
                    e && e.preventDefault();
                    element.focus();
                });
                $.extend($.datepicker, {
                    _checkOffset: function (inst, offset, isFixed) {
                        return offset;
                    }
                });

                element.datepicker('widget').css({'margin-left': -element.prev('.input-group-btn').find('.btn').outerWidth() + 3});
            }
        };
    })
    .directive('bstoggle', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, ngModel) {
                element.bootstrapSwitch('state', ngModel.$$rawModelValue || false)
                    .on('switchChange.bootstrapSwitch', function (event, state) {
                        ngModel.$setViewValue(state);
                    });

                scope.$watch(attrs['ngModel'], function (v) {
                    element.bootstrapSwitch('state', v || false);
                });
            }
        };
    });
/*.factory('ajaxInterceptor', ['$q', '$rootScope', '$injector',
 function ($q, $rootScope, $injector) {
 return {
 // optional method
 'request': function (config) {
 $rootScope.$broadcast('ajax-state', { busy: true, success: false });
 return config;
 },
 'requestError': function (rejection) {
 $rootScope.$broadcast('ajax-state', { busy: false, success: false });
 return $q.reject(rejection);
 },
 'response': function (response) {
 $rootScope.$broadcast('ajax-state', { busy: false, sucess: true });
 return response;
 },
 'responseError': function (rejection) {
 $rootScope.$broadcast('ajax-state', { busy: false, success: false });
 return $q.reject(rejection);
 }
 };
 }])
 .config(['$httpProvider', '$rootScope', function ($httpProvider) {
 $httpProvider.interceptors.push('ajaxInterceptor');
 }]);*/