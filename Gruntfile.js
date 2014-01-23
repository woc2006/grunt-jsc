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
			path:'./demo'
		}

	});

	// Actually load this plugin's task(s).
	grunt.loadTasks('tasks');

	// These plugins provide necessary tasks.

	// Whenever the "test" task is run, first clean the "tmp" dir, then run this
	// plugin's task(s), then test the result.
	//grunt.registerTask('jsc');

	// By default, lint and run all tests.
	grunt.registerTask('default', ['jsc']);

};
