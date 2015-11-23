// recognizing of ticket callback

if(getUrlVars()['ticket']){
	var options = {
		url: config.api.endpoint + "/cas_auth",
		method: "POST",
		callback: authenticate,
		data : {
			ticket: getUrlVars()['ticket'],
			service: config.cas.service
		}
	};

	console.log("Sending CAS LOGIN Request");
	AJAXCall(options);

	// window.location = cas_url;
}

function authenticate (data) {
	console.log("Entered authenticate");
	data = JSON.parse(data);
	console.log(data);

	if(!data["cas:serviceResponse"] || data["cas:serviceResponse"]["cas:authenticationFailure"]){
		Materialize.toast("Error with CAS auth: " + data["cas:serviceResponse"]["cas:authenticationFailure"]["$content"], config.toast_duration);
		config.cas.loggedIn = false;
		config.cas.loggedUser ="";
		if(data["cas:serviceResponse"]["cas:authenticationFailure"]["code"] == "INVALID_TICKET"){
			window.location = config.cas.service;
		}
		return;
	}
	


	config.cas.loggedUser = data["cas:serviceResponse"]["cas:authenticationSuccess"]["cas:user"]["$content"];
	config.cas.user_name = data["cas:serviceResponse"]["cas:authenticationSuccess"]["cas:attributes"]["cas:givenName"]["$content"];
	config.cas.user_lname = data["cas:serviceResponse"]["cas:authenticationSuccess"]["cas:attributes"]["cas:sn"]["$content"];
	config.cas.loggedIn = true;


	var options = {
		url: config.api.endpoint + "/users/" + config.cas.loggedUser,
		method: "GET",
		callback: function (data){
			data = JSON.parse(data);
			console.log("Received data after login: ", data);
			if("error" in data){
				if (data.error.code == 401){
					var data = {
						login: config.cas.loggedUser,
						name : config.cas.user_name,
						last_name : config.cas.user_lname,
						person: {
							sex: null,
							hand: null,
							age: null,
						}
					};

					var options = {
						url: config.api.endpoint + "/users/new",
						data: data,
						method: "POST",
						callback : function(data){
							if("error" in data){
								Materialize.toast("Error with request: " + data.error.message, config.toast_duration);
								return;
							}
							Materialize.toast("User " + data.success.usr_login + " created successfully", config.toast_duration);
						}
					};

					AJAXCall(options);
				}else{
					Materialize.toast("Error with request: " + data.error.message, config.toast_duration);
				}
			}

			document.getElementById("statsTitle").innerHTML += " - " + config.cas.loggedUser;
			Materialize.toast(config.cas.loggedUser + " logged in", config.toast_duration);
			buildCtrls();
		}
	};

	AJAXCall(options);

}



Array.prototype.match = function _matchRegex (regex) {
	var res = [];
	for(var i = 0; i < this.length; i++){
		if(this[i].match(regex)) res.push(this[i]);
	}

	return res;
}

document.getElementById("player_1_n_match").addEventListener("input", function(e){
	if(this.value.length < 3) return;
	var regex = new RegExp(this.value,'g');
	var list = config.autocomplete.match(regex);
	this.placeholder = list[0];
});

document.getElementById("create_n_match_button").addEventListener('click', function (e) {
	var p1 = document.getElementById("player_1_n_match").value;
	if(typeof p1 == undefined || !p1) throwError("Entrez un joueur 1 svp");
	var p2 = document.getElementById("player_2_n_match").value;
	if(typeof p2 == undefined || !p2) throwError("Entrez un joueur 2 svp");
	var mname = document.getElementById("n_match_name").value || null;


	var rand = parseInt(Math.random()*10000);

	var options = {
		data :{
			player1: p1,
			player2: p2,
			m_name: mname
		},
		method: "POST",
		url: config.api.endpoint + "/matches/new"+"?rand="+rand,
		callback: function(data){
			data = JSON.parse(data);
			if("error" in data || !data) throwError("Error while creating new Match:" + data.error.message);
			if("success" in data) Materialize.toast("Match #" +data.success.match_id +": " + data.success.match_name + " created successfully!", config.toast_duration);
		}
	};

	AJAXCall(options);
});

document.getElementById("showMatchCreation").addEventListener('click', function(e){
	if(!config.cas.loggedIn){
		e.preventDefault();
		Materialize.toast("Please log in before creating new matches", config.toast_duration);
		return;
	}

	var player1input = document.getElementById("player_1_n_match");
	player1input.value = config.cas.loggedUser;
	player1input.disabled = true;
	player1input.placeholder = "";
});

document.getElementById("showStats").addEventListener('click', function(){
	buildCtrls();
});

document.getElementById("player_2_n_match").addEventListener("input", function(e){
	if(this.value.length < 3) return;
	var regex = new RegExp(this.value,'g');
	var list = config.autocomplete.match(regex);
	this.placeholder = list[0];
});

document.getElementById("loginCAS").addEventListener('click', function(e){
	var cas_url = config.cas.url + "/login?service=" + config.cas.service;
	// var cas_url = config.cas.url + "/login?service=" + "http://jocolina.com";

	window.location = cas_url;
});

function getUrlVars() {
	var vars = {};
	
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value;
	});
	
	return vars;
}


function getAutocomplete () {
	var options = {
		url: config.api.endpoint + "/autocomplete",
		method: "GET",
		callback: setAutocomplete
	};

	AJAXCall(options);
}

function setAutocomplete (data) {
	data = JSON.parse(data);
	// console.log("setAutocomplete: ", data);
	for(var i = 0; i < data.length; i++){
		config.autocomplete.push(data[i]);
	}
}





function throwError (error) {
	Materialize.toast(error, 4000);
	throw new Error(error);
	// display error toast
}


function buildCtrls() {
	if(!config.cas.loggedIn || config.cas.loggedUser == "") return;
	// config.cas.loggedUser = "colinajo"; // debug
	// config.cas.loggedIn = true;

	var rand = parseInt(Math.random() * 100000);

	var options = {
		url: config.api.endpoint + "/users/" + config.cas.loggedUser + "/current?rand=" + rand,
		method: "GET",
		callback: function(data){
			data = JSON.parse(data);
			// console.log("BuildCtrls LOG: ", data);
			var container = document.querySelector("#statsModal div.modal-content");
			container.innerHTML = "<h4 id=\"statsTitle\">Statistiques - "+config.cas.loggedUser+"</h4>\n<h5>Mes matchs en cours</h5>";
			if(!data.matches) {
				Materialize.toast("No matches for player " + config.cas.loggedUser, config.toast_duration);
				return;
			}

			for(var i = 0; i < data.matches.length; i++){
				var div = document.createElement("div");
				div.className = "row";;
				container.appendChild(div);

				var match_title = document.createElement("span");
				match_title.className = "match_title";
				match_title.innerHTML = data.matches[i].name;
					div.appendChild(match_title);
					// div.innerHTML += "\n";

				var buttPlusOne = document.createElement("a");
				buttPlusOne.id = "plusone_" + data.matches[i].id;
				buttPlusOne.className = "btn-large waves-light waves-effect stats-button";
				buttPlusOne.innerHTML = "+1";
					div.appendChild(buttPlusOne);
					// div.innerHTML += "\n";

				buttPlusOne.addEventListener("click", (function (index){
					var f = function _buttPlusOne (event){
						event.preventDefault();
						console.log("+1 clicked for ", data.matches[index].name);
						var options = {
							url: config.api.endpoint + "/match/" + data.matches[index].id + "/points",
							data: {
								player: config.cas.loggedUser,
								points: 1
							},
							method: "POST",
							callback : function(data){
								data = JSON.parse(data);
								if("error" in data) {
									Materialize.toast(data.error.message, config.toast_duration);
									return;
								}
								Materialize.toast(data.success.message, config.toast_duration);

							}
						};

						AJAXCall(options);
					};
					// console.log("added: ", f, "to:", buttPlusOne);
					return f;
				})(i)
				);

				var buttPlusTwo = document.createElement("a");
				buttPlusTwo.id = "plustwo_" + data.matches[i].id;
				buttPlusTwo.className = "btn-large waves-light waves-effect stats-button";
				buttPlusTwo.innerHTML = "+2";
					div.appendChild(buttPlusTwo);
					// div.innerHTML += "\n";
				buttPlusTwo.addEventListener("click", (function(index){
					var f = function _buttPlusTwo (event) {
						var options = {
							url: config.api.endpoint + "/match/" + data.matches[index].id + "/points",
							data: {
								player: config.cas.loggedUser,
								points: 2
							},
							method: "POST",
							callback : function(data){
								data = JSON.parse(data);
								if("error" in data) {
									Materialize.toast(data.error.message, config.toast_duration);
									return;
								}
								Materialize.toast(data.success.message, config.toast_duration);

							}
						};

						AJAXCall(options);
					};
					// console.log("added: ", f, "to:", buttPlusTwo);

					return f;
				})(i)
				);

				var buttMinusOne = document.createElement("a");
				buttMinusOne.id = "minusone_" + data.matches[i].id;
				buttMinusOne.className = "btn-large waves-light waves-effect stats-button";
				buttMinusOne.innerHTML = "-1";
					div.appendChild(buttMinusOne);
					// div.innerHTML += "\n";

				buttMinusOne.addEventListener("click", (function(index){
					var f = function _buttMinusOne (event) {
						event.preventDefault();

						var options = {
							url: config.api.endpoint + "/match/" + data.matches[index].id + "/points",
							data: {
								player: config.cas.loggedUser,
								points: -1
							},
							method: "POST",
							callback : function(data){
								data = JSON.parse(data);
								if("error" in data) {
									Materialize.toast(data.error.message, config.toast_duration);
									return;
								}
								Materialize.toast(data.success.message, config.toast_duration);

							}
						};

						AJAXCall(options);
						
					};
					// console.log("added: ", f, "to:", buttMinusOne);
					return f;
				})(i)
				);


				var buttEnd = document.createElement("a");
				buttEnd.id = "buttend_" + data.matches[i].id;
				buttEnd.className = "btn-large waves-light waves-effect stats-button";
				buttEnd.innerHTML = "FIN";
				buttEnd.addEventListener("click", (function (index){
					var f = function _buttEnd (event){
						event.preventDefault();

						var options = {
							url: config.api.endpoint + "/match/" + data.matches[index].id + "/end",
							method: "GET",
							callback : function(data){
								data = JSON.parse(data);
								if("error" in data) {
									Materialize.toast(data.error.message, config.toast_duration);
									return;
								}
								Materialize.toast(data.success.message, config.toast_duration);

							}
						};

						AJAXCall(options);
					};
					// console.log("added: ", f, "to:", buttEnd);
					return f;
				})(i)
				);

				div.appendChild(buttEnd);
				


			}
		}
	};


	AJAXCall(options);
}

getAutocomplete();