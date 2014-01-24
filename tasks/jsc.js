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
var Path = require('path');
var vm = require('vm');
var util = require('util');

module.exports = function(grunt) {
	var wrapBefore = grunt.file.read('./tasks/seajs.before.wrap');
	var base;

	var getJSOutputName = function(path){
		//replace src* with index.js
		return path.replace(/(src\/?.*)$/,'index.js');
	}

	var getIndexName = function(path){
		//replace src* with index and remove base
		path = path.replace(/(src\/?.*)/,'index').replace(base,'').replace('.js','');
		if(path.charAt(0) == '/'){
			path = path.substring(1);
		}
		return path;
	}

	var getFileExt = function(file){
		var idx = file.lastIndexOf('.');
		if(idx<0) return;
		var ret = {
			name: file.substring(0,idx),
			ext: file.substring(idx+1)
		}
		return ret;
	}

	var replaceString = function(str, begin, end, replacement) {
		return str.substr(0, begin) + replacement + str.substr(end);
	}

	var processConfig = function(abs){
		var content = grunt.file.read(abs);
		var ret = null;
		var context = {
			define: function(factory){
				ret = factory();
			}
		}
		vm.runInNewContext(content, context);
		return ret;
	}

	var processJSFile = function(abs,file){
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
			content: toplevel.print_to_string({ beautify: true})  //comments: false
		}
	}

	//process single js file, add dependencies and module name
	var buildSingleJSFile = function(abs, file){
		var _file = getFileExt(file);
		if(_file.ext != 'js'){
			return;
		}
		var content = grunt.file.read(abs)
		var toplevel = uglify.parse(content);
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
			return;
		}
		var start = def.start.pos;
		//fix start position
		while(content.charAt(start) != 'd'){
			start++;
		}
		var end = content.indexOf('\r\n',start+6);
		if(end < start){
			return;
		}
		var newDef = 'define({0},{1},function(require,exports,module){';
		newDef = newDef.replace('{0}','\''+getIndexName(abs)+'\'').replace('{1}',JSON.stringify(req));
		content = replaceString(content, start, end, newDef);  //just replace one line
		grunt.file.write(abs,content);
	}

	var buildTplFile = function(abs, file){


	}

	//walk through directory, build each js and tpl
	var build = function(path){
		var cacheJS = [];
		var cacheTpl = [];
		var req = {};
		var fileJS = [];
		var fileTpl = [];
		var hasConfig = false;
		try{
			//get all files in path
			grunt.file.recurse(path, function(abs,rootdir,subdir,file){
				var _file = getFileExt(file);
				if(_file.name == '_config'){
					hasConfig = true;
				}else if(_file.ext == 'js'){
					fileJS.push(file);

				}else if(_file.ext == 'html' || _file.ext == 'htm'){
					fileTpl.push(file);
				}
			});
			//parse config and apply filter

			if(hasConfig){
				var abs = Path.resolve(path+'/_config.js');
				var conf = processConfig(abs);
				if(conf.js && conf.js.sort){
					fileJS = conf.js.sort(fileJS);
				}
			}
			for(var i=0;i<fileJS.length;i++){
				var _file = getFileExt(fileJS[i]);
				var ret = processJSFile(path+'/'+fileJS[i],_file.name);
				cacheJS.push(ret.content);
				for(var j=0;i<ret.req.length;j++){
					req[ret.req[j]] = true;
				}
			}
			var before = wrapBefore;
			before = before.replace('{0}','\''+getIndexName(path)+'\'').replace('{1}',JSON.stringify(Object.keys(req)));
			cacheJS.unshift(before);
			var content = cacheJS.join('\r\n\r\n');
			grunt.file.write(getJSOutputName(path),content);
		}catch(e){
			grunt.log.write(e);
		}

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
				build(path);
			}else if(isDir){
				walkDir(path);
			}else{
				buildSingleJSFile(path, item);
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
