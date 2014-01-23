define.pack("evtMap", [], function(require, exports, module) {
    return {};
});
define.pack("index", [ "lib/base/index", "widget/debug" ], function(require, exports, module) {
    var base = require("lib/base/index");
    var debug = require("widget/debug");
    var _base = new base();
    _base.print(debug);
});