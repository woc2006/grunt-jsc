//create by grunt-jsc
(function(){
var mods = [],version = parseFloat(seajs.version);
define('module/main/index',[],function(require,exports,module){

	var uri		= module.uri || module.id,
		m		= uri.split('?')[0].match(/^(.+\/)([^\/]*?)(?:\.js)?$/i),
		root	= m && m[1],
		name	= m && ('./' + m[2]),
		i		= 0,
		len		= mods.length,
		curr,args,
		undefined;
	    name = name.replace(/\.r[0-9]{15}/,"");
	//unpack
	for(;i<len;i++){
		args = mods[i];
		if(typeof args[0] === 'string'){
			name === args[0] && ( curr = args[2] );
			args[0] = root + args[0].replace('./','');
			(version > 1.0) &&	define.apply(this,args);
		}
	}
	mods = [];
	require.get = require;
	return typeof curr === 'function' ? curr.apply(this,arguments) : require;
});
define.pack = function(){
	mods.push(arguments);
	(version > 1.0) || define.apply(null,arguments);
};
})();

define.pack("./evtMap", [], function(require, exports, module) {
    return {};
});

define.pack("./inner", [], function(require, exports, module) {
    return {};
});

define.pack("./index", [ "lib/base/index", "widget/debug" ], function(require, exports, module) {
    var base = require("lib/base/index");
    var debug = require("widget/debug");
    var _base = new base();
    _base.print(debug);
});