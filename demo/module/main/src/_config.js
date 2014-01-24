define(function (require, exports, module) {

	return {

		dir: '../',

		all: {
			name: 'main.js',
			create: true
		},

		js: {
			create: false,
			sort: function (arr) {
				var modules = ['evtMap.js','inner.js','index.js'];
				return modules;
			}
		},

		tmpl: {
			create: false
		}

	};

});