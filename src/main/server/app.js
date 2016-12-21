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
    res.sendFile(__dirname + '/public/index.html');
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
        }, {
            'name': "Bilbao @ Spain (MARiL-in-MONROE)",
            'type': "external-users",
            'latitude': 43.2630126,
            'longitude': -2.9349852000000283
        }, {
            'name': "Castelo Branco @ Portugal (MONROE-LTE)",
            'type': "external-users",
            'latitude': 39.8197117,
            'longitude': -7.496466199999986
        }, {
            'name': "Cork @ Ireland (SOPHIA)",
            'type': "external-users",
            'latitude': 51.8968917,
            'longitude': -8.486315699999977
        }, {
            'name': "Barcelona @ Spain (SOPHIA)",
            'type': "external-users",
            'latitude': 41.38506389999999,
            'longitude': 2.1734034999999494
        }, {
            'name': "Ljubljana @ Slovenia  (RICERCANDO)",
            'type': "external-users",
            'latitude': 46.0569465,
            'longitude': 14.505751499999974
        }, {
            'name': "Chalkida @ Greece (NESTOR)",
            'type': "external-users",
            'latitude': 38.4645245,
            'longitude': 23.605069500000013
        }, {
            'name': "Aberdeen @ Great Britain (PREC)",
            'type': "external-users",
            'latitude': 57.149717,
            'longitude': -2.094278000000031
        }, {
            'name': "Athens @ Greece (MOVEMENT)",
            'type': "external-users",
            'latitude': 37.9838096,
            'longitude': 23.727538800000048
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
        i = interfaces[Math.floor(Math.random() * interfaces.length)],
        query = 'SELECT timestamp, iccid FROM monroe_exp_ping WHERE nodeid = ? AND iccid = ? ORDER BY timestamp DESC LIMIT 1';

    cassclient.execute(query, [req.params.nodeid, i], {prepare: true}, function (err, data) {
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
        i = interfaces[Math.floor(Math.random() * interfaces.length)],
        query = 'SELECT timestamp, iccid FROM monroe_meta_device_modem WHERE nodeid = ? AND iccid = ? ORDER BY timestamp DESC LIMIT 1';

    cassclient.execute(query, [req.params.nodeid, i], {prepare: true}, function (err, data) {
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

app.get('/nodelastactivitytstat/:nodeid/:interfaces', function (req, res) {
    var interfaces = req.params.interfaces.split(','),
        i = interfaces[Math.floor(Math.random() * interfaces.length)],
        query = 'SELECT first, iccid FROM monroe_exp_tstat_tcp_complete WHERE nodeid = ? AND iccid = ? AND s_ip = ? ORDER BY first DESC LIMIT 1',
        sip = '193.10.227.25';

    cassclient.execute(query, [req.params.nodeid, i, sip], {prepare: true}, function (err, data) {
        if (err) {
            console.log("Error:", err.message);
            res.status(500).send(err.message);
        } else {
            console.log("data", JSON.stringify(data));
            var info = {timestamp: null, iccid: null};
            if (data.rows.length > 0) {
                info.timestamp = (data.rows[0].first / 1000);
                info.iccid = data.rows[0].iccid;
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

app.get('/node_ifdetails/:country/:site/:nodeid', function (req, res) {
    // prepared query to the CASSANDRA-DB
    var table = 'devices',
        query = 'SELECT IfDetails FROM ' + table + ' WHERE country = ? AND site = ? AND nodeid = ?';

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

app.get('/tstatthroughput/:nodeid/:ifaceid/:timestamp/:mintimestamp/:resolution', function (req, res) {
    console.log("TSTAT-THROUGHPUT:", req.params.nodeid, req.params.ifaceid, req.params.timestamp, "[", new Date(parseInt(req.params.timestamp, 10)), "]",
                req.params.mintimestamp, "[", new Date(parseInt(req.params.mintimestamp, 10)), "]", req.params.resolution);
    // prepared query to the CASSANDRA-DB (the timestamps are stored in milli-secs, no need to convert!)
    var table = 'monroe_exp_tstat_tcp_complete',
        query = 'SELECT first, s_bytes_uniq, s_last, s_first FROM ' + table + ' WHERE nodeid = ? AND iccid = ? AND s_ip = ? AND first <= ? AND first >= ? AND s_last > 0 AND s_first > 0 AND s_bytes_uniq > 0 ORDER BY first DESC LIMIT ? ALLOW FILTERING',
        sip = '193.10.227.25';

    cassclient.execute(query, [req.params.nodeid, req.params.ifaceid, sip, req.params.timestamp, req.params.mintimestamp, req.params.resolution],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("TSTAT-THROUGHPUT(", req.params.nodeid, ":", req.params.ifaceid, ") data", JSON.stringify(data));
                var i, len, info = [], value;
                for (i = 0, len = data.rows.length; i < len; i += 1) {
                    value = data.rows[i].s_bytes_uniq / (data.rows[i].s_last - data.rows[i].s_first);
                    if (value > 0) {
                        info.unshift([Math.floor(data.rows[i].first), value]);
                    }
                }
                res.json(info);
            }
        });
});

app.get('/tstatavgrtt/:nodeid/:ifaceid/:timestamp/:mintimestamp/:resolution', function (req, res) {
    console.log("TSTAT-AVG-RTT:", req.params.nodeid, req.params.ifaceid, req.params.timestamp, "[", new Date(parseInt(req.params.timestamp, 10)), "]",
                req.params.mintimestamp, "[", new Date(parseInt(req.params.mintimestamp, 10)), "]", req.params.resolution);
    // prepared query to the CASSANDRA-DB (the timestamps are stored in milli-secs, no need to convert!)
    var table = 'monroe_exp_tstat_tcp_complete',
        query = 'SELECT first, c_rtt_avg FROM ' + table + ' WHERE nodeid = ? AND iccid = ? AND s_ip = ? AND first <= ? AND first >= ? AND c_rtt_min > 0 ORDER BY first DESC LIMIT ? ALLOW FILTERING',
        sip = '193.10.227.25';

    cassclient.execute(query, [req.params.nodeid, req.params.ifaceid, sip, req.params.timestamp, req.params.mintimestamp, req.params.resolution],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("TSTAT-AVG-RTT(", req.params.nodeid, ":", req.params.ifaceid, ") data", JSON.stringify(data));
                var i, len, info = [];
                for (i = 0, len = data.rows.length; i < len; i += 1) {
                    info.unshift([Math.floor(data.rows[i].first), Math.floor(data.rows[i].c_rtt_avg)]);
                }
                res.json(info);
            }
        });
});

app.get('/tstatrangertt/:nodeid/:ifaceid/:timestamp/:mintimestamp/:resolution', function (req, res) {
    console.log("TSTAT-RANGE-RTT:", req.params.nodeid, req.params.ifaceid, req.params.timestamp, "[", new Date(parseInt(req.params.timestamp, 10)), "]",
                req.params.mintimestamp, "[", new Date(parseInt(req.params.mintimestamp, 10)), "]", req.params.resolution);
    // prepared query to the CASSANDRA-DB (the timestamps are stored in milli-secs, no need to convert!)
    var table = 'monroe_exp_tstat_tcp_complete',
        query = 'SELECT first, c_rtt_min, c_rtt_max FROM ' + table + ' WHERE nodeid = ? AND iccid = ? AND s_ip = ? AND first <= ? AND first >= ? AND c_rtt_min > 0 ORDER BY first DESC LIMIT ? ALLOW FILTERING',
        sip = '193.10.227.25';

    cassclient.execute(query, [req.params.nodeid, req.params.ifaceid, sip, req.params.timestamp, req.params.mintimestamp, req.params.resolution],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("TSTAT-RANGE-RTT(", req.params.nodeid, ":", req.params.ifaceid, ") data", JSON.stringify(data));
                var i, len, info = [];
                for (i = 0, len = data.rows.length; i < len; i += 1) {
                    info.unshift([Math.floor(data.rows[i].first), Math.floor(data.rows[i].c_rtt_min), Math.floor(data.rows[i].c_rtt_max)]);
                }
                res.json(info);
            }
        });
});

app.get('/tstatretransmission/:nodeid/:ifaceid/:timestamp/:mintimestamp/:resolution', function (req, res) {
    console.log("TSTAT-RETRANSMISSION:", req.params.nodeid, req.params.ifaceid, req.params.timestamp, "[", new Date(parseInt(req.params.timestamp, 10)), "]",
                req.params.mintimestamp, "[", new Date(parseInt(req.params.mintimestamp, 10)), "]", req.params.resolution);
    // prepared query to the CASSANDRA-DB (the timestamps are stored in milli-secs, no need to convert!)
    var table = 'monroe_exp_tstat_tcp_complete',
        query = 'SELECT first, s_pkts_retx FROM ' + table + ' WHERE nodeid = ? AND iccid = ? AND s_ip = ? AND first <= ? AND first >= ? AND s_pkts_retx > 0 ORDER BY first DESC LIMIT ? ALLOW FILTERING',
        sip = '193.10.227.25';

    cassclient.execute(query, [req.params.nodeid, req.params.ifaceid, sip, req.params.timestamp, req.params.mintimestamp, req.params.resolution],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("TSTAT-RETRANSMISSION(", req.params.nodeid, ":", req.params.ifaceid, ") data", JSON.stringify(data));
                var i, len, info = [];
                for (i = 0, len = data.rows.length; i < len; i += 1) {
                    info.unshift([Math.floor(data.rows[i].first), data.rows[i].s_pkts_retx]);
                }
                res.json(info);
            }
        });
});

app.get('/tstatthreewayhandshaketime/:nodeid/:ifaceid/:timestamp/:mintimestamp/:resolution', function (req, res) {
    console.log("TSTAT-THREEWAYHANDSHAKETIME:", req.params.nodeid, req.params.ifaceid, req.params.timestamp, "[", new Date(parseInt(req.params.timestamp, 10)), "]",
                req.params.mintimestamp, "[", new Date(parseInt(req.params.mintimestamp, 10)), "]", req.params.resolution);
    // prepared query to the CASSANDRA-DB (the timestamps are stored in milli-secs, no need to convert!)
    var table = 'monroe_exp_tstat_tcp_complete',
        query = 'SELECT first, s_first_ack, c_first FROM ' + table + ' WHERE nodeid = ? AND iccid = ? AND s_ip = ? AND first <= ? AND first >= ? AND c_first > 0 AND s_first_ack > 0 ORDER BY first DESC LIMIT ? ALLOW FILTERING',
        sip = '193.10.227.25';

    cassclient.execute(query, [req.params.nodeid, req.params.ifaceid, sip, req.params.timestamp, req.params.mintimestamp, req.params.resolution],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("TSTAT-THREEWAYHANDSHAKETIME(", req.params.nodeid, ":", req.params.ifaceid, ") data", JSON.stringify(data));
                var i, len, info = [], value;
                for (i = 0, len = data.rows.length; i < len; i += 1) {
                    value = data.rows[i].s_first_ack - data.rows[i].c_first;
                    if (value > 0) {
                        info.unshift([Math.floor(data.rows[i].first), value]);
                    }
                }
                res.json(info);
            }
        });
});

app.get('/tstattimetolive/:nodeid/:ifaceid/:timestamp/:mintimestamp/:resolution', function (req, res) {
    console.log("TSTAT-TIMETOLIVE:", req.params.nodeid, req.params.ifaceid, req.params.timestamp, "[", new Date(parseInt(req.params.timestamp, 10)), "]",
                req.params.mintimestamp, "[", new Date(parseInt(req.params.mintimestamp, 10)), "]", req.params.resolution);
    // prepared query to the CASSANDRA-DB (the timestamps are stored in milli-secs, no need to convert!)
    var table = 'monroe_exp_tstat_tcp_complete',
        query = 'SELECT first, s_ttl_min FROM ' + table + ' WHERE nodeid = ? AND iccid = ? AND s_ip = ? AND first <= ? AND first >= ? AND s_ttl_min > 0 ORDER BY first DESC LIMIT ? ALLOW FILTERING',
        sip = '193.10.227.25';

    cassclient.execute(query, [req.params.nodeid, req.params.ifaceid, sip, req.params.timestamp, req.params.mintimestamp, req.params.resolution],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("TSTAT-TIMETOLIVE(", req.params.nodeid, ":", req.params.ifaceid, ") data", JSON.stringify(data));
                var i, len, info = [];
                for (i = 0, len = data.rows.length; i < len; i += 1) {
                    info.unshift([Math.floor(data.rows[i].first), Math.floor(data.rows[i].s_ttl_min)]);
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
        query = 'SELECT longitude, latitude, timestamp FROM ' + table + ' WHERE nodeid = ? AND timestamp <= ? AND timestamp >= ? ORDER BY timestamp DESC LIMIT ?';

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
                        info.current.timestamp = Math.floor(data.rows[i].timestamp * 1000);
                    }
                }
                res.json(info);
            }
        });
});

app.get('/events/:nodeid/:timestamp/:mintimestamp/:resolution', function (req, res) {
    console.log("EVENTS:", req.params.nodeid, req.params.timestamp, "[", new Date(parseInt(req.params.timestamp, 10)), "]",
                req.params.mintimestamp, "[", new Date(parseInt(req.params.mintimestamp, 10)), "]", req.params.resolution);
    // prepared query to the CASSANDRA-DB (the timestamps are stored in secs!)
    var threshold = Math.floor(req.params.timestamp / 1000),
        minthreshold = Math.floor(req.params.mintimestamp / 1000),
        table = 'monroe_meta_node_event',
        query = 'SELECT timestamp, eventtype, message FROM ' + table + ' WHERE nodeid = ? AND timestamp <= ? AND timestamp >= ? ORDER BY timestamp DESC LIMIT ?';

    cassclient.execute(query, [req.params.nodeid, threshold, minthreshold, req.params.resolution],
                       {prepare: true}, function (err, data) {
            if (err) {
                console.log("Error:", err.message);
                res.status(500).send(err.message);
            } else {
                console.log("EVENTS(", req.params.nodeid, ") data", JSON.stringify(data));
                res.json(data.rows);
            }
        });
});

app.listen(port, address, function () {
    console.log('Express-server listening on ' + address + ':' + port);
});
