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
/*global angular, Highcharts */
/*jslint node: true */
'use strict';

var mvisServices = angular.module('mvisServices', ['ngResource', 'ngCookies']);

mvisServices.service('mvisService', ['$http', function ($http) {
    this.composeNodeName = function (id, display, host) {
        var name = id;
        if (display) {
            name += " - " + display;
        } else if (host) {
            name += " - " + host;
        }
        return name;
    };

    this.decomposeNodeId = function (name) {
        return name.replace(" - ", "-").split("-")[0];
    };

    this.getMinTimestamp = function (timestamp, timeslot) {
        var x = timestamp - (60 * 60 * 1000); // 1 hour before
        if (timeslot === "24 hours before") {
            x = timestamp - (24 * 60 * 60 * 1000);

        } else if (timeslot === "6 hours before") {
            x = timestamp - (6 * 60 * 60 * 1000);
        }
        return x;
    };

    this.authenticate = function (name, pswd) {
        return $http.post('/authenticate', {login: name, password: pswd});
    };

    this.ping = function () {
        return $http.post('/ping');
    };

    this.getQueryInfo = function () {
        return $http.get('/query_info');
    };

    this.getStatesLocation = function () {
        return $http.get('/states_location');
    };

    this.getRegionDevices = function (country, site) {
        return $http.get('/region/' + country + '/' + site);
    };

    this.getAllNodes = function () {
        return $http.get('/nodes');
    };

    this.getNodesName = function (country, site) {
        return $http.get('/nodes_name/' + country + '/' + site);
    };

    this.getInterfaces = function (country, site, nodeid) {
        return $http.get('/node_interfaces/' + country + '/' + site + '/' + nodeid);
    };

    this.getRTT = function (nodeid, ifaceid, timestamp, mintimestamp, resolution) {
        return $http.get('/rtt/' + nodeid + '/' + ifaceid + '/' + timestamp + "/" + mintimestamp + "/" + resolution);
    };

    this.getPacketLoss = function (nodeid, ifaceid, timestamp, mintimestamp, resolution) {
        return $http.get('/packetloss/' + nodeid + '/' + ifaceid + '/' + timestamp + "/" + mintimestamp + "/" + resolution);
    };

    this.getConnectionType = function (nodeid, ifaceid, timestamp, mintimestamp, resolution) {
        return $http.get('/connectiontype/' + nodeid + '/' + ifaceid + '/' + timestamp + "/" + mintimestamp + "/" + resolution);
    };

    this.getSignalStrength = function (nodeid, ifaceid, timestamp, mintimestamp, resolution) {
        return $http.get('/signalstrength/' + nodeid + '/' + ifaceid + '/' + timestamp + "/" + mintimestamp + "/" + resolution);
    };

    this.getGps = function (country, site, nodeid, timestamp, mintimestamp, resolution) {
        return $http.get('/gps/' + country + '/' + site + '/' + nodeid + '/' + timestamp + "/" + mintimestamp + "/" + resolution);
    };

    // Chart utilities
    this.createRTTChart = function (initcallback, loadcallback) {
        return new Highcharts.Chart({
            chart: {
                renderTo: 'rtt-chart',
                zoomType: 'x',
                events: {
                    load: function () {
                        var i, series = [];
                        for (i = 0; i < this.series.length; i += 1) {
                            series.push(this.series[i]);
                        }
                        for (i = 0; i < series.length; i += 1) {
                            loadcallback(series[i]);
                        }
                    }
                }
            },
            title: {text: ''},
            xAxis: {
                type: 'datetime',
                labels: {
                    overflow: 'justify',
                    format: '{value:%Y/%m/%d %H:%M:%S}',
                    align: 'right',
                    rotation: -30
                }
            },
            yAxis: {title: {text: 'RTT'}},
            legend: {enabled: true},
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
                        stops: [
                            [0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {radius: 2},
                    lineWidth: 1,
                    states: {hover: {lineWidth: 1}},
                    threshold: null
                }
            },
            series: initcallback()
        });
    };

    this.createRTTStockChart = function (initcallback, loadcallback) {
        return new Highcharts.StockChart({
            chart: {
                renderTo: 'rtt-chart',
                zoomType: 'x',
                events: {
                    load: function () {
                        var i, series = [];
                        for (i = 0; i < this.series.length; i += 1) {
                            if (this.series[i].name !== "Navigator") {
                                series.push(this.series[i]);
                            }
                        }
                        for (i = 0; i < series.length; i += 1) {
                            loadcallback(series[i]);
                        }
                    }
                }
            },
            title: {text: ''},
            xAxis: {
                type: 'datetime',
                labels: {
                    overflow: 'justify',
                    format: '{value:%Y/%m/%d %H:%M:%S}',
                    align: 'right',
                    rotation: -30
                }
            },
            yAxis: {title: {text: 'RTT'}},
            legend: {enabled: true},
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
                        stops: [
                            [0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {radius: 2},
                    lineWidth: 1,
                    states: {hover: {lineWidth: 1}},
                    threshold: null
                }
            },
            series: initcallback()
        });
    };

    this.createSignalStrenghtChart = function (initcallback, loadcallback) {
        return new Highcharts.Chart({
            chart: {
                renderTo: 'signal-strength-chart',
                zoomType: 'x',
                events: {
                    load: function () {
                        var i, series = [];
                        for (i = 0; i < this.series.length; i += 1) {
                            series.push(this.series[i]);
                        }
                        for (i = 0; i < series.length; i += 1) {
                            loadcallback(series[i]);
                        }
                    }
                }
            },
            title: {text: ''},
            xAxis: {
                type: 'datetime',
                labels: {
                    overflow: 'justify',
                    format: '{value:%Y/%m/%d %H:%M:%S}',
                    align: 'right',
                    rotation: -30
                }
            },
            yAxis: {title: {text: 'strength (dbm)'}},
            legend: {enabled: true},
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
                        stops: [
                            [0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {radius: 2},
                    lineWidth: 1,
                    states: {hover: {lineWidth: 1}},
                    threshold: null
                }
            },
            series: initcallback()
        });
    };

    this.createSignalStrenghtStockChart = function (initcallback, loadcallback) {
        return new Highcharts.StockChart({
            chart: {
                renderTo: 'signal-strength-chart',
                zoomType: 'x',
                events: {
                    load: function () {
                        var i, series = [];
                        for (i = 0; i < this.series.length; i += 1) {
                            if (this.series[i].name !== "Navigator") {
                                series.push(this.series[i]);
                            }
                        }
                        for (i = 0; i < series.length; i += 1) {
                            loadcallback(series[i]);
                        }
                    }
                }
            },
            title: {text: ''},
            xAxis: {
                type: 'datetime',
                labels: {
                    overflow: 'justify',
                    format: '{value:%Y/%m/%d %H:%M:%S}',
                    align: 'right',
                    rotation: -30
                }
            },
            yAxis: {title: {text: 'strength (dbm)'}},
            legend: {enabled: true},
            plotOptions: {
                area: {
                    fillColor: {
                        linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
                        stops: [
                            [0, Highcharts.getOptions().colors[0]],
                            [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    },
                    marker: {radius: 2},
                    lineWidth: 1,
                    states: {hover: {lineWidth: 1}},
                    threshold: null
                }
            },
            series: initcallback()
        });
    };

    this.createPacketLossChart = function (initcallback, loadcallback) {
        return new Highcharts.Chart({
            chart: {
                renderTo: 'packet-loss-chart',
                type: 'gauge',
                events: {
                    load: function () {
                        var i, series = [];
                        for (i = 0; i < this.series.length; i += 1) {
                            series.push(this.series[i]);
                        }
                        for (i = 0; i < series.length; i += 1) {
                            loadcallback(series[i]);
                        }
                    }
                }
            },
            title: {text: ''},
            pane: {startAngle: -150, endAngle: 150},
            yAxis: {
                min: 0,
                max: 100,
                title: {text: 'packet-loss (%)'},
                plotBands: [
                    {from: 0, to: 5, color: '#55BF3B'}, // green
                    {from: 5, to: 25, color: '#DDDF0D'}, // yellow
                    {from: 25, to: 100, color: '#DF5353'} // red
                ]
            },
            series: initcallback()
        });
    };

    this.createConnectionTypeChart = function (initcallback, loadcallback) {
        return new Highcharts.Chart({
            chart: {
                renderTo: 'connection-type-chart',
                type: 'pie',
                events: {
                    load: function () {
                        var i, series = [];
                        for (i = 0; i < this.series.length; i += 1) {
                            series.push(this.series[i]);
                        }
                        for (i = 0; i < series.length; i += 1) {
                            loadcallback(series[i]);
                        }
                    }
                }
            },
            title: {text: ''},
            series: initcallback()
        });
    };
}]);

mvisServices.factory('mvisQueryService', function () {
    var query = {
        date: new Date(),
        time: new Date(),
        timeslot: {},
        testbed: {},
        node: {},
        iface: {},
        experiment: {},
        resolution: {}
    };

    query.save = function (date, time, timeslot, testbed, node, iface, experiment, resolution) {
        query.date = date;
        query.time = time;
        query.timeslot = timeslot;
        query.testbed = testbed;
        query.node = node;
        query.iface = iface;
        query.experiment = experiment;
        query.resolution = resolution;
    };

    query.getUTCtime = function (date, time) {
        var d = new Date(date.getFullYear(), date.getMonth(), date.getDate(),
                         time.getHours(), time.getMinutes(), time.getSeconds());
        return d.getTime();
    };

    return query;
});
