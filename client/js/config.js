Array.prototype.findObjectByProp = function _findObjectByProp (prop, value) {
	for(var i = 0; i<this.length; i++){
		if (this[i][prop] == value){
			this[i].found_index = i;
			return this[i];
		}
	}
	return null;
};

var config = {
	api: {
		endpoint: "http://92.222.5.101/picacoin"
	}
}