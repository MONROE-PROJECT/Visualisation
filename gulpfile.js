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

/*========================================
=            Requiring stuffs            =
========================================*/
var gulp           = require('gulp'),
    seq            = require('run-sequence'),
    //connect        = require('gulp-connect'),
    less           = require('gulp-less'),
    uglify         = require('gulp-uglify'),
    sourcemaps     = require('gulp-sourcemaps'),
    cssmin         = require('gulp-cssmin'),
    order          = require('gulp-order'),
    concat         = require('gulp-concat'),
    ignore         = require('gulp-ignore'),
    del            = require('del'),
    imagemin       = require('gulp-imagemin'),
    pngcrush       = require('imagemin-pngcrush'),
    templateCache  = require('gulp-angular-templatecache'),
    mobilizer      = require('gulp-mobilizer'),
    ngAnnotate     = require('gulp-ng-annotate'),
    replace        = require('gulp-replace'),
    ngFilesort     = require('gulp-angular-filesort'),
    streamqueue    = require('streamqueue'),
    rename         = require('gulp-rename'),
    path           = require('path'),
    spawn          = require('child_process').spawn,
    gutil          = require('gulp-util'),
    merge2         = require('merge2');


/*=====================================
=        Default Configuration        =
=====================================*/
// Please use config.js to override these selectively:
var config = {
    dest: 'target/gulp',
    minify_js: true,
    generate_sourcemaps: true,
    minify_images: true,
    uglify: true,
    connect: true,

    mvis: {
        ngApp: 'mvisApp',

        js: [
            './src/main/web_deps/WebGLEarth/api.js',
            './bower_components/jquery/dist/jquery.js',
            './bower_components/angular/angular.js',
            './bower_components/angular-cookies/angular-cookies.js',
            './bower_components/angular-resource/angular-resource.js',
            './bower_components/angular-ui-router/release/angular-ui-router.js',
            './bower_components/angular-bootstrap/ui-bootstrap.js',
            './bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
            './bower_components/ng-table/dist/ng-table.js',
            './bower_components/ngstorage/ngStorage.js',
            './bower_components/bootstrap/dist/js/bootstrap.js',
            './bower_components/angular-ui-select/dist/select.js',
            './bower_components/angular-sanitize/angular-sanitize.js',
            './bower_components/underscore/underscore.js',
            './bower_components/highstock/highstock.js',
            './bower_components/highstock/highcharts-more.js',
            './src/main/web_deps/timepickerpop/timepickerpop.js'
        ],

        fonts: [
            './bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.*'
        ],

        html: [],

        css: [
            './bower_components/angular-ui-select/dist/select.css',
            './bower_components/select2/select2.css',
            './bower_components/select2/select2.png',
            './bower_components/ng-table/dist/ng-table.min.css'
        ]
    }
};

if (require('fs').existsSync('./config.js')) {
    var configFn = require('./config');
    configFn(config);
}


/*================================================
=            Manage multiple web apps            =
================================================*/
function pipeForEachApp(callback) {
    var i, stream,
        streams = [], apps = ['mvis'];

    for (i = 0; i < apps.length; i += 1) {
        stream = callback(apps[i]);
        if (stream !== null) {
            streams.push(stream);
        }
    }
    return merge2(streams);
}


/*================================================
=            Report Errors to Console            =
================================================*/
gulp.on('err', function (e) {
    console.log(e.err.stack);
});


/*=========================================
=            Clean dest folder            =
=========================================*/
gulp.task('clean', function (cb) {
    del([ config.dest ], cb);
});


/*==========================================
=            Start the web server            =
==========================================*/
gulp.task('connect', function () {
    var server = spawn('node', ['./src/main/server/app.js'], {
        stdio: 'inherit'
    });
    server.unref();
    console.log('started express server: pid=', server.pid);
});


/*==========================================
 * =            Stop the web server            =
 * ==========================================*/
gulp.task('stop', function () {
    spawn('pkill', ['node']);
    console.log('server stopped.');
});


/*=====================================
=            Minify images            =
=====================================*/
gulp.task('images', function () {
    return pipeForEachApp(function (app) {
        var stream = gulp.src('src/main/' + app + '/web/static/img/**/*');

        if (config.minify_images) {
            stream = stream.pipe(imagemin({
                progressive: true,
                svgoPlugins: [{removeViewBox: false}],
                use: [pngcrush()]
            }));
        }
        return stream.pipe(gulp.dest(path.join(config.dest, app, 'static/img')));
    });
});


/*==================================
=            Copy fonts            =
==================================*/
gulp.task('fonts', function () {
    return pipeForEachApp(function (app) {
        return gulp.src(config[app].fonts)
            .pipe(gulp.dest(path.join(config.dest, app, 'static/fonts')));
    });
});


/*=================================================
=            Copy html files to dest              =
=================================================*/
gulp.task('html', function () {
    return pipeForEachApp(function (app) {
        if (config[app].html === undefined) {
            return null;
        }
        return gulp.src(config[app].html)
            .pipe(gulp.dest(path.join(config.dest, app)));
    });
    // TODO: angular i18n
});


/*======================================================================
=            Compile, minify, mobilize less                            =
======================================================================*/
gulp.task('less', function () {
    return pipeForEachApp(function (app) {
        var prefix = './src/main/' + app + '/less/';
        return gulp.src([prefix + 'app.less', prefix + 'signin.css'])
            .pipe(less({
                paths: [
                    path.resolve(__dirname, 'src/main/' + app + '/less'),
                    path.resolve(__dirname, 'bower_components')
                ]
            }))
            .pipe(mobilizer('app.css', {
                'app.css': {
                    hover: 'exclude'
                    //screens: ['0px']
                },
                'hover.css': {
                    hover: 'only'
                    //screens: ['0px']
                }
            }))
            .pipe(config.uglify ? cssmin() : gutil.noop())
            .pipe(rename({suffix: '.min'}))
            .pipe(gulp.dest(path.join(config.dest, app, 'static/css')));
    });
});


gulp.task('css', function () {
    return pipeForEachApp(function (app) {
        var i;
        if (config[app].css === undefined) {
            console.log("css - nothing to do?");
        } else {
            for (i = 0; i < config[app].css.length; i += 1) {
                gulp.src([config[app].css[i]])
                    .pipe(config.uglify ? cssmin() : gutil.noop())
                    .pipe(gulp.dest(path.join(config.dest, app, 'static/css')));
            }
        }
        return null;
    });
});

/*====================================================================
=            Compile and minify js generating source maps            =
====================================================================*/
// - Orders ng deps automatically
// - Precompile templates to ng templateCache
gulp.task('js', function () {
    return pipeForEachApp(function (app) {
        if (config[app].ngApp === undefined) {
            return null;
        }
        return streamqueue({ objectMode: true },
            gulp.src(config[app].js),
            gulp.src('./src/main/' + app + '/js/**/*.js').pipe(ngFilesort()),
            gulp.src([
                './src/main/' + app + '/template/**/*.html'
            ]).pipe(templateCache({
                module: config[app].ngApp,
                root: 'template/'
            })))
            .pipe(sourcemaps.init())
            .pipe(concat('app.js'))
            .pipe(ngAnnotate())
            .pipe(config.minify_js ? uglify() : gutil.noop())
            .pipe(rename({suffix: '.min'}))
            .pipe(config.generate_sourcemaps ? sourcemaps.write('.') : gutil.noop())
            .pipe(gulp.dest(path.join(config.dest, app, 'static/js')));
    });
});


/*======================================
=            Build Sequence            =
======================================*/
gulp.task('build', function (done) {
    var tasks = ['html', 'fonts', 'images', 'less', 'css', 'js'];
    seq('clean', tasks, done);
});

gulp.task('run', function (done) {
    seq('stop', 'build', 'connect', done);
});
