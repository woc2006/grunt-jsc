/*
 * grunt-jsc
 * https://github.com/woc2006/grunt-jsc
 *
 * Copyright (c) 2014 dolly
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		jsc:{
			options:{
				base:'./demo',
				path:['./demo']
			},
			all: true
		}

	});

	// Actually load this plugin's task(s).
	grunt.loadTasks('tasks');

	// By default, lint and run all tests.
	grunt.registerTask('default', ['jsc']);

};
