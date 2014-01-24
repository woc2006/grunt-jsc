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
	var wrapBefore = grunt.file.read('./tasks/seajs.before.wrap');
	var base;

	var getJSOutputName = function(path){
		//replace src* with index.js
		return path.replace(/(src\/?.*)$/,'index.js');
	}

	var getIndexName = function(path){
		//replace src* with index and remove base
		path = path.replace(/(src\/?.*)/,'index').replace(base,'');
		if(path.charAt(0) == '/'){
			path = path.substring(1);
		}
		return path;
	}

	var getFileExt = function(file){
		var idx = file.indexOf('.');
		if(idx<0) return;
		var ret = {
			name: file.substring(0,idx),
			ext: file.substring(idx+1)
		}
		return ret;
	}

	var buildJSFile = function(abs,file){
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
				value: './'+file
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
			def.expression.name = 'define.pack';  //replace define
		}
		return {
			req : req,
			content: toplevel.print_to_string({ beautify: true })
		}
	}

	var build = function(path, parent){
		var result = [];
		var req = {};
		try{
			//get all files in path
			grunt.file.recurse(path, function(abs,rootdir,subdir,file){
				var _file = getFileExt(file);
				if(_file.ext == 'js'){
					var ret = buildJSFile(abs,_file.name);
					result.push(ret.content);
					for(var i=0;i<ret.req.length;i++){
						req[ret.req[i]] = true;
					}
				}
			})
		}catch(e){
			grunt.log.write(e);
		}
		var before = wrapBefore;
		before = before.replace('{0}','\''+getIndexName(path)+'\'').replace('{1}',JSON.stringify(Object.keys(req)));
		result.unshift(before);
		var content = result.join('\r\n\r\n');
		grunt.file.write(getJSOutputName(path),content);
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
		var options = this.options({
			punctuation: '.',
			separator: ', '
		});
		var path = options.path;
		base = options.base;
		if(!path.length || !base){
			grunt.log.writeln('path no found');
			return;
		}
		for(var i=0;i<path.length;i++){
			walkDir(path[i]);
		}
	});

};
