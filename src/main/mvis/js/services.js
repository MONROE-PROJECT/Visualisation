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

    this.composeModemName = function (operator, identifier) {
        var name = "";
        if (operator) {
            name += operator + " - ";
        }
        if (identifier) {
            name += identifier;
        }
        return name;
    };

    this.getMinTimestamp = function (timestamp, timeslot) {
        var x = timestamp - (60 * 60 * 1000); // 1 hour before
        if (timeslot === "48 hours in the past") {
            x = timestamp - (48 * 60 * 60 * 1000);

        } else if (timeslot === "24 hours in the past") {
            x = timestamp - (24 * 60 * 60 * 1000);

        } else if (timeslot === "6 hours in the past") {
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

    this.getNodeLastActivityRTT = function (nodeid, interfaces) {
        return $http.get('/nodelastactivityrtt/' + nodeid + '/' + interfaces);
    };

    this.getNodeLastActivityMODEM = function (nodeid, interfaces) {
        return $http.get('/nodelastactivitymodem/' + nodeid + '/' + interfaces);
    };

    this.getNodeLastActivityGPS = function (nodeid) {
        return $http.get('/nodelastactivitygps/' + nodeid);
    };

    this.registerDevice = function (body) {
        return $http.post('/register_device', body);
    };

    this.resynchoniseDb = function (body) {
        return $http.post('/resynchronise_db', body);
    };

    this.getNodesName = function (country, site) {
        return $http.get('/nodes_name/' + country + '/' + site);
    };

    this.getInterfaces = function (country, site, nodeid) {
        return $http.get('/node_interfaces/' + country + '/' + site + '/' + nodeid);
    };

    this.getIfDetails = function (country, site, nodeid) {
        return $http.get('/node_ifdetails/' + country + '/' + site + '/' + nodeid);
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

    this.getHttpSpeed = function (nodeid, ifaceid, timestamp, mintimestamp, resolution) {
        return $http.get('/httpspeed/' + nodeid + '/' + ifaceid + '/' + timestamp + "/" + mintimestamp + "/" + resolution);
    };

    this.getTstatThroughput = function (nodeid, ifaceid, timestamp, mintimestamp, resolution) {
        return $http.get('/tstatthroughput/' + nodeid + '/' + ifaceid + '/' + timestamp + "/" + mintimestamp + "/" + resolution);
    };

    this.getTstatRtt = function (nodeid, ifaceid, timestamp, mintimestamp, resolution) {
        return $http.get('/tstatrtt/' + nodeid + '/' + ifaceid + '/' + timestamp + "/" + mintimestamp + "/" + resolution);
    };

    this.getTstatRetransmission = function (nodeid, ifaceid, timestamp, mintimestamp, resolution) {
        return $http.get('/tstatretransmission/' + nodeid + '/' + ifaceid + '/' + timestamp + "/" + mintimestamp + "/" + resolution);
    };

    this.getTstatThreewayhandshaketime = function (nodeid, ifaceid, timestamp, mintimestamp, resolution) {
        return $http.get('/tstatthreewayhandshaketime/' + nodeid + '/' + ifaceid + '/' + timestamp + "/" + mintimestamp + "/" + resolution);
    };

    this.getTstatTimeToLive = function (nodeid, ifaceid, timestamp, mintimestamp, resolution) {
        return $http.get('/tstattimetolive/' + nodeid + '/' + ifaceid + '/' + timestamp + "/" + mintimestamp + "/" + resolution);
    };

    this.getCPU = function (nodeid, timestamp, mintimestamp, resolution) {
        return $http.get('/cpu/' + nodeid + '/' + timestamp + "/" + mintimestamp + "/" + resolution);
    };

    this.getGps = function (country, site, nodeid, timestamp, mintimestamp, resolution) {
        return $http.get('/gps/' + country + '/' + site + '/' + nodeid + '/' + timestamp + "/" + mintimestamp + "/" + resolution);
    };

    this.getEvents = function (nodeid, timestamp, mintimestamp, resolution) {
        return $http.get('/events/' + nodeid + '/' + timestamp + "/" + mintimestamp + "/" + resolution);
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
                                series.push({
                                    s: this.series[i],
                                    b: []
                                });
                            }
                        }
                        for (i = 0; i < series.length; i += 1) {
                            loadcallback(series[i].s, series[i].b);
                        }
                    }
                }
            },
            rangeSelector: {
                buttons: [{
                    count: 1,
                    type: 'minute',
                    text: '1M'
                }, {
                    count: 5,
                    type: 'minute',
                    text: '5M'
                }, {
                    type: 'all',
                    text: 'All'
                }],
                inputEnabled: true,
                selected: 2
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

    this.createCPUStockChart = function (initcallback, loadcallback) {
        return new Highcharts.StockChart({
            chart: {
                renderTo: 'cpu-chart',
                type: 'area',
                zoomType: 'x',
                events: {
                    load: function () {
                        var i, series = [];
                        for (i = 0; i < this.series.length; i += 1) {
                            if (this.series[i].name !== "Navigator") {
                                series.push({
                                    s: this.series[i],
                                    b: []
                                });
                            }
                        }
                        for (i = 0; i < series.length; i += 1) {
                            loadcallback(series[i].s, series[i].b);
                        }
                    }
                }
            },
            rangeSelector: {
                buttons: [{
                    count: 1,
                    type: 'minute',
                    text: '1M'
                }, {
                    count: 5,
                    type: 'minute',
                    text: '5M'
                }, {
                    type: 'all',
                    text: 'All'
                }],
                inputEnabled: true,
                selected: 2
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
            yAxis: {title: {text: 'CPU (%)'}},
            legend: {enabled: false},
            plotOptions: {
                area: {
                    marker: {
                        enabled: true,
                        symbol: 'circle',
                        radius: 2,
                        states: {
                            hover: {enabled: true}
                        }
                    }
                }
            },
            series: initcallback()
        });
    };

    this.createHTTPDownloadChart = function (initcallback, loadcallback) {
        return new Highcharts.Chart({
            chart: {
                renderTo: 'httpdownload-chart',
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
            yAxis: {title: {text: 'Speed (b/s)'}},
            legend: {enabled: true},
            plotOptions: {
                scatter: {
                    marker: {
                        radius: 5,
                        states: {
                            hover: {
                                enabled: true,
                                lineColor: 'rgb(100,100,100)'
                            }
                        }
                    },
                    states: {
                        hover: {
                            marker: {enabled: true}
                        }
                    },
                    tooltip: {
                        headerFormat: '<b>{series.name}</b><br>',
                        pointFormat: '{point.x} , {point.y} (b/s)'
                    }
                }
            },
            series: initcallback()
        });
    };

    this.createHttpSpeedStockChart = function (initcallback, loadcallback) {
        return new Highcharts.StockChart({
            chart: {
                renderTo: 'http-speed-chart',
                type: 'scatter',
                zoomType: 'xy',
                events: {
                    load: function () {
                        var i, series = [];
                        for (i = 0; i < this.series.length; i += 1) {
                            if (this.series[i].name !== "Navigator") {
                                series.push({
                                    s: this.series[i],
                                    b: []
                                });
                            }
                        }
                        for (i = 0; i < series.length; i += 1) {
                            loadcallback(series[i].s, series[i].b);
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
            yAxis: {title: {text: 'SPEED (b/sec)'}},
            legend: {enabled: true},
            rangeSelector: {
                buttons: [{
                    count: 1,
                    type: 'minute',
                    text: '1M'
                }, {
                    count: 5,
                    type: 'minute',
                    text: '5M'
                }, {
                    type: 'all',
                    text: 'All'
                }],
                inputEnabled: true,
                selected: 2
            },
            plotOptions: {
                scatter: {
                    marker: {
                        radius: 5,
                        states: {
                            hover: {
                                enabled: true,
                                lineColor: 'rgb(100,100,100)'
                            }
                        }
                    },
                    states: {
                        hover: {
                            marker: {enabled: true}
                        }
                    },
                    tooltip: {
                        headerFormat: '<b>{series.name}</b><br>',
                        pointFormat: '{point.x} , {point.y} (b/sec)'
                    }
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
                                series.push({
                                    s: this.series[i],
                                    b: []
                                });
                            }
                        }
                        for (i = 0; i < series.length; i += 1) {
                            loadcallback(series[i].s, series[i].b);
                        }
                    }
                }
            },
            rangeSelector: {
                buttons: [{
                    count: 1,
                    type: 'minute',
                    text: '1M'
                }, {
                    count: 5,
                    type: 'minute',
                    text: '5M'
                }, {
                    type: 'all',
                    text: 'All'
                }],
                inputEnabled: true,
                selected: 2
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

    this.create3DColumnChart = function (chart, titletext, initcallback, loadcallback) {
        return new Highcharts.Chart({
            chart: {
                renderTo: chart,
                zoomType: 'x',
                type: 'column',
                options3d: {enabled: true, alpha: 10, beta: 25, depth: 70},
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
            yAxis: {title: {text: titletext}},
            legend: {enabled: true},
            plotOptions: {
                column: {depth: 25}
            },
            series: initcallback()
        });
    };

    this.createSplineChart = function (chart, titletext, initcallback, loadcallback) {
        return new Highcharts.Chart({
            chart: {
                renderTo: chart,
                zoomType: 'x',
                type: 'spline',
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
            yAxis: {title: {text: titletext}},
            legend: {enabled: true},
            plotOptions: {
                spline: {marker: {enabled: true}}
            },
            tooltip: {
                headerFormat: '<b>{series.name}</b><br>',
                pointFormat: '{point.x:%e. %b}: {point.y:.2f} m'
            },
            series: initcallback()
        });
    };

    this.createBasicColumnChart = function (chart, titletext, initcallback, loadcallback) {
        return new Highcharts.Chart({
            chart: {
                renderTo: chart,
                zoomType: 'x',
                type: 'column',
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
            yAxis: {title: {text: titletext}},
            legend: {enabled: true},
            tooltip: {
                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                    '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
                footerFormat: '</table>',
                shared: true,
                useHTML: true
            },
            plotOptions: {
                column: {pointPadding: 0.2, borderWidth: 0}
            },
            series: initcallback()
        });
    };

    this.createBasicAreaChart = function (chart, titletext, initcallback, loadcallback) {
        return new Highcharts.Chart({
            chart: {
                renderTo: chart,
                zoomType: 'x',
                type: 'area',
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
            yAxis: {title: {text: titletext}},
            legend: {enabled: true},
            tooltip: {
                pointFormat: '{series.name} produced <b>{point.y:,.0f}</b><br/>warheads in {point.x}'
            },
            plotOptions: {
                area: {
                    marker: {
                        enabled: false,
                        symbol: 'circle',
                        radius: 2,
                        states: {
                            hover: {enabled: true}
                        }
                    }
                }
            },
            series: initcallback()
        });
    };

    this.createScatteredChart = function (chart, titletext, initcallback, loadcallback) {
        return new Highcharts.Chart({
            chart: {
                renderTo: chart,
                zoomType: 'xy',
                type: 'scatter',
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
            yAxis: {title: {text: titletext}},
            legend: {enabled: true},
            plotOptions: {
                scatter: {
                    marker: {
                        radius: 5,
                        states: {
                            hover: {enabled: true, lineColor: 'rgb(100,100,100)'}
                        }
                    },
                    states: {
                        hover: {
                            marker: {enabled: false}
                        }
                    },
                    tooltip: {
                        headerFormat: '<b>{series.name}</b><br>',
                        pointFormat: '{point.x}, {point.y}'
                    }
                }
            },
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

    query.reset = function () {
        query.date = new Date();
        query.time = new Date();
        query.timeslot = {};
        query.testbed = {};
        query.node = {};
        query.iface = {};
        query.experiment = {};
        query.resolution = {};
    };

    query.getUTCtime = function (date, time) {
        var d = new Date(date.getFullYear(), date.getMonth(), date.getDate(),
                         time.getHours(), time.getMinutes(), time.getSeconds());
        return d.getTime();
    };

    return query;
});
