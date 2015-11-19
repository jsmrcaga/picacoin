function AJAXCall (params){
	//params = url, method, callback, data, async, debug
	if (typeof params == 'undefined'){
		throw new Error("Parameters are required");
	}

	if(typeof params.debug == 'undefined' || params.debug == null) params.debug = false; 

	if (typeof params.url == 'undefined'){
		throw new Error("URL is required for AJAXCall");
	}

	if (typeof params.method == 'undefined' || (params.method != "GET" && params.method != "POST" && params.method != "DELETE" && params.method != "PUT")){
		throw new Error("method for AJAXCall is required and must be GET, POST, DELETE or PUT only");
	}

	var xml = new XMLHttpRequest();
	xml.onreadystatechange = function(){
		if (xml.readyState == 4 && xml.status == 200){
			if (typeof params.callback != 'undefined') params.callback(xml.responseText);
			return xml.responseText;
		}else{
			if(params.debug) console.log("XMl Error: readyState: ", xml.readyState, " status:", xml.status);
		}
	};

	var async;
	if (typeof params.async != 'undefined'){
		async = params.async;
	}else{
		async = true;
	}

	if (params.method == "GET" || params.method == "DELETE"){

		if (typeof params.data == 'undefined'){
			xml.open(params.method, params.url, async);
			xml.setRequestHeader("Content-Type", params.app || "application/json");
			xml.send();
		}else{
			var url = (params.url.substring(params.url.length-1, params.url.length) == "/")? "?" : "/?";
			for (var key in params.data){
				url += key + "=" + params.data[key] + "&";
			}
			url = url.substring(0,url.length-1);
			params.url += url;
			xml.open(params.method, params.url, async);
			xml.setRequestHeader("Content-Type", params.app || "application/json");
			xml.send();
		}

	}else if(params.method == "POST" || params.method == "PUT"){
		xml.open(params.method, params.url, async);
		xml.setRequestHeader("Content-Type", params.app || "application/json");
		if (typeof params.data != 'undefined'){
			xml.send(JSON.stringify(params.data));
		}else{
			xml.send();
		}
	}
}