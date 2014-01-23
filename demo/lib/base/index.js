define.pack("index", [], function(require, exports, module) {
    function Base() {}
    Base.prototype = {
        init: function() {
            this.label = "base library";
            console.log(this.label);
        },
        print: function(str) {
            console.log(str);
        }
    };
    return Base;
});