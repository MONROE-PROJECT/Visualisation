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
/*jslint node:true, nomen:true, unparam:true */
'use strict';

var port = 8080,
    address = "0.0.0.0",
    dataversion = 1;

var express = require('express'),
    _ = require('underscore'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    flash = require('connect-flash'),
    fs = require('fs'),
    cassandra = require('cassandra-driver'),
    cassclient = new cassandra.Client({
        contactPoints: ['127.0.0.1'],
        keyspace: 'monroe',
        authProvider: new cassandra.auth.PlainTextAuthProvider('monroe', 'MMBNinE')
    });

cassclient.on('log', function (level, className, message, furtherInfo) {
    if (level !== 'verbose') {
        console.log('[%s] [%s]: %s -- %s', level, className, message, furtherInfo);
    }
});

// utilities
function get_centre(country, site) {
    var ret;

    if (country === "italy" && site === "pisa") {
        ret = {latitude: 43.6814584, longitude: 10.353148199999964};

    } else if (country === "Norway" && site === "Celerway") {
        ret = {latitude: 59.89502339999999, longitude: 10.629005099999972};

    } else if (country === "Spain" && site === "IMDEA") {
        ret = {latitude: 40.33684, longitude: -3.771060000000034};

    } else if (country === "Sweden" && site === "Karlstad") {
        ret = {latitude: 59.406479, longitude: 13.580814099999998};

    } else if (country === "italy" && site === "turin") {
        ret = {latitude: 45.0625527, longitude: 7.662398400000029};
    } else {
        ret = {latitude: 0, longitude: 0};
    }
    return ret;
}

/*jslint nomen:true*/
var static_folder = __dirname + '/../../../target/gulp/mvis/static/';
console.log("\nstatic folder:", static_folder);

if (!fs.lstatSync(static_folder).isDirectory()) {
    console.error(static_folder, "is NOT a directory!");
    throw new Error("Static folder down NOT exist!");
}

var app = express()
    .use(logger('dev'))
    .use(session({cookie: {maxAge: 2419200000},
                  secret: 'nextworks',
                  saveUninitialized: true,
                  resave: false}))
    .use(cookieParser())
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({extended: true}))
    .use(flash())
    .use(express['static'](static_folder));

// Route
app.get('/', function (req, res) {
    res.redirect('/home');
});

app.get('/home', function (req, res) {
    res.sendFile(__dirname + '/public/home.html');
});

app.post('/ping', function (req, res) {
    res.sendStatus(200);
});

app.get('/noauth', function (req, res) {
    res.sendStatus(401);
});

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.get('/query_info', function (req, res) {
    var info = {
        timeslots: [
            {id: "1 hour before"},
            {id: "6 hours before"},
            {id: "24 hours before"}
        ],
        testbeds: [
            {id: "Italy - Pisa"},
            {id: "Italy - Turin"},
            {id: "Spain - IMDEA"},
            {id: "Norway - Celerway"},
            {id: "Sweden - Karlstad"}
        ],
        experiments: [
            {id: "ping"}
        ],
        resolutions: [
            {id: "100"},
            {id: "300"},
            {id: "500"}
        ]
    };
    res.json(info);
});

app.get('/states_location', function (req, res) {
    var info = [
        {
            'name': "Pisa @ Italy (Nextworks)",
            'country': "italy",
            'site': "pisa",
            'latitude': 43.6814584,
            'longitude': 10.353148199999964
        }, {
            'name': "Fornebu @ Norway (Simula Research Laboratory & Celerway Communications)",
            'country': "Norway",
            'site': "Celerway",
            'latitude': 59.89502339999999,
            'longitude': 10.629005099999972
        }, {
            'name': "Madrid @ Spain (IMDEA Networks Institute)",
            'country': "Spain",
            'site': "IMDEA",
            'latitude': 40.33684,
            'longitude': -3.771060000000034
        }, {
            'name': "Karlstad @ Sweden (Karlstads universitet)",
            'country': "Sweden",
            'site': "Karlstad",
            'latitude': 59.406479,
            'longitude': 13.580814099999998
        }, {
            'name': "Torino @ Italy (Politecnico di Torino)",
            'country': "italy",
            'site': "turin",
            'latitude': 45.0625527,
            'longitude': 7.662398400000029
        }
    ];
    res.json(info);
});

app.get('/region/:country/:site', function (req, res) {
    var centre = get_centre(req.params.country, req.params.site),
        info = {
            'centre_latitude': centre.latitude,
            'centre_longitude': centre.longitude,
            'data': []
        }, // prepared query to the CASSANDRA-DB
        table = 'devices',
        query = 'SELECT nodeid, displayname, hostname, longitude, latitude, address, model, status, interfaces FROM ' + table +
            ' WHERE country = ? AND site = ?';

    cassclient.execute(query, [req.params.country, req.params.site], {prepare: true}, function (err, data) {
        if (err) {
            console.log("Error:", err.message);
            res.status(500).send(err.message);
        } else {
            console.log("data", JSON.stringify(data));
            info.data = data.rows;
            res.json(info);
        }
    });
});

app.get('/nodes', function (req, res) {
    // prepared query to the CASSANDRA-DB
    var table = 'devices',
        query = 'SELECT country, site, nodeid, address, displayname, hostname, interfaces, latitude, longitude, status, validfrom, validto FROM ' + table;

    cassclient.execute(query, [], {prepare: true}, function (err, data) {
        if (err) {
            console.log("Error:", err.message);
            res.status(500).send(err.message);
        } else {
            console.log("data", JSON.stringify(data));
            res.json(data.rows);
        }
    });
});

app.get('/nodelastactivity/:nodeid/:interfaces', function (req, res) {
    var info = {
        'nodeid': req.params.nodeid,
        'ping': null,
        'modem': null,
        'gps': null
    }, completed = _.after(3, function () {
        res.json([info]);
    }), interfaces = req.params.interfaces.split(','), query;

    query = 'SELECT timestamp FROM monroe_exp_ping WHERE dataversion = ? AND nodeid = ? AND interfacename IN ? ORDER BY timestamp DESC LIMIT 1';
    cassclient.execute(query, [dataversion, req.params.nodeid, interfaces], {prepare: true}, function (err, data) {
        if (err) {
            console.log("Error:", err.message);
        } else {
            console.log("RTT(", req.params.nodeid, ":", interfaces, ") data", JSON.stringify(data));
            var i, len;
            for (i = 0, len = data.rows.length; i < len; i += 1) {
                info.ping = data.rows[i].timestamp;
            }
        }
        completed();
    });

    query = 'SELECT timestamp FROM monroe_meta_device_modem WHERE dataversion = ? AND nodeid = ? AND interfacename IN ? ORDER BY timestamp DESC LIMIT 1';
    cassclient.execute(query, [dataversion, req.params.nodeid, interfaces], {prepare: true}, function (err, data) {
        if (err) {
            console.log("Error:", err.message);
        } else {
            console.log("MODEM(", req.params.nodeid, ":", interfaces, ") data", JSON.stringify(data));
            var i, len;
            for (i = 0, len = data.rows.length; i < len; i += 1) {
                info.modem = data.rows[i].timestamp;
            }
        }
        completed();
    });

    query = 'SELECT timestamp FROM monroe_meta_device_gps WHERE dataversion = ? AND nodeid = ? ORDER BY timestamp DESC LIMIT 1';
    cassclient.execute(query, [dataversion, req.params.nodeid], {prepare: true}, function (err, data) {
        if (err) {
            console.log("Error:", err.message);
        } else {
            console.log("GPS(", req.params.nodeid, ") data", JSON.stringify(data));
            var i, len;
            for (i = 0, len = data.rows.length; i < len; i += 1) {
                info.gps = data.rows[i].timestamp;
            }
        }
        completed();
    });
});

app.get('/nodes_name/:country/:site', function (req, res) {
    // prepared query to the CASSANDRA-DB
    var table = 'devices',
        query = 'SELECT nodeid, displayname, hostname FROM ' + table + ' WHERE country = ? AND site = ?';

    cassclient.execute(query, [req.params.country, req.params.site], {prepare: true}, function (err, data) {
        if (err) {
            console.log("Error:", err.message);
            res.status(500).send(err.message);
        } else {
            console.log("data", JSON.stringify(data));
            res.json(data.rows);
        }
    });
});

app.get('/node_interfaces/:country/:site/:nodeid', function (req, res) {
    // prepared query to the CASSANDRA-DB
    var table = 'devices',
        query = 'SELECT interfaces FROM ' + table + ' WHERE country = ? AND site = ? AND nodeid = ?';

    cassclient.execute(query, [req.params.country, req.params.site, req.params.nodeid],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("data", JSON.stringify(data));
                res.json(data.rows);
            }
        });
});

app.get('/rtt/:nodeid/:ifaceid/:timestamp/:mintimestamp/:resolution', function (req, res) {
    console.log("RTT:", req.params.nodeid, req.params.ifaceid, req.params.timestamp, "[", new Date(parseInt(req.params.timestamp, 10)), "]",
                req.params.mintimestamp, "[", new Date(parseInt(req.params.mintimestamp, 10)), "]", req.params.resolution);
    // prepared query to the CASSANDRA-DB (the timestamps are stored in secs!)
    var threshold = Math.floor(req.params.timestamp / 1000),
        minthreshold = Math.floor(req.params.mintimestamp / 1000),
        table = 'monroe_exp_ping',
        query = 'SELECT timestamp, rtt FROM ' + table + ' WHERE dataversion = ? AND nodeid = ? AND interfacename = ? AND timestamp <= ? AND timestamp >= ? ORDER BY timestamp DESC LIMIT ?';

    cassclient.execute(query, [dataversion, req.params.nodeid, req.params.ifaceid, threshold, minthreshold, req.params.resolution],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("RTT(", req.params.nodeid, ":", req.params.ifaceid, ") data", JSON.stringify(data));
                var i, len, info = [];
                for (i = 0, len = data.rows.length; i < len; i += 1) {
                    // It is needed to convert the data in msecs!
                    info.unshift([Math.floor(data.rows[i].timestamp * 1000), data.rows[i].rtt]);
                }
                res.json(info);
            }
        });
});

app.get('/packetloss/:nodeid/:ifaceid/:timestamp/:mintimestamp/:resolution', function (req, res) {
    console.log("PACKETLOSS:", req.params.nodeid, req.params.ifaceid, req.params.timestamp, "[", new Date(parseInt(req.params.timestamp, 10)), "]",
                req.params.mintimestamp, "[", new Date(parseInt(req.params.mintimestamp, 10)), "]", req.params.resolution);
    // prepared query to the CASSANDRA-DB (the timestamps are stored in secs!)
    var threshold = Math.floor(req.params.timestamp / 1000),
        minthreshold = Math.floor(req.params.mintimestamp / 1000),
        table = 'monroe_exp_ping',
        query = 'SELECT sequencenumber FROM ' + table + ' WHERE dataversion = ? AND nodeid = ? AND interfacename = ? AND timestamp <= ? AND timestamp >= ? ORDER BY timestamp DESC LIMIT ?';

    cassclient.execute(query, [dataversion, req.params.nodeid, req.params.ifaceid, threshold, minthreshold, req.params.resolution],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("PACKETLOSS(", req.params.nodeid, ":", req.params.ifaceid, ") data", JSON.stringify(data));
                var i, len, info = [];
                for (i = 0, len = data.rows.length; i < len; i += 1) {
                    info.unshift(data.rows[i].sequencenumber);
                }
                res.json(info);
            }
        });
});

function convertConnectionType(num) {
    var x = parseInt(num, 10), ret = "MODE_UNKNOWN";
    if (x === 6) {
        ret = "LTE";
    } else if (x === 5) {
        ret = "3G";
    } else if (x === 4) {
        ret = "2G";
    } else if (x === 3) {
        ret = "NO_SERVICE";
    } else if (x === 2) {
        ret = "DISCONNECTED";
    }
    return ret;
}

app.get('/connectiontype/:nodeid/:ifaceid/:timestamp/:mintimestamp/:resolution', function (req, res) {
    console.log("CONNECTIONTYPE:", req.params.nodeid, req.params.ifaceid, req.params.timestamp, "[", new Date(parseInt(req.params.timestamp, 10)), "]",
                req.params.mintimestamp, "[", new Date(parseInt(req.params.mintimestamp, 10)), "]", req.params.resolution);
    // prepared query to the CASSANDRA-DB (the timestamps are stored in secs!)
    var threshold = Math.floor(req.params.timestamp / 1000),
        minthreshold = Math.floor(req.params.mintimestamp / 1000),
        table = 'monroe_meta_device_modem',
        query = 'SELECT mode FROM ' + table + ' WHERE dataversion = ? AND nodeid = ? AND interfacename = ? AND timestamp <= ? AND timestamp >= ? ORDER BY timestamp DESC LIMIT ?';

    cassclient.execute(query, [dataversion, req.params.nodeid, req.params.ifaceid, threshold, minthreshold, req.params.resolution],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("CONNECTIONTYPE(", req.params.nodeid, ":", req.params.ifaceid, ") data", JSON.stringify(data));
                var i, len, type, info = [], tmp = {};
                for (i = 0, len = data.rows.length; i < len; i += 1) {
                    type = convertConnectionType(data.rows[i].mode);
                    if (tmp.hasOwnProperty(type)) {
                        tmp[type] += 1;
                    } else {
                        tmp[type] = 0;
                    }
                }
                for (i in tmp) {
                    if (tmp.hasOwnProperty(i)) {
                        info.push({
                            name: i,
                            y: Math.round((tmp[i] * 100) / len)
                        });
                    }
                }
                res.json(info);
            }
        });
});

app.get('/signalstrength/:nodeid/:ifaceid/:timestamp/:mintimestamp/:resolution', function (req, res) {
    console.log("SIGNALSTRENGTH:", req.params.nodeid, req.params.ifaceid, req.params.timestamp, "[", new Date(parseInt(req.params.timestamp, 10)), "]",
                req.params.mintimestamp, "[", new Date(parseInt(req.params.mintimestamp, 10)), "]", req.params.resolution);
    // prepared query to the CASSANDRA-DB (the timestamps are stored in secs!)
    var threshold = Math.floor(req.params.timestamp / 1000),
        minthreshold = Math.floor(req.params.mintimestamp / 1000),
        table = 'monroe_meta_device_modem',
        query = 'SELECT timestamp, signalstrength FROM ' + table + ' WHERE dataversion = ? AND nodeid = ? AND interfacename = ? AND timestamp <= ? AND timestamp >= ? ORDER BY timestamp DESC LIMIT ?';

    cassclient.execute(query, [dataversion, req.params.nodeid, req.params.ifaceid, threshold, minthreshold, req.params.resolution],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("SIGNALSTRENGTH(", req.params.nodeid, ":", req.params.ifaceid, ") data", JSON.stringify(data));
                var i, len, info = [];
                for (i = 0, len = data.rows.length; i < len; i += 1) {
                    // It is needed to convert the data in msecs!
                    info.unshift([Math.floor(data.rows[i].timestamp * 1000), data.rows[i].signalstrength]);
                }
                res.json(info);
            }
        });
});

app.get('/gps/:country/:site/:nodeid/:timestamp/:mintimestamp/:resolution', function (req, res) {
    console.log("GPS:", req.params.country, req.params.site, req.params.nodeid, req.params.timestamp, "[", new Date(parseInt(req.params.timestamp, 10)), "]",
                req.params.mintimestamp, "[", new Date(parseInt(req.params.mintimestamp, 10)), "]", req.params.resolution);
    var centre = get_centre(req.params.country, req.params.site),
        info = {
            'centre': {lat: centre.latitude, lng: centre.longitude},
            'current': {},
            'data': []
        }, // prepared query to the CASSANDRA-DB (the timestamps are stored in secs!)
        threshold = Math.floor(req.params.timestamp / 1000),
        minthreshold = Math.floor(req.params.mintimestamp / 1000),
        table = 'monroe_meta_device_gps',
        query = 'SELECT longitude, latitude FROM ' + table + ' WHERE dataversion = ? AND nodeid = ? AND timestamp <= ? AND timestamp >= ? ORDER BY timestamp DESC LIMIT ?';

    cassclient.execute(query, [dataversion, req.params.nodeid, threshold, minthreshold, req.params.resolution],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("GPS(", req.params.nodeid, ") data", JSON.stringify(data));
                var i, len;
                for (i = 0, len = data.rows.length; i < len; i += 1) {
                    if ((data.rows[i].latitude !== null) && (data.rows[i].longitude !== null)) {
                        info.data.unshift({lat: parseFloat(data.rows[i].latitude), lng: parseFloat(data.rows[i].longitude)});
                        info.current.lat = parseFloat(data.rows[i].latitude);
                        info.current.lng = parseFloat(data.rows[i].longitude);
                    }
                }
                res.json(info);
            }
        });
});

app.listen(port, address, function () {
    console.log('Express-server listening on ' + address + ':' + port);
});
