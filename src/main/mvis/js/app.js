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
                                         'timepickerPop', 'mvisControllers', 'mvisSchedulerControllers', 'mvisServices']);

mvisApp.config(function ($stateProvider, $urlRouterProvider) {
    // global HighChart option here!
    Highcharts.setOptions({global : {useUTC : false}});

    $urlRouterProvider.otherwise('/notfound');
    $stateProvider
        .state('start', {
            url: '',
            views: {
                'main': {
                    templateUrl: 'template/start.html',
                    controller: 'StartController'
                }
            }
        })
        .state('notfound', {
            url: '/notfound',
            views: {
                'main': {
                    templateUrl: 'template/notfound.html'
                }
            }
        })
        .state('error', {
            url: '/error',
            params: {error: null},
            views: {
                'main': {
                    templateUrl: 'template/error.html',
                    controller: function ($scope, $stateParams) {
                        $scope.error = $stateParams.error;
                    }
                }
            }
        })
        .state('testbed', {
            url: '/testbed',
            abstract: true,
            views: {
                'main': {templateUrl: 'template/index.html'}
            }
        })
        .state('testbed.management', {
            url: '/management',
            views: {
                'info': {
                    templateUrl: 'template/management/main_mgmt.html',
                    controller: 'mainMgmtController'
                }
            }
        })
        .state('testbed.map', {
            url: '/map',
            views: {
                'info': {
                    templateUrl: 'template/map/earth.html',
                    controller: 'testbedController'
                }
            }
        })
        .state('testbed.state', {
            url: '/state/{country}/{site}',
            views: {
                'info': {
                    templateUrl: 'template/map/state-region.html',
                    controller: 'stateRegionController'
                }
            }
        })
        .state('testbed.periodic', {
            url: '/periodic?country&site&nodeid&timeout',
            views: {
                'info': {
                    templateUrl: 'template/monitoring/periodic.html',
                    controller: 'periodicInfoController'
                },
                'charts': {
                    templateUrl: 'template/monitoring/periodicCharts.html',
                    controller: 'periodicChartsController'
                }
            }
        })
        .state('experiment', {
            url: '/experiment',
            abstract: true,
            views: {
                'main': {templateUrl: 'template/index.html'}
            }
        })
        .state('experiment.basic', {
            url: '/basic',
            views: {
                'info': {
                    templateUrl: 'template/experiment/info.html',
                    controller: 'experimentInfoController'
                },
                'charts': {
                    templateUrl: 'template/experiment/basicCharts.html',
                    controller: 'experimentBasicController'
                }
            }
        })
        .state('scheduler', {
            url: '/scheduler',
            abstract: true,
            views: {
                'layout': {
                    templateUrl: 'template/scheduler/index.html',
                    controller: 'schedulerIndexCtrl'
                }
            }
        })
        .state('scheduler.status', {
            url: '/status',
            views: {
                'main': {
                    templateUrl: 'template/scheduler/StatusExperiment.html',
                    controller: 'schedulerStatusExperimentCtrl'
                }
            }
        })
        .state('scheduler.errorserver', {
            url: '/scheduler_errorserver',
            views: {
                'main': {
                    templateUrl: 'template/scheduler/ErrorServer.html'
                }
            }
        });
});

mvisApp.run(function () {
    console.log('MVIS application started!');
});
