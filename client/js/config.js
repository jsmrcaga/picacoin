Array.prototype.findObjectByProp = function _findObjectByProp (prop, value) {
	for(var i = 0; i<this.length; i++){
		if (this[i][prop] == value){
			this[i].found_index = i;
			return this[i];
		}
	}
	return null;
};

Array.prototype.findObjectsByProp = function _findObjectsByProp (prop, value) {
	var objs = [];
	for(var i = 0; i<this.length; i++){
		if (this[i][prop] == value){
			this[i].found_index = i;
			objs.push(this[i]);
		}	
	}
	return objs;
};

var config = {
	api: {
		endpoint: "http://92.222.5.101:9090/picacoin"
	},

	cas:{
		url: "https://cas.utc.fr/cas/",
		service: window.location.origin + window.location.pathname,
		loggedIn: false,
		loggedUser : null,
		user_name: null,
		user_lname: null
	},

	autocomplete: []
}