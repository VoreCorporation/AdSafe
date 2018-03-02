function get_ip(){
	$.getJSON('//api.ipify.org?format=jsonp&callback=?', function(data) {
  		return data.ip;
	});
}

var Session = Class({
	constructor: function(name) {
		this.name = name;
	},

	data: {
		get: function() {
			return this._data;
		},
		set: function(value) {
			this._data = value;
		}
	},

	days: {
		get: function() {
			return this._days;
		},
		set: function(value) {
			this._days = value;
		}
	},

	create: function() {
		var vm = this;
		var expires = "";
		if (vm.days != undefined) {
			var date = new Date();
			date.setTime(date.getTime() + (vm.days * 24 * 60 * 60 * 1000));
			expires = "; expires=" + date.toUTCString();
		}
		document.cookie = vm.name + "=" + vm.data + expires + "; path=/";
	},

	check: function(){
		var vm = this;
		var nameEQ = vm.name + "=";
    	var ca = document.cookie.split(';');
    	for (var i = 0; i < ca.length; i++) {
    		    var c = ca[i];
    		    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
     			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    	}
    	return null;
	},

	clear: function(){
		var vm = this;

		vm.data = "";
		vm.days = -1;
		vm.create();
		window.location = '/';
	}
});

var Auth = Class({
	constructor: function(client, auth) {
		this.client = client;
		this.auth = auth;
	},

	member: function() {
		var ip = get_ip();
		var vm = this;

		var auth_hash = md5(vm.client + "_" + ip),
			current_session = vm.auth;
		if (current_session == auth_hash) {
			return true;
		} else {
			window.location = "/p/login.html"
		}

	},

	public: function() {
		var ip = get_ip();
		var vm = this;

		var auth_hash = md5(vm.client + "_" + ip),
			current_session = vm.auth;
		if (current_session == auth_hash) {
			window.location = "/"
		} else {
			return true
		}
	}
});