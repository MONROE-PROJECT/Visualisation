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
    address = "0.0.0.0";

var express = require('express'),
    _ = require('underscore'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    flash = require('connect-flash'),
    fs = require('fs'),
    https = require('https'),
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

    if (country === "it" && site === "pisa") {
        ret = {latitude: 43.6814584, longitude: 10.353148199999964};

    } else if (country === "no" && site === "norway") {
        ret = {latitude: 59.89502339999999, longitude: 10.629005099999972};

    } else if (country === "es" && site === "spain") {
        ret = {latitude: 40.33684, longitude: -3.771060000000034};

    } else if (country === "se" && site === "sweden") {
        ret = {latitude: 59.406479, longitude: 13.580814099999998};

    } else if (country === "it" && site === "torino") {
        ret = {latitude: 45.0625527, longitude: 7.662398400000029};
    } else {
        ret = {latitude: 0, longitude: 0};
    }
    return ret;
}

function gen_scheduler_opts(uri) {
    var options = {
        hostname: 'scheduler.monroe-system.eu',
        port: 443,
        path: uri,
        rejectUnauthorized: false,
        pfx: fs.readFileSync(__dirname + '/client.p12')
    };
    options.agent = new https.Agent(options);
    return options;
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
            {id: "it - pisa"},
            {id: "it - torino"},
            {id: "es - spain"},
            {id: "no - norway"},
            {id: "se - sweden"}
        ],
        experiments: [
            {id: "ping"},
            {id: "http-download"}
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
            'country': "it",
            'site': "pisa",
            'latitude': 43.6814584,
            'longitude': 10.353148199999964
        }, {
            'name': "Fornebu @ Norway (Simula Research Laboratory & Celerway Communications)",
            'country': "no",
            'site': "norway",
            'latitude': 59.89502339999999,
            'longitude': 10.629005099999972
        }, {
            'name': "Madrid @ Spain (IMDEA Networks Institute)",
            'country': "es",
            'site': "spain",
            'latitude': 40.33684,
            'longitude': -3.771060000000034
        }, {
            'name': "Karlstad @ Sweden (Karlstads universitet)",
            'country': "se",
            'site': "sweden",
            'latitude': 59.406479,
            'longitude': 13.580814099999998
        }, {
            'name': "Torino @ Italy (Politecnico di Torino)",
            'country': "it",
            'site': "torino",
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
        query = 'SELECT country, site, nodeid, displayname, hostname, interfaces, ifdetails FROM ' + table;

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

app.get('/nodelastactivityrtt/:nodeid/:interfaces', function (req, res) {
    var interfaces = req.params.interfaces.split(','),
        query = 'SELECT timestamp, iccid FROM monroe_exp_ping WHERE nodeid = ? AND iccid IN ? LIMIT 1';

    cassclient.execute(query, [req.params.nodeid, interfaces], {prepare: true}, function (err, data) {
        if (err) {
            console.log("Error:", err.message);
            res.status(500).send(err.message);
        } else {
            console.log("data", JSON.stringify(data));
            var info = {timestamp: null, iccid: null};
            if (data.rows.length > 0) {
                info.timestamp = data.rows[0].timestamp;
                info.iccid = data.rows[0].iccid;
            }
            res.json(info);
        }
    });
});

app.get('/nodelastactivitymodem/:nodeid/:interfaces', function (req, res) {
    var interfaces = req.params.interfaces.split(','),
        query = 'SELECT timestamp, iccid FROM monroe_meta_device_modem WHERE nodeid = ? AND iccid IN ? LIMIT 1';

    cassclient.execute(query, [req.params.nodeid, interfaces], {prepare: true}, function (err, data) {
        if (err) {
            console.log("Error:", err.message);
            res.status(500).send(err.message);
        } else {
            console.log("data", JSON.stringify(data));
            var info = {timestamp: null, iccid: null};
            if (data.rows.length > 0) {
                info.timestamp = data.rows[0].timestamp;
                info.iccid = data.rows[0].iccid;
            }
            res.json(info);
        }
    });
});

app.get('/nodelastactivitygps/:nodeid', function (req, res) {
    // prepared query to the CASSANDRA-DB
    var query = 'SELECT timestamp FROM monroe_meta_device_gps WHERE nodeid = ? ORDER BY timestamp DESC LIMIT 1';

    cassclient.execute(query, [req.params.nodeid], {prepare: true}, function (err, data) {
        if (err) {
            console.log("Error:", err.message);
            res.status(500).send(err.message);
        } else {
            console.log("data", JSON.stringify(data));
            var info = {timestamp: null};
            if (data.rows.length > 0) {
                info.timestamp = data.rows[0].timestamp;
            }
            res.json(info);
        }
    });
});

app.post('/register_device', function (req, res) {
    console.log("Body:", req.body);
    if ((req.body.username !== "monroeadmin") || (req.body.password !== "monroeadmin")) {
        res.status(500).send("Unauthorized user credentials!");
    } else {
        // prepared query to the CASSANDRA-DB
        var query = "INSERT INTO devices (country,site,nodeid,address,displayname,hostname,interfaces,ifdetails,latitude,longitude,modemcount,postcode,status,validfrom,validto)" +
                    " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            from = new Date(),
            to = new Date(),
            params = [req.body.country, req.body.site, req.body.nodeid, req.body.address, req.body.nodename, req.body.nodename, req.body.interfaces, req.body.ifdetails,
                      req.body.latitude, req.body.longitude, req.body.interfaces.length, req.body.postcode, req.body.nodestatus, from, to.setMonth(to.getMonth() + 24)];

        cassclient.execute(query, params, {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                res.sendStatus(201);
            }
        });
    }
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

app.post('/resynchronise_db', function (req, res) {
    console.log("Body:", req.body);
    if ((req.body.username !== "monroeadmin") || (req.body.password !== "monroeadmin")) {
        res.status(500).send("Unauthorized user credentials!");
    } else {
        https.get(gen_scheduler_opts('/v1/resources'), function (sched_res) {
            console.log("statusCode: ", sched_res.statusCode);
            var data = "", queries = [], interfaces = [], ifdetails = {},
                query = "INSERT INTO devices (country,site,nodeid,hostname,status,model,interfaces,ifdetails,latitude,longitude) VALUES (?,?,?,?,?,?,?,?,?,?)",
                info, i, index, detailsop, detailsiccid;

            sched_res.on('data', function (d) {
                data += d.toString().trim();
            });

            sched_res.on('end', function () {
                info = JSON.parse(data);
                var country = null;
                for (i = 0; i < info.length; i += 1) {
                    interfaces = [];
                    ifdetails = {};

                    country = info[i].country;
                    if (!country) {
                        if ((info[i].project === 'celerway') || (info[i].project === 'norway')) {
                            country = 'no';
                        } else if (info[i].project === 'sweden') {
                            country = 'se';
                        } else if ((info[i].project === 'torino') || (info[i].project === 'pisa')) {
                            country = 'it';
                        } else if (info[i].project === 'spain') {
                            country = 'es';
                        }
                    }
                    if (country && info[i].site && info[i].id && info[i].interfaces && (info[i].interfaces.length > 0)) {
                        for (index = 0; index < info[i].interfaces.length; index += 1) {
                            detailsop = "device" + index.toString() + "Operator";
                            detailsiccid = "device" + index.toString() + "ICCID";

                            interfaces.push(info[i].interfaces[index].iccid);
                            ifdetails[detailsop] = info[i].interfaces[index].operator;
                            ifdetails[detailsiccid] = info[i].interfaces[index].iccid;
                        }

                        console.log("INTERFACES", interfaces);
                        console.log("IFDETAILS", ifdetails);

                        queries.push({
                            query: query,
                            params: [country, info[i].site, info[i].id, info[i].hostname, info[i].status, info[i].model,
                                     interfaces, ifdetails, info[i].latitude, info[i].longitude]
                        });
                    } else {
                        console.log("Missing parameters for device", i, ":", country, info[i].site, info[i].id);
                    }
                }

                function error_mngr(err) {
                    if (err) {
                        console.log("Error:", err.message);
                        res.status(500).send(err.message);
                    }
                }
                console.log("queries", queries);
                for (i = 0, index = queries.length; i < index;  i += 20) {
                    cassclient.batch(queries.slice(i, i + 20), {prepare: true}, error_mngr);
                }
                res.sendStatus(201);
            });
        }).on('error', function (e) {
            console.log("Error:", e);
            res.status(500).send(e);
        });
    }
});

app.get('/rtt/:nodeid/:ifaceid/:timestamp/:mintimestamp/:resolution', function (req, res) {
    console.log("RTT:", req.params.nodeid, req.params.ifaceid, req.params.timestamp, "[", new Date(parseInt(req.params.timestamp, 10)), "]",
                req.params.mintimestamp, "[", new Date(parseInt(req.params.mintimestamp, 10)), "]", req.params.resolution);
    // prepared query to the CASSANDRA-DB (the timestamps are stored in secs!)
    var threshold = Math.floor(req.params.timestamp / 1000),
        minthreshold = Math.floor(req.params.mintimestamp / 1000),
        table = 'monroe_exp_ping',
        query = 'SELECT timestamp, rtt FROM ' + table + ' WHERE nodeid = ? AND iccid = ? AND timestamp <= ? AND timestamp >= ? ORDER BY timestamp DESC LIMIT ?';

    cassclient.execute(query, [req.params.nodeid, req.params.ifaceid, threshold, minthreshold, req.params.resolution],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("RTT(", req.params.nodeid, ":", req.params.ifaceid, ") data", JSON.stringify(data));
                var i, len, info = [], value;
                for (i = 0, len = data.rows.length; i < len; i += 1) {
                    value = data.rows[i].rtt;
                    if (value) {
                        // It is needed to convert the data in msecs!
                        info.unshift([Math.floor(data.rows[i].timestamp * 1000), value]);
                    }
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
        query = 'SELECT sequencenumber FROM ' + table + ' WHERE nodeid = ? AND iccid = ? AND timestamp <= ? AND timestamp >= ? ORDER BY timestamp DESC LIMIT ?';

    cassclient.execute(query, [req.params.nodeid, req.params.ifaceid, threshold, minthreshold, req.params.resolution],
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
        query = 'SELECT devicemode FROM ' + table + ' WHERE nodeid = ? AND iccid = ? AND timestamp <= ? AND timestamp >= ? ORDER BY timestamp DESC LIMIT ?';

    cassclient.execute(query, [req.params.nodeid, req.params.ifaceid, threshold, minthreshold, req.params.resolution],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("CONNECTIONTYPE(", req.params.nodeid, ":", req.params.ifaceid, ") data", JSON.stringify(data));
                var i, len, type, info = [], tmp = {};
                for (i = 0, len = data.rows.length; i < len; i += 1) {
                    type = convertConnectionType(data.rows[i].devicemode);
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
        query = 'SELECT timestamp, rssi FROM ' + table + ' WHERE nodeid = ? AND iccid = ? AND timestamp <= ? AND timestamp >= ? ORDER BY timestamp DESC LIMIT ?';

    cassclient.execute(query, [req.params.nodeid, req.params.ifaceid, threshold, minthreshold, req.params.resolution],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("SIGNALSTRENGTH(", req.params.nodeid, ":", req.params.ifaceid, ") data", JSON.stringify(data));
                var i, len, info = [], value;
                for (i = 0, len = data.rows.length; i < len; i += 1) {
                    value = data.rows[i].rssi;
                    if (value) {
                        // It is needed to convert the data in msecs!
                        info.unshift([Math.floor(data.rows[i].timestamp * 1000), value]);
                    }
                }
                res.json(info);
            }
        });
});

app.get('/httpspeed/:nodeid/:ifaceid/:timestamp/:mintimestamp/:resolution', function (req, res) {
    console.log("HTTPSPEED:", req.params.nodeid, req.params.ifaceid, req.params.timestamp, "[", new Date(parseInt(req.params.timestamp, 10)), "]",
                req.params.mintimestamp, "[", new Date(parseInt(req.params.mintimestamp, 10)), "]", req.params.resolution);
    // prepared query to the CASSANDRA-DB (the timestamps are stored in secs!)
    var threshold = Math.floor(req.params.timestamp / 1000),
        minthreshold = Math.floor(req.params.mintimestamp / 1000),
        table = 'monroe_exp_http_download',
        query = 'SELECT timestamp, speed FROM ' + table + ' WHERE nodeid = ? AND iccid = ? AND timestamp <= ? AND timestamp >= ? ORDER BY timestamp DESC LIMIT ?';

    cassclient.execute(query, [req.params.nodeid, req.params.ifaceid, threshold, minthreshold, req.params.resolution],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("HTTPSPEED(", req.params.nodeid, ":", req.params.ifaceid, ") data", JSON.stringify(data));
                var i, len, info = [], value;
                for (i = 0, len = data.rows.length; i < len; i += 1) {
                    value = data.rows[i].speed;
                    if (value) {
                        // It is needed to convert the data in msecs!
                        info.unshift([Math.floor(data.rows[i].timestamp * 1000), value]);
                    }
                }
                res.json(info);
            }
        });
});

app.get('/cpu/:nodeid/:timestamp/:mintimestamp/:resolution', function (req, res) {
    console.log("CPU:", req.params.nodeid, req.params.timestamp, "[", new Date(parseInt(req.params.timestamp, 10)), "]",
                req.params.mintimestamp, "[", new Date(parseInt(req.params.mintimestamp, 10)), "]", req.params.resolution);
    // prepared query to the CASSANDRA-DB (the timestamps are stored in secs!)
    var threshold = Math.floor(req.params.timestamp / 1000),
        minthreshold = Math.floor(req.params.mintimestamp / 1000),
        table = 'monroe_meta_node_sensor',
        query = 'SELECT timestamp, cpu FROM ' + table + ' WHERE nodeid = ? AND timestamp <= ? AND timestamp >= ? ORDER BY timestamp DESC LIMIT ?';

    cassclient.execute(query, [req.params.nodeid, threshold, minthreshold, req.params.resolution],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("CPU(", req.params.nodeid, ") data", JSON.stringify(data));
                var i, len, info = [], value;
                for (i = 0, len = data.rows.length; i < len; i += 1) {
                    value = data.rows[i].cpu;
                    if (value) {
                        // It is needed to convert the data in msecs!
                        info.unshift([Math.floor(data.rows[i].timestamp * 1000), parseInt(value, 10)]);
                    }
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
        query = 'SELECT longitude, latitude FROM ' + table + ' WHERE nodeid = ? AND timestamp <= ? AND timestamp >= ? ORDER BY timestamp DESC LIMIT ?';

    cassclient.execute(query, [req.params.nodeid, threshold, minthreshold, req.params.resolution],
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
