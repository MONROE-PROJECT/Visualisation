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

mvisControllers.controller('NavBarController', ['$scope', function ($scope) {
    $scope.logged = false;
    $scope.navbarLinks = [];
    $scope.settingsLinks = [];
}]);

mvisControllers.controller('LoginController', ['$scope', '$state', 'mvisService', function ($scope, $state, mvisService) {
    $scope.authenticate = function () {
        $scope.error = null;

        mvisService.authenticate($scope.loginName, $scope.loginPass)
            .success(function () {
                $state.go('testbed.map');
            })
            .error(function () {
                $scope.error = ["500", "unable to authenticate the user!"];
            });
    };
}]);

mvisControllers.controller('StartController', ['$scope', '$state', 'mvisService', function ($scope, $state, mvisService) {
    mvisService.ping()
        .success(function () {
            $state.go('testbed.map');
        })
        .error(function () {
            $scope.initError = true;
        });
}]);

mvisControllers.controller('queryController', ['$scope', '$state', 'mvisService', 'mvisQueryService', function ($scope, $state, mvisService, mvisQueryService) {
    $scope.date = mvisQueryService.date;
    $scope.time = mvisQueryService.time;
    $scope.disabledT = false;
    $scope.format = 'dd-MMMM-yyyy';
    $scope.timeslot = mvisQueryService.timeslot;
    $scope.testbed =  mvisQueryService.testbed;
    $scope.node = mvisQueryService.node;
    $scope.iface = mvisQueryService.iface;
    $scope.experiment = mvisQueryService.experiment;
    $scope.resolution = mvisQueryService.resolution;

    mvisService.getQueryInfo()
        .success(function (data) {
            $scope.timeslots = data.timeslots;
            $scope.testbeds = data.testbeds;
            $scope.experiments = data.experiments;
            $scope.resolutions = data.resolutions;
        })
        .error(function (error) {
            $state.go('error', {error: error});
        });

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
                        id: mvisService.composeNodeName(node.nodeid, node.displayname, node.hostname)
                    });
                });
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    };

    $scope.nodeSelected = function ($model) {
        console.log("Selected node", $model.id);
        var i, t = $scope.testbed.selected.id.replace(" - ", "-").split("-"),
            x = $model.id.replace(" - ", "-").split("-");

        mvisService.getInterfaces(t[0], t[1], x[0])
            .success(function (data) {
                console.log("Interfaces info", data);

                $scope.ifaces = [];
                angular.forEach(data, function (intfs) {
                    for (i = 0; i < intfs.interfaces.length; i += 1) {
                        $scope.ifaces.push({id: intfs.interfaces[i]});
                    }
                });
                if ($scope.ifaces.length > 0) {
                    $scope.ifaces.push({id: "ALL"});
                }
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    };

    $scope.submit = function () {
        if (!$scope.timeslot.hasOwnProperty('selected')) {
            alert("Please sprcify the timeslot!");

        } else if (!$scope.node.hasOwnProperty('selected')) {
            alert("Please specify the node!");

        } else if (!$scope.iface.hasOwnProperty('selected')) {
            alert("Please specify the interface(s)!");

        } else if (!$scope.experiment.hasOwnProperty('selected')) {
            alert("Please specify the experiment!");

        } else if (!$scope.resolution.hasOwnProperty('selected')) {
            alert("Please specify the resolution!");

        } else {
            console.log("testbed", $scope.testbed.selected.id, ", node", $scope.node.selected.id,
                        ", interface", $scope.iface.selected.id, ", experiment", $scope.experiment.selected.id,
                        ", resolution", $scope.resolution.selected.id, ", timeslot", $scope.timeslot.selected.id);

            mvisQueryService.save($scope.date, $scope.time, $scope.timeslot, $scope.testbed, $scope.node, $scope.iface,
                                  $scope.experiment, $scope.resolution);

            var date_time = mvisQueryService.getUTCtime($scope.date, $scope.time),
                min_timestamp = mvisService.getMinTimestamp(date_time, $scope.timeslot.selected.id);
            console.log("date-time", date_time, ", UTC time", new Date(date_time).toUTCString(),
                        ", min-timestamp", min_timestamp, ", UTC min time", new Date(min_timestamp).toUTCString());

            $state.go('statistic.' + $scope.experiment.selected.id, {
                testbedid: $scope.testbed.selected.id,
                nodeid: $scope.node.selected.id,
                ifaceid: $scope.iface.selected.id,
                resolution: $scope.resolution.selected.id,
                timestamp: date_time,
                mintimestamp: min_timestamp
            });
        }
    };
}]);

mvisControllers.controller('testbedController', ['$state', 'mvisService', function ($state, mvisService) {
    var earth_opts = {zoom: 3.0,
                      center: [51.5073509, -0.12775829999998223], // London coordinates
                      atmosphere: true,
                      sky: true},
        earth = WE.map('earth_div', earth_opts),
        tile_opts = {subdomains: "1234"},
        tile = WE.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg', tile_opts);
    tile.addTo(earth);

    mvisService.getStatesLocation()
        .success(function (data) {
            angular.forEach(data, function (state) {
                console.log("State location: ", state);

                var marker = WE.marker([state.latitude, state.longitude]).addTo(earth);
                marker.bindPopup("<b>" + state.name + "</b>", {closeButton: false});

                marker.on('dblclick', function () {
                    console.log("Double-Click event: country=" + state.country + ", site=" + state.site);
                    $state.go('testbed.state', {country: state.country, site: state.site});
                });
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
                center: {lat: data.centre_latitude, lng: data.centre_longitude}
            });

            $scope.nodes = [];
            angular.forEach(data.data, function (node) {
                console.log("Node info: ", node);
                var nodeid = mvisService.composeNodeName(node.nodeid, node.displayname, node.hostname),
                    marker = new google.maps.Marker({
                        position: new google.maps.LatLng(node.latitude, node.longitude),
                        map: gmap,
                        title: nodeid,
                        icon: {
                            url: 'img/case1d2-U-RED-s.jpg',
                            scaledSize: new google.maps.Size(30, 30)
                        },
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
                    ref: "#/statistic/periodic?country=" + $stateParams.country + "&site=" + $stateParams.site + "&nodeid=" + nodeid + "&timeout=10000"
                });

                google.maps.event.addListener(marker, 'click', function () {
                    console.log("Click event: ", marker.getTitle());
                    $state.go('statistic.periodic', {
                        country: $stateParams.country,
                        site: $stateParams.site,
                        nodeid: marker.getTitle(),
                        timeout: 10000
                    });
                });
            }, $scope.nodes);

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

mvisControllers.controller('statPingController', ['$scope', '$stateParams', '$state', '$interval', 'mvisService', function ($scope, $stateParams, $state, $interval, mvisService) {
    console.log("statPingController testbedid=" + $stateParams.testbedid  + ", nodeid=" + $stateParams.nodeid + ", ifaceid=" + $stateParams.ifaceid +
                ", resolution=" + $stateParams.resolution + ", timestamp=" + $stateParams.timestamp + ", mintimestamp=" + $stateParams.mintimestamp);

    $scope.uid = $stateParams.nodeid;
    var rttchart, signalstrengthchart, packetlosschart, connectiontypechart,
        tbed = $stateParams.testbedid.replace(" - ", "-").split("-"),
        nodeid = mvisService.decomposeNodeId($stateParams.nodeid);

    function rttLoadData(nodeid, ifaceid, timestamp, mintimestamp, resolution, series) {
        console.log("rttLoadData series", ifaceid);
        mvisService.getRTT(nodeid, ifaceid, timestamp, mintimestamp, resolution)
            .success(function (data) {
                console.log("RTT: ", data);
                series.setData(data, true, true);
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    }

    function getRTT(nodeid, ifaceid, timestamp, mintimestamp, resolution) {
        console.log("getRTT nodeid", nodeid, ", ifaceid", ifaceid, ", timestamp", timestamp,
                    ", mintimestamp", mintimestamp, ", resolution", resolution);
        rttchart = mvisService.createRTTChart(function () {
            return [{
                type: "line",
                name: ifaceid,
                data: []
            }];
        }, function (series) {
            rttLoadData(nodeid, series.name, timestamp, mintimestamp, resolution, series);
        });
    }

    function getAllRTT(nodeid, ifaces, timestamp, mintimestamp, resolution) {
        console.log("getAllRTT nodeid", nodeid, ", ifaces", ifaces, ", timestamp", timestamp,
                    ", mintimestamp", mintimestamp, ", resolution", resolution);
        rttchart = mvisService.createRTTChart(function () {
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
        }, function (series) {
            rttLoadData(nodeid, series.name, timestamp, mintimestamp, resolution, series);
        });
    }

    function packetlossLoadData(nodeid, ifaceid, timestamp, mintimestamp, resolution, series) {
        console.log("packetlossLoadData series", ifaceid);
        mvisService.getPacketLoss(nodeid, ifaceid, timestamp, mintimestamp, resolution)
            .success(function (data) {
                console.log("PacketLoss: ", data);
                var i, num, tmp = {loss: 0, tot: 0, last: 0};
                for (i = 0; i < data.length; i += 1) {
                    tmp.tot += 1;
                    if (tmp.tot !== 1) {
                        num = parseInt(data[i], 10) - tmp.last;
                        if (num !== -1) {
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

    function getPacketLoss(nodeid, ifaceid, timestamp, mintimestamp, resolution) {
        console.log("getPacketLoss nodeid", nodeid, ", ifaceid", ifaceid, ", timestamp", timestamp,
                    ", mintimestamp", mintimestamp, ", resolution", resolution);
        packetlosschart = mvisService.createPacketLossChart(function () {
            return [{
                name: ifaceid,
                data: []
            }];
        }, function (series) {
            packetlossLoadData(nodeid, series.name, timestamp, mintimestamp, resolution, series);
        });
    }

    function getAllPacketLoss(nodeid, ifaces, timestamp, mintimestamp, resolution) {
        console.log("getAllPacketLoss nodeid", nodeid, ", ifaces", ifaces, ", timestamp", timestamp,
                    ", mintimestamp", mintimestamp, ", resolution", resolution);
        packetlosschart = mvisService.createPacketLossChart(function () {
            var i, ret = [];
            angular.forEach(ifaces, function (ifs) {
                for (i = 0; i < ifs.interfaces.length; i += 1) {
                    ret.push({
                        name: ifs.interfaces[i],
                        data: []
                    });
                }
            });
            return ret;
        }, function (series) {
            packetlossLoadData(nodeid, series.name, timestamp, mintimestamp, resolution, series);
        });
    }

    function signalStrengthLoadData(nodeid, ifaceid, timestamp, mintimestamp, resolution, series) {
        console.log("signalStrengthLoadData series", ifaceid);
        mvisService.getSignalStrength(nodeid, ifaceid, timestamp, mintimestamp, resolution)
            .success(function (data) {
                console.log("SignalStrength: ", data);
                series.setData(data, true, true);
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    }

    function getSignalStrength(nodeid, ifaceid, timestamp, mintimestamp, resolution) {
        console.log("getSignalStrength noded", nodeid, ", ifaceid", ifaceid, ", timestamp", timestamp,
                    ", mintimestamp", mintimestamp, ", resolution", resolution);
        signalstrengthchart = mvisService.createSignalStrenghtChart(function () {
            return [{
                type: "column",
                name: ifaceid,
                data: []
            }];
        }, function (series) {
            signalStrengthLoadData(nodeid, series.name, timestamp, mintimestamp, resolution, series);
        });
    }

    function getAllSignalStrength(nodeid, ifaces, timestamp, mintimestamp, resolution) {
        console.log("getAllSignalStrength noded", nodeid, ", ifaces", ifaces, ", timestamp", timestamp,
                    ", mintimestamp", mintimestamp, ", resolution", resolution);
        signalstrengthchart = mvisService.createSignalStrenghtChart(function () {
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
        }, function (series) {
            signalStrengthLoadData(nodeid, series.name, timestamp, mintimestamp, resolution, series);
        });
    }

    function connectionTypeLoadData(nodeid, ifaceid, timestamp, mintimestamp, resolution, series) {
        console.log("connectionTypeLoadData series", ifaceid);
        mvisService.getConnectionType(nodeid, ifaceid, timestamp, mintimestamp, resolution)
            .success(function (data) {
                console.log("ConnectionType: ", data);
                series.setData(data, true, true);
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });
    }

    function getConnectionType(nodeid, ifaceid, timestamp, mintimestamp, resolution) {
        console.log("getConnectionType noded", nodeid, ", ifaceid", ifaceid, ", timestamp", timestamp,
                    ", mintimestamp", mintimestamp, ", resolution", resolution);
        connectiontypechart = mvisService.createConnectionTypeChart(function () {
            return [{
                name: ifaceid,
                colorByPoint: true,
                data: []
            }];
        }, function (series) {
            connectionTypeLoadData(nodeid, series.name, timestamp, mintimestamp, resolution, series);
        });
    }

    function getAllConnectionType(nodeid, ifaces, timestamp, mintimestamp, resolution) {
        console.log("getAllConnectionType noded", nodeid, ", ifaces", ifaces, ", timestamp", timestamp,
                    ", mintimestamp", mintimestamp, ", resolution", resolution);
        connectiontypechart = mvisService.createConnectionTypeChart(function () {
            var i, x, ret = [];
            angular.forEach(ifaces, function (ifs) {
                for (i = 0; i < ifs.interfaces.length; i += 1) {
                    x = Math.round(100 / ifs.interfaces.length);
                    ret.push({
                        name: ifs.interfaces[i],
                        colorByPoint: true,
                        center: [Math.round((x / 2) + (i * x)) + "%", "50%"],
                        size: '75%',
                        data: []
                    });
                }
            });
            return ret;
        }, function (series) {
            connectionTypeLoadData(nodeid, series.name, timestamp, mintimestamp, resolution, series);
        });
    }

    // this is the (real) management task
    if ($stateParams.ifaceid === "ALL") {
        mvisService.getInterfaces(tbed[0], tbed[1], nodeid)
            .success(function (ifaces) {
                console.log("Interfaces", ifaces);

                getAllRTT(nodeid, ifaces, $stateParams.timestamp, $stateParams.mintimestamp, $stateParams.resolution);
                getAllPacketLoss(nodeid, ifaces, $stateParams.timestamp, $stateParams.mintimestamp, $stateParams.resolution);
                getAllSignalStrength(nodeid, ifaces, $stateParams.timestamp, $stateParams.mintimestamp, $stateParams.resolution);
                getAllConnectionType(nodeid, ifaces, $stateParams.timestamp, $stateParams.mintimestamp, $stateParams.resolution);
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });

    } else {
        getRTT(nodeid, $stateParams.ifaceid, $stateParams.timestamp, $stateParams.mintimestamp, $stateParams.resolution);
        getPacketLoss(nodeid, $stateParams.ifaceid, $stateParams.timestamp, $stateParams.mintimestamp, $stateParams.resolution);
        getSignalStrength(nodeid, $stateParams.ifaceid, $stateParams.timestamp, $stateParams.mintimestamp, $stateParams.resolution);
        getConnectionType(nodeid, $stateParams.ifaceid, $stateParams.timestamp, $stateParams.mintimestamp, $stateParams.resolution);
    }
}]);


mvisControllers.controller('statPeriodicController', ['$scope', '$stateParams', '$state', '$interval', 'mvisService', function ($scope, $stateParams, $state, $interval, mvisService) {
    console.log("statPeriodicController country=" + $stateParams.country  + ", site=" + $stateParams.site + ", nodeid=" + $stateParams.nodeid +
                ", timeout=" + $stateParams.timeout);

    $scope.uid = $stateParams.nodeid;
    $scope.timers = [];

    // this is the (real) management task
    var rttchart, signalstrengthchart,
        nodeid = mvisService.decomposeNodeId($stateParams.nodeid);

    function rttPeriodicLoadData(nodeid, ifaceid, series) {
        console.log("rttLoadData series", ifaceid);
        var i, len, timer,
            timestamp = new Date().getTime(),
            mintimestamp = mvisService.getMinTimestamp(timestamp, "1 hour before");

        mvisService.getRTT(nodeid, ifaceid, timestamp, mintimestamp, 100)
            .success(function (data) {
                console.log("RTT: ", data);
                series.setData(data, true, true);
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });

        timer = $interval(function () {
            mintimestamp = timestamp;
            timestamp = new Date().getTime();

            mvisService.getRTT(nodeid, ifaceid, timestamp, mintimestamp, 100)
                .success(function (data) {
                    console.log("RTT: ", data);
                    if (series.data.length > 0) {
                        for (i = 0, len = data.length; i < len; i += 1) {
                            series.addPoint(data[i], true, true);
                        }
                    } else {
                        series.setData(data, true, true);
                    }
                })
                .error(function (error) {
                    $state.go('error', {error: error});
                });
        }, $stateParams.timeout);
        $scope.timers.push(timer);
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
        }, function (series) {
            rttPeriodicLoadData(nodeid, series.name, series);
        });
    }

    function signalstrengthPeriodicLoadData(nodeid, ifaceid, series) {
        console.log("signalstrengthPeriodicLoadData series", ifaceid);
        var i, len, timer,
            timestamp = new Date().getTime(),
            mintimestamp = mvisService.getMinTimestamp(timestamp, "1 hour before");

        mvisService.getSignalStrength(nodeid, ifaceid, timestamp, mintimestamp, 100)
            .success(function (data) {
                console.log("SIGNALSTRENGTH: ", data);
                series.setData(data, true, true);
            })
            .error(function (error) {
                $state.go('error', {error: error});
            });

        timer = $interval(function () {
            mintimestamp = timestamp;
            timestamp = new Date().getTime();

            mvisService.getSignalStrength(nodeid, ifaceid, timestamp, mintimestamp, 100)
                .success(function (data) {
                    console.log("SIGNALSTRENGTH: ", data);
                    if (series.data.length > 0) {
                        for (i = 0, len = data.length; i < len; i += 1) {
                            series.addPoint(data[i], true, true);
                        }
                    } else {
                        series.setData(data, true, true);
                    }
                })
                .error(function (error) {
                    $state.go('error', {error: error});
                });
        }, $stateParams.timeout);
        $scope.timers.push(timer);
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
        }, function (series) {
            signalstrengthPeriodicLoadData(nodeid, series.name, series);
        });
    }

    // this is the (real) management task
    mvisService.getInterfaces($stateParams.country, $stateParams.site, nodeid)
        .success(function (ifaces) {
            console.log("Interfaces", ifaces);

            getPeriodicAllRTT(nodeid, ifaces);
            getPeriodicAllSignalStrength(nodeid, ifaces);
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
