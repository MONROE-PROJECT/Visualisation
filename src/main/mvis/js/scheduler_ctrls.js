/*global angular, console, alert*/
/*jslint node: true */
'use strict';

var mvisSchedulerControllers = angular.module('mvisSchedulerControllers', ['ui.router', 'ngStorage', 'mvisServices']);

mvisSchedulerControllers.constant("AuthURL", "https://scheduler.monroe-system.eu/v1/backend/auth");

mvisSchedulerControllers.controller('schedulerIndexCtrl', ['$scope', '$http', '$state', 'AuthURL', function ($scope, $http, $state, AuthURL) {
    console.log("schedulerIndexCtrl", AuthURL);
    $http.get(AuthURL, {withCredentials: true})
        .success(function (data) {
            console.log("success");
            if (data.verified === "SUCCESS") {
                if (data.user.role === "user") {
                    $state.go('scheduler.status');
                } else if (data.user.role === "admin") {
                    $state.go('scheduler.adminuser');
                }
            } else {
                $state.go('scheduler.newuser');
            }
        })
        .error(function (error) {
            console.log("Authentication failure!", error);
            $state.go('scheduler.errorserver');
        });
}]);

mvisSchedulerControllers.controller('schedulerStatusExperimentCtrl', ['$scope', function ($scope) {
    console.log("schedulerStatusExperimentCtrl");
}]);
