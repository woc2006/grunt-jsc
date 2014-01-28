var level = {
	0:'Info',
	1:'Warn',
	2:'Error'
}
var tpl = '[{0}] {1} @ {2}';

var format = function(str,arr){
	str = str.replace(/({(\d)})/g,function($0,$1,$2,$3){
		return arr[$2] || '';
	})
	return str;
}

exports.log = function(str, lv){
	lv = lv || 0;
	var now = new Date();
	if(typeof str == 'object'){
		str = JSON.stringify(str);
	}
	var _tpl = format(tpl,[level[lv],str,now.toString()]);
	console.log(_tpl);
}

exports.logs = function(str,params,lv){
	exports.log(format(str,params),lv);
}