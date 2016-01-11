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
/*jslint node:true */
module.exports = function (config) {
    'use strict';
    // Output directory
    //config.dest = 'target/gulp';

    config.minify_js = false;
    config.generate_sourcemaps = false;
    config.uglify = false;

    // Images minification
    config.minify_images = true;

    // Development web server
    config.connect = false;
};