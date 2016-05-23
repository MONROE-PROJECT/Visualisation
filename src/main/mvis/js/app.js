/*
 * MONROE: Visualisation Application.
 * Copyright (C) 2015 Roberto Monno
 *
 * Nextworks s.r.l - r DOT monno AT nextworks.it
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
**/
/*global angular, console, Highcharts */
/*jslint node: true */
'use strict';


var mvisApp = angular.module('mvisApp', ['ngSanitize', 'ngTable', 'ui.router', 'ui.bootstrap', 'ui.select',
                                         'timepickerPop', 'mvisControllers', 'mvisServices']);

mvisApp.config(function ($stateProvider, $urlRouterProvider) {
    // global HighChart option here!
    Highcharts.setOptions({global : {useUTC : false}});

    $urlRouterProvider.otherwise('/notfound');
    $stateProvider
        .state('start', {
            url: '',
            views: {
                main: {
                    templateUrl: 'template/start.html',
                    controller: 'StartController'
                }
            }
        })
        .state('login', {
            url: '/login',
            views: {
                main: {
                    templateUrl: 'template/login.html',
                    controller: 'LoginController'
                }
            }
        })
        .state('logout', {
            url: '/logout',
            views: {
                main: {
                    templateUrl: 'template/logout.html',
                    controller: 'LogoutController'
                }
            }
        })
        .state('notfound', {
            url: '/notfound',
            views: {
                main: {
                    templateUrl: 'template/notfound.html'
                }
            }
        })
        .state('error', {
            url: '/error',
            params: {error: null},
            views: {
                main: {
                    templateUrl: 'template/error.html',
                    controller: function ($scope, $stateParams) {
                        $scope.error = $stateParams.error;
                    }
                }
            }
        })
        .state('management', {
            url: '/management',
            views: {
                'main': {
                    templateUrl: 'template/management/main_mgmt.html',
                    controller: 'mainMgmtController'
                },
                'sidemenu': {
                    templateUrl: 'template/management/side_mgmt.html',
                    controller: 'sideMgmtController'
                }
            }
        })
        .state('testbed', {
            url: '/testbed',
            abstract: true,
            views: {
                'sidemenu': {
                    templateUrl: 'template/query.html',
                    controller: 'queryController'
                }
            }
        })
        .state('testbed.map', {
            url: '/map',
            views: {
                'main@': {
                    templateUrl: 'template/map/earth.html',
                    controller: 'testbedController'
                }
            }
        })
        .state('testbed.state', {
            url: '/state/{country}/{site}',
            views: {
                'main@': {
                    templateUrl: 'template/map/state-region.html',
                    controller: 'stateRegionController'
                }
            }
        })
        .state('statistic', {
            url: '/statistic',
            abstract: true,
            views: {
                'sidemenu': {
                    templateUrl: 'template/query.html',
                    controller: 'queryController'
                }
            }
        })
        .state('statistic.ping', {
            url: '/ping?testbedid&nodeid&ifaceid&timestamp&mintimestamp&resolution',
            views: {
                'main@': {
                    templateUrl: 'template/monitoring/networking.html',
                    controller: 'statPingController'
                }
            }
        })
        .state('statistic.http-download', {
            url: '/httpdownload?testbedid&nodeid&ifaceid&timestamp&mintimestamp&resolution',
            views: {
                'main@': {
                    templateUrl: 'template/monitoring/httpdownload.html',
                    controller: 'statHttpDownloadController'
                }
            }
        })
        .state('statistic.periodic', {
            url: '/periodic?country&site&nodeid&timeout',
            views: {
                'main@': {
                    templateUrl: 'template/monitoring/periodic.html',
                    controller: 'statPeriodicController'
                }
            }
        });
});

mvisApp.run(function () {
    console.log('MVIS application started!');
});
