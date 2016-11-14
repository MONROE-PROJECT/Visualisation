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
/*global angular, console, alert, WE, document, google, Highcharts */
/*jslint node: true */
'use strict';

var mvisControllers = angular.module('mvisControllers', ['ui.router', 'ngStorage', 'mvisServices']);

mvisControllers.controller('StartController', ['$scope', '$state', 'mvisService', function ($scope, $state, mvisService) {
    $scope.goToScheduler = function () {
        $state.go('error', {error: "Not implemented!"});
    };
    $scope.goToVisualisation = function () {
        mvisService.ping()
            .success(function () {
                $state.go('testbed.map');
            })
            .error(function () {
                $state.go('error', {error: "Unable to contact the server!"});
            });
    };
    console.log("StartController has been loaded correctly.");
}]);

mvisControllers.controller('mainMgmtController', ['$scope', '$state', '$filter', 'ngTableParams', 'mvisService', function ($scope, $state, $filter, NgTableParams, mvisService) {
    $scope.nodeslength = 0;

    mvisService.getAllNodes()
        .success(function (data) {
            $scope.nodeslength = data.length;
            $scope.nodes = [];
            angular.forEach(data, function (node) {
                console.log("Node info: ", node);
                var ret = {
                    country: node.country,
                    site: node.site,
                    id: mvisService.composeNodeName(node.nodeid, node.displayname, node.hostname),
                    interfaces: node.interfaces,
                    nodeid: node.nodeid
                };
                if (node.ifdetails) {
                    ret.device0 = mvisService.composeModemName(node.ifdetails.device0Operator, node.ifdetails.device0ICCID);
                    ret.device1 = mvisService.composeModemName(node.ifdetails.device1Operator, node.ifdetails.device1ICCID);
                    ret.device2 = mvisService.composeModemName(node.ifdetails.device2Operator, node.ifdetails.device2ICCID);
                    ret.device3 = mvisService.composeModemName(node.ifdetails.device3Operator, node.ifdetails.device3ICCID);
                }
                this.push(ret);
            }, $scope.nodes);

            $scope.nodesTable = new NgTableParams({
                count: 10
            }, {
                counts: [],
                total: $scope.nodes.length,
                getData: function ($defer, params) {
                    $scope.nodesData = params.sorting() ? $filter('orderBy')($scope.nodes, params.orderBy()) : $scope.nodes;
                    $scope.nodesData = params.filter() ? $filter('filter')($scope.nodesData, params.filter()) : $scope.nodes;
                    $scope.nodesData = $scope.nodesData.slice((params.page() - 1) * params.count(), params.page() * params.count());
                    $defer.resolve($scope.nodesData);
                }
            });
        })
        .error(function (error) {
            $state.go('error', {error: error});
        });

    $scope.details = [];
    $scope.nodeActivity = new NgTableParams({
        count: 5
    }, {
        counts: [],
        total: $scope.details.length,
        getData: function ($defer, params) {
            $scope.nodeDetails = $scope.details;
            $scope.nodeDetails = $scope.nodeDetails.slice((params.page() - 1) * params.count(), params.page() * params.count());
            $defer.resolve($scope.nodeDetails);
        }
    });

    var tmpret = {id: null, ping: null, modem: null, gps: null};

    $scope.getNodeDetails = function () {
        var i, interfaces,
            nodeid = parseInt($scope.selNodeId, 10);
        for (i = 0; i < $scope.nodes.length; i += 1) {
            if ($scope.nodes[i].nodeid === nodeid) {
                interfaces = $scope.nodes[i].interfaces;
            }
        }
        console.log("NodeId", nodeid, "Interfaces", interfaces);
        if (interfaces) {
            tmpret = {id: nodeid, ping: null, modem: null, gps: null};

            mvisService.getNodeLastActivityRTT(nodeid, interfaces)
                .success(function (data) {
                    console.log("LastActivityRTT", data);
                    tmpret.ping = (data.timestamp) ? new Date(parseInt(data.timestamp, 10) * 1000).toUTCString() : "0";
                    tmpret.ping += " (" + data.iccid + ")";

                    if (tmpret.modem && tmpret.gps) {
                        $scope.details.push(tmpret);
                        $scope.nodeActivity.total($scope.details.length);
                        $scope.nodeActivity.reload();
                    }
                })
                .error(function (error) {
                    $state.go('error', {error: error});
                });

            mvisService.getNodeLastActivityMODEM(nodeid, interfaces)
                .success(function (data) {
                    console.log("LastActivityModem", data);
                    tmpret.modem = (data.timestamp) ? new Date(parseInt(data.timestamp, 10) * 1000).toUTCString() : "0";
                    tmpret.modem += " (" + data.iccid + ")";

                    if (tmpret.ping && tmpret.gps) {
                        $scope.details.push(tmpret);
                        $scope.nodeActivity.total($scope.details.length);
                        $scope.nodeActivity.reload();
                    }
                })
                .error(function (error) {
                    $state.go('error', {error: error});
                });

            mvisService.getNodeLastActivityGPS(nodeid)
                .success(function (data) {
                    console.log("LastActivityGPS", data);
                    tmpret.gps = (data.timestamp) ? new Date(parseInt(data.timestamp, 10) * 1000).toUTCString() : "0";

                    if (tmpret.ping && tmpret.modem) {
                        $scope.details.push(tmpret);
                        $scope.nodeActivity.total($scope.details.length);
                        $scope.nodeActivity.reload();
                    }
                })
                .error(function (error) {
                    $state.go('error', {error: error});
                });
        } else {
            console.log("Interfaces not available for", nodeid);
        }
    };

    $scope.resynch = function () {
        var body = {
            username: $scope.username,
            password: $scope.password
        };
        mvisService.resynchoniseDb(body)
            .success(function () {
                alert("Resynchronisation success!");
                $state.reload();
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    };
}]);

mvisControllers.controller('testbedController', ['$state', 'mvisService', function ($state, mvisService) {
    var earth_opts = {zoom: 3.0,
                      center: [51.5073509, -0.12775829999998223], // London coordinates
                      atmosphere: true,
                      dragging: true,
                      tilting: true,
                      zooming: true,
                      sky: true},
        earth = WE.map('earth_div', earth_opts),
        natural_opts = {tileSize: 256, tms: true},
        natural = WE.tileLayer('http://data.webglearth.com/natural-earth-color/{z}/{x}/{y}.jpg', natural_opts).addTo(earth),
        toner_opts = {opacity: 0.6},
        toner = WE.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png', toner_opts).addTo(earth);

    mvisService.getStatesLocation()
        .success(function (data) {
            angular.forEach(data, function (state) {
                console.log("State location: ", state);

                var marker = WE.marker([state.latitude, state.longitude]).addTo(earth);
                marker.bindPopup("<b>" + state.name + "</b>", {closeButton: false});

                // disable double-clicking for the external users
                if (state.country && state.site) {
                    marker.on('dblclick', function () {
                        console.log("Double-Click event: country=" + state.country + ", site=" + state.site);
                        $state.go('testbed.state', {country: state.country, site: state.site});
                    });
                }
            });
        })
        .error(function (error) {
            $state.go('error', {error: error});
        });
}]);

mvisControllers.controller('stateRegionController', ['$scope', '$state', '$filter', 'ngTableParams', '$stateParams', 'mvisService', function ($scope, $state, $filter, NgTableParams, $stateParams, mvisService) {
    console.log("stateRegionController country=" + $stateParams.country + ", site=" + $stateParams.site);

    mvisService.getRegionDevices($stateParams.country, $stateParams.site)
        .success(function (data) {
            console.log("stateRegionController centre latitude=" + data.centre_latitude + ", longitude=" + data.centre_longitude);

            var gmap = new google.maps.Map(document.getElementById('region_div'), {
                zoom: 8,
                mapTypeId: 'satellite',
                center: {lat: data.centre_latitude, lng: data.centre_longitude}
            }), bounds = new google.maps.LatLngBounds();

            $scope.nodes = [];
            angular.forEach(data.data, function (node) {
                console.log("Node info: ", node);
                var nodeid = mvisService.composeNodeName(node.nodeid, node.displayname, node.hostname),
                    position = new google.maps.LatLng(node.latitude, node.longitude),
                    marker = new google.maps.Marker({
                        position: position,
                        map: gmap,
                        title: nodeid,
                        /* icon: {url: 'img/case1d2-U-RED-s.jpg', scaledSize: new google.maps.Size(30, 30)},*/
                        draggable: true,
                        animation: google.maps.Animation.DROP
                    });

                this.push({
                    id: nodeid,
                    latitude: node.latitude,
                    longitude: node.longitude,
                    address: node.address,
                    model: node.model,
                    status: node.status,
                    interfaces: node.interfaces,
                    ref: "#/testbed/periodic?country=" + $stateParams.country + "&site=" + $stateParams.site + "&nodeid=" + nodeid + "&timeout=60000"
                });

                google.maps.event.addListener(marker, 'click', function () {
                    console.log("Click event: ", marker.getTitle());
                    $state.go('testbed.periodic', {
                        country: $stateParams.country,
                        site: $stateParams.site,
                        nodeid: marker.getTitle(),
                        timeout: 60000
                    });
                });

                bounds.extend(position);
            }, $scope.nodes);

            gmap.fitBounds(bounds);
            gmap.panToBounds(bounds);

            $scope.nodesTable = new NgTableParams({
                count: 5
            }, {
                counts: [],
                total: $scope.nodes.length,
                getData: function ($defer, params) {
                    $scope.nodesData = params.sorting() ? $filter('orderBy')($scope.nodes, params.orderBy()) : $scope.nodes;
                    $scope.nodesData = params.filter() ? $filter('filter')($scope.nodesData, params.filter()) : $scope.nodes;
                    $scope.nodesData = $scope.nodesData.slice((params.page() - 1) * params.count(), params.page() * params.count());
                    $defer.resolve($scope.nodesData);
                }
            });
        })
        .error(function (error) {
            $state.go('error', {error: error});
        });
}]);

mvisControllers.controller('periodicInfoController', ['$scope', '$stateParams', '$state', '$interval', 'ngTableParams', 'mvisService', function ($scope, $stateParams, $state, $interval, NgTableParams, mvisService) {
    console.log("periodicInfoController", $stateParams);

    $scope.uid = $stateParams.nodeid;
    $scope.timers = [];

    var nodeid = mvisService.decomposeNodeId($stateParams.nodeid);

    function createTracker(info, inivalues) {
        var center = (info.current.lat && info.current.lng) ? {lat: info.current.lat, lng: info.current.lng} : {lat: info.centre.lat, lng: info.centre.lng},
            gmap = new google.maps.Map(document.getElementById('map'), {
                zoom: 10,
                center: center
            }),
            polyline = new google.maps.Polyline({
                path: inivalues,
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 2
            }),
            marker = new google.maps.Marker({
                position: new google.maps.LatLng(info.current.lat, info.current.lng),
                title: "Lat: " + info.current.lat + ", Lng: " + info.current.lng,
                map: gmap
            });
        polyline.setMap(gmap);
        return {gmap: gmap, polyline: polyline, marker: marker};
    }

    function periodicGPSUpdateBuffer(c, s, nid, t, points, fn, buffer) {
        var timestamp = t, mintimestamp,
            timer = $interval(function () {
                mintimestamp = timestamp;
                timestamp = new Date().getTime();

                fn(c, s, nid, timestamp, mintimestamp, points)
                    .success(function (info) {
                        console.log("DATA: ", info.data);
                        buffer.push.apply(buffer, info.data);
                    })
                    .error(function (error) {
                        $state.go('error', {error: error});
                    });
            }, (points * 1000));
        $scope.timers.push(timer);
    }

    function periodicGPSDrawBuffer(track, timeout, buffer, type) {
        var value,
            timer = $interval(function () {
                value = buffer.shift();
                console.log(type, "buffered value:", value);
                if (value) {
                    track.marker.setPosition(new google.maps.LatLng(value.lat, value.lng));
                    track.marker.setTitle("Lat: " + value.lat + ", Lng: " + value.lng);
                    track.polyline.getPath().push(new google.maps.LatLng(value.lat, value.lng));
                }
            }, (timeout * 1000));
        $scope.timers.push(timer);
    }

    function gpsPeriodicLoadData(country, site, nodeid) {
        var tracker, slicedata,
            timestamp = new Date().getTime(),
            mintimestamp = mvisService.getMinTimestamp(timestamp, "1 hour before"),
            gpsBuffer = [];

        mvisService.getGps(country, site, nodeid, timestamp, mintimestamp, 118)
            .success(function (info) {
                console.log("GPS: ", info);
                slicedata = info.data.slice(0, parseInt(info.data.length / 2, 10));
                tracker = createTracker(info, slicedata);

                slicedata = info.data.slice(parseInt(info.data.length / 2, 10), info.data.length);
                gpsBuffer.push.apply(gpsBuffer, slicedata);

                periodicGPSUpdateBuffer(country, site, nodeid, timestamp, 59, mvisService.getGps, gpsBuffer);
                periodicGPSDrawBuffer(tracker, 1, gpsBuffer, "GPS");
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    }

    function periodicEventUpdate(values, data) {
        console.log("Events", values);

        data.slice(0);
        angular.forEach(values, function (e) {
            this.push({
                timestamp: (new Date(Math.floor(e.timestamp * 1000))).toString(),
                message: e.message,
                eventtype: e.eventtype
            });
        }, data);
    }

    function eventPeriodicLoadData(nodeid) {
        $scope.nodeEventData = [];
        $scope.nodeEventTable = new NgTableParams({
            count: 5
        }, {
            counts: [],
            total: $scope.nodeEventData.length,
            getData: function ($defer, params) {
                $scope.nodeEventData = $scope.nodeEventData.slice((params.page() - 1) * params.count(), params.page() * params.count());
                $defer.resolve($scope.nodeEventData);
            }
        });

        var timestamp =  new Date().getTime(),
            mintimestamp = mvisService.getMinTimestamp(timestamp, "1 hour before");

        mvisService.getEvents(nodeid, timestamp, mintimestamp, 5)
            .success(function (info) {
                periodicEventUpdate(info, $scope.nodeEventData);

                var timer = $interval(function () {
                    mintimestamp = timestamp;
                    timestamp =  new Date().getTime();

                    mvisService.getEvents(nodeid, timestamp, mintimestamp, 5)
                        .success(function (info) {
                            periodicEventUpdate(info, $scope.nodeEventData);
                        })
                        .error(function (error) {
                            $state.go('error', {error: error});
                        });

                }, (60 * 1000));
                $scope.timers.push(timer);
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    }

    gpsPeriodicLoadData($stateParams.country, $stateParams.site, nodeid);
    eventPeriodicLoadData(nodeid);

    // stop timers when the controller is destroyed
    $scope.$on("$destroy", function () {
        var i, len;
        for (i = 0, len = $scope.timers.length; i < len; i += 1) {
            if (angular.isDefined($scope.timers[i])) {
                $interval.cancel($scope.timers[i]);
            }
        }
    });

    $scope.nodeData = [];
    $scope.nodeTable = new NgTableParams({
        count: 5
    }, {
        counts: [],
        total: $scope.nodeData.length,
        getData: function ($defer, params) {
            $scope.nodeData = $scope.nodeData.slice((params.page() - 1) * params.count(), params.page() * params.count());
            $defer.resolve($scope.nodeData);
        }
    });

    mvisService.getIfDetails($stateParams.country, $stateParams.site, nodeid)
        .success(function (info) {
            console.log("IfDetails: ", info);
            if (info.length !== 1) {
                $state.go('error', {error: 'Unable to retrieve the Node-Interface details!'});
            }
            var tmp = {
                id: nodeid,
                device0: mvisService.composeModemName(info[0].ifdetails.device0Operator, info[0].ifdetails.device0ICCID),
                device1: mvisService.composeModemName(info[0].ifdetails.device1Operator, info[0].ifdetails.device1ICCID),
                device2: mvisService.composeModemName(info[0].ifdetails.device2Operator, info[0].ifdetails.device2ICCID),
                device3: mvisService.composeModemName(info[0].ifdetails.device3Operator, info[0].ifdetails.device3ICCID)
            };
            $scope.nodeData.push(tmp);
        })
        .error(function (error) {
            $state.go('error', {error: error});
        });
}]);

mvisControllers.controller('periodicChartsController', ['$scope', '$stateParams', '$state', '$interval', 'mvisService', function ($scope, $stateParams, $state, $interval, mvisService) {
    console.log("periodicChartsController", $stateParams);

    $scope.uid = $stateParams.nodeid;
    $scope.timers = [];

    // this is the (real) management task
    var rttchart, signalstrengthchart, cpuchart, httpspeedchart,
        nodeid = mvisService.decomposeNodeId($stateParams.nodeid);

    function periodicUpdateBuffer(nid, iid, t, points, fn, buffer) {
        var timestamp = t, mintimestamp,
            timer = $interval(function () {
                mintimestamp = timestamp;
                timestamp = new Date().getTime();

                fn(nid, iid, timestamp, mintimestamp, points)
                    .success(function (data) {
                        console.log("DATA: ", data);
                        buffer.push.apply(buffer, data);
                    })
                    .error(function (error) {
                        $state.go('error', {error: error});
                    });
            }, (points * 1000));
        $scope.timers.push(timer);
    }

    function periodicCPUupdateBuffer(nid, t, points, fn, buffer) {
        var timestamp = t, mintimestamp,
            timer = $interval(function () {
                mintimestamp = timestamp;
                timestamp = new Date().getTime();

                fn(nid, timestamp, mintimestamp, points)
                    .success(function (data) {
                        console.log("DATA: ", data);
                        buffer.push.apply(buffer, data);
                    })
                    .error(function (error) {
                        $state.go('error', {error: error});
                    });
            }, (points * 1000));
        $scope.timers.push(timer);
    }

    function periodicDrawBuffer(data, timeout, buffer, type) {
        var value,
            timer = $interval(function () {
                value = buffer.shift();
                console.log(type, "buffered value:", value);
                if (value) {
                    data.addPoint(value, true, true);
                }
            }, (timeout * 1000));
        $scope.timers.push(timer);
    }

    function rttPeriodicLoadData(nodeid, ifaceid, series, buffer) {
        console.log("rttLoadData series", ifaceid);
        var i, len, timer, slicedata,
            timestamp = new Date().getTime(),
            mintimestamp = mvisService.getMinTimestamp(timestamp, "1 hour before");

        mvisService.getRTT(nodeid, ifaceid, timestamp, mintimestamp, 118)
            .success(function (data) {
                console.log("RTT(", data.length, "): ", data);
                slicedata = data.slice(0, parseInt(data.length / 2, 10));
                series.setData(slicedata, true, true);

                slicedata = data.slice(parseInt(data.length / 2, 10), data.length);
                buffer.push.apply(buffer, slicedata);

                periodicUpdateBuffer(nodeid, ifaceid, timestamp, 59, mvisService.getRTT, buffer);
                periodicDrawBuffer(series, 1, buffer, "RTT");
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    }

    function signalstrengthPeriodicLoadData(nodeid, ifaceid, series, buffer) {
        console.log("signalstrengthPeriodicLoadData series", ifaceid);
        var slicedata,
            timestamp = new Date().getTime(),
            mintimestamp = mvisService.getMinTimestamp(timestamp, "1 hour before");

        mvisService.getSignalStrength(nodeid, ifaceid, timestamp, mintimestamp, 118)
            .success(function (data) {
                console.log("SIGNALSTRENGTH(", data.length, "): ", data);
                slicedata = data.slice(0, parseInt(data.length / 2, 10));
                series.setData(slicedata, true, true);

                slicedata = data.slice(parseInt(data.length / 2, 10), data.length);
                buffer.push.apply(buffer, slicedata);

                periodicUpdateBuffer(nodeid, ifaceid, timestamp, 59, mvisService.getSignalStrength, buffer);
                periodicDrawBuffer(series, 1, buffer, "SignalStrength");
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    }

    function httpSpeedPeriodicLoadData(nodeid, ifaceid, series, buffer) {
        console.log("httpSpeedPeriodicLoadData series", ifaceid);
        var slicedata,
            timestamp = new Date().getTime(),
            mintimestamp = mvisService.getMinTimestamp(timestamp, "1 hour before");

        mvisService.getHttpSpeed(nodeid, ifaceid, timestamp, mintimestamp, 118)
            .success(function (data) {
                console.log("HTTPSPEED(", data.length, "): ", data);
                slicedata = data.slice(0, parseInt(data.length / 2, 10));
                series.setData(slicedata, true, true);

                slicedata = data.slice(parseInt(data.length / 2, 10), data.length);
                buffer.push.apply(buffer, slicedata);

                periodicUpdateBuffer(nodeid, ifaceid, timestamp, 59, mvisService.getHttpSpeed, buffer);
                periodicDrawBuffer(series, 1, buffer, "HttpSpeed");
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    }

    function cpuPeriodicLoadData(nodeid, name, series, buffer) {
        console.log("cpuPeriodicLoadData series", name);
        var slicedata,
            timestamp = new Date().getTime(),
            mintimestamp = mvisService.getMinTimestamp(timestamp, "1 hour before");

        mvisService.getCPU(nodeid, timestamp, mintimestamp, 118)
            .success(function (data) {
                console.log("CPU(", data.length, "): ", data);
                slicedata = data.slice(0, parseInt(data.length / 2, 10));
                series.setData(slicedata, true, true);

                slicedata = data.slice(parseInt(data.length / 2, 10), data.length);
                buffer.push.apply(buffer, slicedata);

                periodicCPUupdateBuffer(nodeid, timestamp, 59, mvisService.getCPU, buffer);
                periodicDrawBuffer(series, 1, buffer, "CPU");
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    }

    function getPeriodicAllRTT(nodeid, ifaces) {
        console.log("getPeriodicAllRTT nodeid", nodeid, ", ifaces", ifaces);
        rttchart = mvisService.createRTTStockChart(function () {
            var i, ret = [];
            angular.forEach(ifaces, function (ifs) {
                for (i = 0; i < ifs.interfaces.length; i += 1) {
                    ret.push({
                        type: "line",
                        name: ifs.interfaces[i],
                        data: []
                    });
                }
            });
            return ret;
        }, function (series, buffer) {
            rttPeriodicLoadData(nodeid, series.name, series, buffer);
        });
    }

    function getPeriodicAllSignalStrength(nodeid, ifaces) {
        console.log("getPeriodicAllSignalStrength nodeid", nodeid, ", ifaces", ifaces);
        signalstrengthchart = mvisService.createSignalStrenghtStockChart(function () {
            var i, ret = [];
            angular.forEach(ifaces, function (ifs) {
                for (i = 0; i < ifs.interfaces.length; i += 1) {
                    ret.push({
                        type: "column",
                        name: ifs.interfaces[i],
                        data: []
                    });
                }
            });
            return ret;
        }, function (series, buffer) {
            signalstrengthPeriodicLoadData(nodeid, series.name, series, buffer);
        });
    }

    function getPeriodicAllCpu(nodeid) {
        console.log("getPeriodicAllCpu nodeid", nodeid);
        cpuchart = mvisService.createCPUStockChart(function () {
            var ret = [{
                name: "cpu",
                data: []
            }];
            return ret;
        }, function (series, buffer) {
            cpuPeriodicLoadData(nodeid, series.name, series, buffer);
        });
    }

    function getPeriodicAllHttpSpeed(nodeid, ifaces) {
        console.log("getPeriodicAllHttpSpeed nodeid", nodeid, ", ifaces", ifaces);
        httpspeedchart = mvisService.createHttpSpeedStockChart(function () {
            var i, ret = [];
            angular.forEach(ifaces, function (ifs) {
                for (i = 0; i < ifs.interfaces.length; i += 1) {
                    ret.push({
                        type: "scatter",
                        name: ifs.interfaces[i],
                        data: []
                    });
                }
            });
            return ret;
        }, function (series, buffer) {
            httpSpeedPeriodicLoadData(nodeid, series.name, series, buffer);
        });
    }

    // this is the (real) management task
    mvisService.getInterfaces($stateParams.country, $stateParams.site, nodeid)
        .success(function (ifaces) {
            console.log("Interfaces", ifaces);

            getPeriodicAllRTT(nodeid, ifaces);
            getPeriodicAllSignalStrength(nodeid, ifaces);
            //getPeriodicAllHttpSpeed(nodeid, ifaces);
            //getPeriodicAllCpu(nodeid);
        })
        .error(function (error) {
            $state.go('error', {error: error});
        });

    // stop timers when the controller is destroyed
    $scope.$on("$destroy", function () {
        var i, len;
        for (i = 0, len = $scope.timers.length; i < len; i += 1) {
            if (angular.isDefined($scope.timers[i])) {
                $interval.cancel($scope.timers[i]);
            }
        }
    });
}]);

mvisControllers.controller('experimentInfoController', ['$scope', '$state', 'mvisService', 'mvisQueryService', function ($scope, $state, mvisService, mvisQueryService) {
    $scope.date = new Date();
    $scope.time = new Date();
    $scope.disabledT = false;
    $scope.format = 'dd-MMMM-yyyy';
    $scope.node = {};
    $scope.iface = {};
    $scope.selectedtuple = "";

    $scope.timeslot = {};
    $scope.timeslots = [{id: "1 hour in the past"}, {id: "6 hours in the past"}, {id: "24 hours in the past"}, {id: "48 hours in the past"}];

    $scope.resolution = {};
    $scope.resolutions = [{id: 100}, {id: 500}, {id: 1000}, {id: 2000}, {id: 3000}, {id: 4000}, {id: 5000}];

    $scope.testbed = {};
    $scope.testbeds = [{id: "it - pisa"}, {id: "it - torino"}, {id: "es - spain"}, {id: "no - norway"}, {id: "se - sweden"}];

    $scope.openDate = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        $scope.openedD = true;
    };

    $scope.testbedSelected = function ($model) {
        console.log("Selected testbed", $model.id);
        var x = $model.id.replace(" - ", "-").split("-");
        mvisService.getNodesName(x[0], x[1])
            .success(function (data) {
                console.log("Nodes info", data);

                $scope.nodes = [];
                angular.forEach(data, function (node) {
                    $scope.nodes.push({
                        country: x[0],
                        site: x[1],
                        id: mvisService.composeNodeName(node.nodeid, node.displayname, node.hostname)
                    });
                });
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    };

    $scope.nodeSelected = function ($model) {
        console.log("Selected node", $model);
        var nodeIDs = $model.id.replace(" - ", "-").split("-");

        mvisService.getInterfaces($model.country, $model.site, nodeIDs[0])
            .success(function (data) {
                console.log("Interfaces info", data);

                $scope.ifaces = [];
                var i;
                angular.forEach(data, function (intfs) {
                    for (i = 0; i < intfs.interfaces.length; i += 1) {
                        $scope.ifaces.push({id: intfs.interfaces[i]});
                    }
                });
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    };

    $scope.interfaceSelected = function ($model) {
        var nodeIDs = $scope.node.selected.id.replace(" - ", "-").split("-");
        $scope.selectedtuple += "(" + nodeIDs[0] + " - " + $model.id + ")";
    };

    $scope.submit = function () {
        if (!$scope.timeslot.hasOwnProperty('selected')) {
            alert("Please specify the timeslot!");

        } else if (!$scope.resolution.hasOwnProperty('selected')) {
            alert("Please specify the resolution!");

        } else if ($scope.selectedtuple === "") {
            alert("Please select node and interface!");

        } else {
            var nodeIDs = $scope.node.selected.id.replace(" - ", "-").split("-");
            mvisQueryService.save($scope.date, $scope.time, $scope.timeslot.selected.id, '', $scope.selectedtuple, '', '', $scope.resolution.selected.id);
        }
    };

    $scope.$on("$destroy", function () {
        mvisQueryService.reset();
    });
}]);

mvisControllers.controller('experimentBasicController', ['$scope', '$state', 'mvisService', 'mvisQueryService', function ($scope, $state, mvisService, mvisQueryService) {
    console.log("experimentBasicController");

    var rttchart, packetlosschart, signalstrengthchart, connectiontypechart, httpdownloadchart;

    function rttLoadData(nodeid, ifaceid, timestamp, mintimestamp, resolution, series) {
        console.log("rttLoadData series", nodeid, ifaceid);
        mvisService.getRTT(nodeid, ifaceid, timestamp, mintimestamp, resolution)
            .success(function (data) {
                console.log("RTT: ", data);
                series.setData(data, true, true);
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    }
    function packetlossLoadData(nodeid, ifaceid, timestamp, mintimestamp, resolution, series) {
        console.log("packetlossLoadData series", nodeid, ifaceid);
        mvisService.getPacketLoss(nodeid, ifaceid, timestamp, mintimestamp, resolution)
            .success(function (data) {
                console.log("PacketLoss: ", data);
                var i, num, tmp = {loss: 0, tot: 0, last: 0};
                for (i = 0; i < data.length; i += 1) {
                    tmp.tot += 1;
                    if (tmp.tot !== 1) {
                        num = parseInt(data[i], 10) - tmp.last;
                        if (num !== 1) {
                            tmp.loss += 1;
                        }
                    }
                    tmp.last = parseInt(data[i], 10);
                }
                console.log("PacketLoss calculation", tmp);
                num = (tmp.tot === 0) ? 0 : Math.round((tmp.loss * 100) / tmp.tot);
                series.setData([num], true, true);
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    }
    function signalStrengthLoadData(nodeid, ifaceid, timestamp, mintimestamp, resolution, series) {
        console.log("signalStrengthLoadData series", nodeid, ifaceid);
        mvisService.getSignalStrength(nodeid, ifaceid, timestamp, mintimestamp, resolution)
            .success(function (data) {
                console.log("SignalStrength: ", data);
                series.setData(data, true, true);
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    }
    function connectionTypeLoadData(nodeid, ifaceid, timestamp, mintimestamp, resolution, series) {
        console.log("connectionTypeLoadData series", nodeid, ifaceid);
        mvisService.getConnectionType(nodeid, ifaceid, timestamp, mintimestamp, resolution)
            .success(function (data) {
                console.log("ConnectionType: ", data);
                series.setData(data, true, true);
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    }
    function httpDownloadLoadData(nodeid, ifaceid, timestamp, mintimestamp, resolution, series) {
        console.log("httpDownloadLoadData series", nodeid, ifaceid);
        mvisService.getHttpSpeed(nodeid, ifaceid, timestamp, mintimestamp, resolution)
            .success(function (data) {
                console.log("HttpSpeed: ", data);
                series.setData(data, true, true);
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    }
    function getRTT(nodeiface, timestamp, mintimestamp, resolution) {
        console.log("getRTT nodeiface", nodeiface, ", timestamp", timestamp,
                    ", mintimestamp", mintimestamp, ", resolution", resolution);
        rttchart = mvisService.createRTTChart(function () {
            var i, ret = [];
            angular.forEach(nodeiface, function (nif) {
                if (nif !== "") {
                    ret.push({
                        type: "line",
                        name: nif,
                        data: []
                    });
                }
            });
            return ret;
        }, function (series) {
            var nodeIDs = series.name.replace(" - ", "-").split("-");
            rttLoadData(nodeIDs[0], nodeIDs[1], timestamp, mintimestamp, resolution, series);
        });
    }
    function getPacketLoss(nodeiface, timestamp, mintimestamp, resolution) {
        console.log("getPacketLoss nodeiface", nodeiface, ", timestamp", timestamp,
                    ", mintimestamp", mintimestamp, ", resolution", resolution);
        packetlosschart = mvisService.createPacketLossChart(function () {
            var i, ret = [];
            angular.forEach(nodeiface, function (nif) {
                if (nif !== "") {
                    ret.push({
                        name: nif,
                        data: []
                    });
                }
            });
            return ret;
        }, function (series) {
            var nodeIDs = series.name.replace(" - ", "-").split("-");
            packetlossLoadData(nodeIDs[0], nodeIDs[1], timestamp, mintimestamp, resolution, series);
        });
    }
    function getSignalStrength(nodeiface, timestamp, mintimestamp, resolution) {
        console.log("getSignalStrength nodeiface", nodeiface, ", timestamp", timestamp,
                    ", mintimestamp", mintimestamp, ", resolution", resolution);
        signalstrengthchart = mvisService.createSignalStrenghtChart(function () {
            var i, ret = [];
            angular.forEach(nodeiface, function (nif) {
                if (nif !== "") {
                    ret.push({
                        type: "column",
                        name: nif,
                        data: []
                    });
                }
            });
            return ret;
        }, function (series) {
            var nodeIDs = series.name.replace(" - ", "-").split("-");
            signalStrengthLoadData(nodeIDs[0], nodeIDs[1], timestamp, mintimestamp, resolution, series);
        });
    }
    function getConnectionType(nodeiface, timestamp, mintimestamp, resolution) {
        console.log("getConnectionType nodeiface", nodeiface, ", timestamp", timestamp,
                    ", mintimestamp", mintimestamp, ", resolution", resolution);
        connectiontypechart = mvisService.createConnectionTypeChart(function () {
            var i, ret = [], x = Math.round(100 / (nodeiface.length - 1));
            for (i = 0; i < nodeiface.length; i += 1) {
                if (nodeiface[i] !== "") {
                    ret.push({
                        name: nodeiface[i],
                        colorByPoint: true,
                        center: [Math.round((x / 2) + (i * x)) + "%", "50%"],
                        size: '75%',
                        data: []
                    });
                }
            }
            return ret;
        }, function (series) {
            var nodeIDs = series.name.replace(" - ", "-").split("-");
            connectionTypeLoadData(nodeIDs[0], nodeIDs[1], timestamp, mintimestamp, resolution, series);
        });
    }
    function getHTTPDownload(nodeiface, timestamp, mintimestamp, resolution) {
        console.log("getHTTPDownload nodeiface", nodeiface, ", timestamp", timestamp,
                    ", mintimestamp", mintimestamp, ", resolution", resolution);
        httpdownloadchart = mvisService.createHTTPDownloadChart(function () {
            var i, ret = [];
            angular.forEach(nodeiface, function (nif) {
                if (nif !== "") {
                    ret.push({
                        type: "scatter",
                        name: nif,
                        data: []
                    });
                }
            });
            return ret;
        }, function (series) {
            var nodeIDs = series.name.replace(" - ", "-").split("-");
            httpDownloadLoadData(nodeIDs[0], nodeIDs[1], timestamp, mintimestamp, resolution, series);
        });
    }

    $scope.submit = function () {
        try {
            console.info("QueryInfo", mvisQueryService);

            var date_time = mvisQueryService.getUTCtime(mvisQueryService.date, mvisQueryService.time),
                min_timestamp = mvisService.getMinTimestamp(date_time, mvisQueryService.timeslot),
                selnodes = mvisQueryService.node.split("(").join("").split(")");
            console.log("date-time", date_time, ", UTC time", new Date(date_time).toUTCString(),
                        ", min-timestamp", min_timestamp, ", UTC min time", new Date(min_timestamp).toUTCString());

            console.log("SelNodes", selnodes);
            getRTT(selnodes, date_time, min_timestamp, mvisQueryService.resolution);
            getPacketLoss(selnodes, date_time, min_timestamp, mvisQueryService.resolution);
            getSignalStrength(selnodes, date_time, min_timestamp, mvisQueryService.resolution);
            getConnectionType(selnodes, date_time, min_timestamp, mvisQueryService.resolution);
            getHTTPDownload(selnodes, date_time, min_timestamp, mvisQueryService.resolution);

        } catch (err) {
            alert("Invalid filters!\n" + err.message);
        }
    };
}]);
