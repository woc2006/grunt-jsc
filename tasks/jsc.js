/*
 * grunt-jsc
 * https://github.com/woc2006/grunt-jsc
 *
 * Copyright (c) 2014 dolly
 * Licensed under the MIT license.
 */

'use strict';
var uglify = require('uglify-js');
var fs = require('fs');
var path = require('path');

module.exports = function(grunt) {
	var filterReg = /\.(js|html|htm)$/;

	var getIndexName = function(path){
		//把src后面部分换成index.js
		return path.replace(/(src\/?.*)$/,'index.js');
	}

	var build = function(path, parent){
		var result = [];
		try{
			//get all files in path
			grunt.file.recurse(path, function(abs,rootdir,subdir,file){
				if(!filterReg.exec(file)){
					return;
				}

				var toplevel = uglify.parse(grunt.file.read(abs));
				var req = [];
				var def = null;
				toplevel.walk(new uglify.TreeWalker(function(node){
					if(node instanceof uglify.AST_Call){
						if(node.expression.name == 'require'){
							req.push(node.args[0].value);
						}else if(node.expression.name == 'define'){
							def = node;
						}
					}
				}));
				if(!def){
					grunt.log.writeln('wrong in '+path);
				}else{
					var defFun = null;
					for(var i=0;i<def.args.length;i++){
						if(def.args[i] instanceof  uglify.AST_Function){
							defFun = def.args[i];
							break;
						}
					}
					def.args = [];
					def.args.push(new uglify.AST_String({
						value: file.substring(file, file.indexOf('.'))
					}));
					var _req = [];
					for(var i=0;i<req.length;i++){
						_req.push(new uglify.AST_String({
							value: req[i]
						}))
					}
					def.args.push(new uglify.AST_Array({
						elements: _req
					}));
					def.args.push(defFun);
					def.expression.name = 'define.pack';  //暴力换名字
				}
				result.push(toplevel.print_to_string({ beautify: true }));
			})
		}catch(e){
			grunt.log.write(e);
		}
		var content = result.join('\r\n');
		grunt.file.write(getIndexName(path),content);
	}

	var walkDir = function(dir) {
		var list = fs.readdirSync(dir);
		if(!list || !list.length){
			return;
		}
		for(var i=0;i<list.length;i++){
			var item = list[i];
			var path = dir + '/' + item;
			var isDir = fs.statSync(path).isDirectory();
			if(item == 'src' && isDir){
				//build the target directory
				build(path, dir);
			}else if(isDir){
				walkDir(path);
			}
		}
	}

	grunt.registerMultiTask('jsc', 'grunt version of jsc', function() {
		// Merge task-specific and/or target-specific options with these defaults.
		var options = this.options({
			punctuation: '.',
			separator: ', '
		});

		var path = this.files[0].src[0];
		if(path){
			walkDir(path);
		}else{
			grunt.log.writeln('path not found');
		}
//    // Iterate over all specified file groups.
//    this.files.forEach(function(f) {
//      // Concat specified files.
//      var src = f.src.filter(function(filepath) {
//        // Warn on and remove invalid source files (if nonull was set).
//        if (!grunt.file.exists(filepath)) {
//          grunt.log.warn('Source file "' + filepath + '" not found.');
//          return false;
//        } else {
//          return true;
//        }
//      }).map(function(filepath) {
//        // Read file source.
//        return grunt.file.read(filepath);
//      }).join(grunt.util.normalizelf(options.separator));
//
//      // Handle options.
//      src += options.punctuation;
//
//      // Write the destination file.
//      grunt.file.write(f.dest, src);
//
//      // Print a success message.
//      grunt.log.writeln('File "' + f.dest + '" created.');
//    });
	});

};
