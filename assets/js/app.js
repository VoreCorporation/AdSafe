function get_ip(){
	$.getJSON('//api.ipify.org?format=jsonp&callback=?', function(data) {
  		return data.ip;
	});
}

// A simple authentication application written in HTML
// Copyright (C) 2012 Gerard Braad
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// Originally based on the JavaScript implementation as provided by Russell Sayers on his Tin Isles blog:
// http://blog.tinisles.com/2011/10/google-authenticator-one-time-password-algorithm-in-javascript/

function dec2hex(s) {
    return (s < 15.5 ? '0' : '') + Math.round(s).toString(16);
}

function hex2dec(s) {
    return parseInt(s, 16);
}

function base32tohex(base32) {
    var base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    var bits = "";
    var hex = "";

    for (var i = 0; i < base32.length; i++) {
        var val = base32chars.indexOf(base32.charAt(i).toUpperCase());
        bits += leftpad(val.toString(2), 5, '0');
    }

    for (var i = 0; i + 4 <= bits.length; i += 4) {
        var chunk = bits.substr(i, 4);
        hex = hex + parseInt(chunk, 2).toString(16);
    }
    return hex;

}

function leftpad(str, len, pad) {
    if (len + 1 >= str.length) {
        str = Array(len + 1 - str.length).join(pad) + str;
    }
    return str;
}

function checkOtp(account, secretkey) {

    var key = base32tohex(secretkey);
    var epoch = Math.round(new Date().getTime() / 1000.0);
    var time = leftpad(dec2hex(Math.floor(epoch / 30)), 16, '0');

    // updated for jsSHA v2.0.0 - http://caligatio.github.io/jsSHA/
    var shaObj = new jsSHA("SHA-1", "HEX");
    shaObj.setHMACKey(key, "HEX");
    shaObj.update(time);
    var hmac = shaObj.getHMAC("HEX");

    var offset = 0;
    if (hmac !== 'KEY MUST BE IN BYTE INCREMENTS') {
       offset = hex2dec(hmac.substring(hmac.length - 1));
    }

    var qrcode = "https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=200x200&chld=M|0&cht=qr&chl=otpauth://totp/" + account + "%3Fsecret%3D" + secretkey;
    var otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec('7fffffff')) + '';
    otp = (otp).substr(otp.length - 6, 6);

    var twofactor = [
        {"qrcode":qrcode, "otpcode":otp}
    ];
    return twofactor;
}

var Twofactor = Class({
	constructor: function(account, secretkey) {
		this.account = account;
		this.secretkey = secretkey;
	},

	getotp: function() {
		return checkOtp(this.account, this.secretkey)[0].otpcode;
	},

	getqr: function() {
		return checkOtp(this.account, this.secretkey)[0].qrcode;
	},
});

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

var Parameter = Class({
	constructor: function(param){
		this.param = param;
	},

	get: function() {
		var params = window.location.search.substr(1).split('&');

        for (var i = 0; i < params.length; i++) {
            var p = params[i].split('=');
            if (p[0] == this.param) {
            	return decodeURIComponent(p[1]);
            }
        }
        return false;
	}
});

var BtnStatus = Class ({
	constructor: function(btn, htmldefault, htmldisabled){
		this.btn = btn;
		this.htmldefault = htmldefault;
		this.htmldisabled = htmldisabled;
	},

	btndefault: function(){
		$(this.btn).html(this.htmldefault);
		$(this.btn).removeAttr("disabled");
		$(this.btn).removeClass("disabled");
	},

	btndisabled: function(){
		$(this.btn).html(this.htmldisabled);
		$(this.btn).attr("disabled", "disabled");
		$(this.btn).addClass("disabled");
	}
});