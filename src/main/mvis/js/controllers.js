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

mvisControllers.controller('mainMgmtController', ['$scope', '$state', '$filter', 'ngTableParams', 'mvisService', function ($scope, $state, $filter, NgTableParams, mvisService) {
    mvisService.getAllNodes()
        .success(function (data) {
            $scope.nodes = [];
            angular.forEach(data, function (node) {
                console.log("Node info: ", node);
                this.push({
                    country: node.country,
                    site: node.site,
                    id: mvisService.composeNodeName(node.nodeid, node.displayname, node.hostname),
                    address: node.address,
                    interfaces: node.interfaces,
                    latitude: node.latitude,
                    longitude: node.longitude,
                    status: node.status,
                    validfrom: node.validfrom,
                    validto: node.validto,
                    nodeid: node.nodeid
                });
            }, $scope.nodes);

            $scope.nodesTable = new NgTableParams({
                count: 20
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
            mvisService.getNodeLastActivity(nodeid, interfaces)
                .success(function (data) {
                    angular.forEach(data, function (detail) {
                        console.log("Node detail", detail);
                        this.push({
                            id: detail.nodeid,
                            ping: (detail.ping) ? new Date(parseInt(detail.ping, 10) * 1000).toUTCString() : detail.ping,
                            modem: (detail.modem) ? new Date(parseInt(detail.modem, 10) * 1000).toUTCString() : detail.modem,
                            gps: (detail.gps) ? new Date(parseInt(detail.gps, 10) * 1000).toUTCString() : detail.gps
                        });
                    }, $scope.details);

                    $scope.nodeActivity.total($scope.details.length);
                    $scope.nodeActivity.reload();
                })
                .error(function (error) {
                    $state.go('error', {error: error});
                });
        } else {
            console.log("Interfaces not available for", nodeid);
        }
    };
}]);

mvisControllers.controller('sideMgmtController', ['$scope', '$state', 'mvisService', function ($scope, $state, mvisService) {
    $scope.testbed = {};
    $scope.testbeds = [
        {id: "Italy - Pisa - NXW"},
        {id: "Italy - Turin - POLITO"},
        {id: "Italy - Turin - GTT"},
        {id: "Spain - IMDEA - IMDEA"},
        {id: "Norway - Celerway - CWY"},
        {id: "Sweden - Karlstad - KAU"}
    ];

    $scope.testbedSelected = function ($model) {
        console.log("Selected testbed", $model.id);
        if ($model.id === "Italy - Pisa - NXW") {
            $scope.address = "Via Livornese 1027, 56122 San Piero A Grado, Pisa, Italia";
            $scope.postcode = "56122";
        } else if ($model.id === "Italy - Turin - POLITO") {
            $scope.address = "Dipartimento di Elettronica e Telecomunicazioni - Corso Duca degli Abruzzi 24, 10129 Torino, Italia";
            $scope.postcode = "10129";
        } else if ($model.id === "Italy - Turin - GTT") {
            $scope.address = "Corso Bramante 66, 10126 Torino, Italia";
            $scope.postcode = "10126";
        } else if ($model.id === "Spain - IMDEA - IMDEA") {
            $scope.address = "Avenida del Mar Mediterráneo 22, 28918 Leganes MADRID, Spain";
            $scope.postcode = "28918";
        } else if ($model.id === "Norway - Celerway - CWY") {
            $scope.address = "Martin Linges VEI 17, 1367 Snaroya, Norway";
            $scope.postcode = "1367";
        } else if ($model.id === "Sweden - Karlstad - KAU") {
            $scope.address = "Universitetsgatan 2, 65188 Karlstad, Sweden";
            $scope.postcode = "65188";
        }
    };

    $scope.submit = function () {
        var geocoder = new google.maps.Geocoder(),
            t = $scope.testbed.selected.id.replace(" - ", "-").split("-"),
            interfaces = (typeof $scope.interfaces === "undefined") ? "wwan0, usb0, usb1, usb1" : $scope.interfaces,
            body = {
                username: $scope.username,
                password: $scope.password,
                nodeid: $scope.nodeid,
                nodename: $scope.nodename,
                interfaces: interfaces,
                country: t[0],
                site: t[1],
                address: $scope.address,
                postcode: $scope.postcode,
                status: $scope.status
            };

        geocoder.geocode({'address': $scope.address}, function (res, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                body.latitude = res[0].geometry.location.lat();
                body.longitude = res[0].geometry.location.lng();
            }
            console.log("sideMgmtController info", body);
            mvisService.registerDevice(body)
                .success(function () {
                    alert("Node successfully registered!");
                    $state.reload();
                })
                .error(function (error) {
                    $state.go('error', {error: error});
                });
        });
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
                    ref: "#/statistic/periodic?country=" + $stateParams.country + "&site=" + $stateParams.site + "&nodeid=" + nodeid + "&timeout=60000"
                });

                google.maps.event.addListener(marker, 'click', function () {
                    console.log("Click event: ", marker.getTitle());
                    $state.go('statistic.periodic', {
                        country: $stateParams.country,
                        site: $stateParams.site,
                        nodeid: marker.getTitle(),
                        timeout: 60000
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
                    if (data.length > 0) {
                        if (series.data.length > 0) {
                            for (i = 0, len = data.length; i < len; i += 1) {
                                series.addPoint(data[i], true, true);
                            }
                        } else {
                            series.setData(data, true, true);
                        }
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
                    if (data.length > 0) {
                        if (series.data.length > 0) {
                            for (i = 0, len = data.length; i < len; i += 1) {
                                series.addPoint(data[i], true, true);
                            }
                        } else {
                            series.setData(data, true, true);
                        }
                    }
                })
                .error(function (error) {
                    $state.go('error', {error: error});
                });
        }, $stateParams.timeout);
        $scope.timers.push(timer);
    }

    function createTracker(info) {
        var gmap = new google.maps.Map(document.getElementById('map'), {
                zoom: 15,
                center: {lat: info.centre.lat, lng: info.centre.lng}
            }),
            polyline = new google.maps.Polyline({
                path: info.data,
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

    function gpsPeriodicLoadData(country, site, nodeid) {
        var tracker, timer, i, len,
            timestamp = new Date().getTime(),
            mintimestamp = mvisService.getMinTimestamp(timestamp, "1 hour before");

        mvisService.getGps(country, site, nodeid, timestamp, mintimestamp, 100)
            .success(function (info) {
                console.log("GPS info", info);
                tracker = createTracker(info);

                timer = $interval(function () {
                    mintimestamp = timestamp;
                    timestamp = new Date().getTime();

                    mvisService.getGps(country, site, nodeid, timestamp, mintimestamp, 100)
                        .success(function (info) {
                            console.log("GPS info", info);
                            if (info.data.length > 0) {
                                tracker.marker.setPosition(new google.maps.LatLng(info.current.lat, info.current.lng));
                                tracker.marker.setTitle("Lat: " + info.current.lat + ", Lng: " + info.current.lng);
                                var path = tracker.polyline.getPath();
                                for (i = 0, len = info.data.length; i < len; i += 1) {
                                    path.push(new google.maps.LatLng(info.data[i].lat, info.data[i].lng));
                                }
                            }
                        })
                        .error(function (error) {
                            $state.go('error', {error: error});
                        });
                }, $stateParams.timeout);
                $scope.timers.push(timer);
            })
            .error(function (error) {
                $state.go('error', {error: error});
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

    gpsPeriodicLoadData($stateParams.country, $stateParams.site, nodeid);

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
