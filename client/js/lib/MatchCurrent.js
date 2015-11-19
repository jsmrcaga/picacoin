function MatchCurrent (m_id, name, p1, p2) {
	var date = new Date();

	this.id = m_id;

	this.first_update = true;

	this.lastUpdated = date.getTime();

	this.name = name;

	this.player1 = {};
	this.player2 = {};
	this.player1.id = p1.id;
	this.player2.id = p2.id;
	// this.player1.name = p1.name;
	// this.player2.name = p2.name;

	this.player1.score = 0;
	this.player2.score = 0;

	this.chart = null;

	this.div_id = this.id+"_container";
}

MatchCurrent.prototype.init = function _initMatch () {
	this.drawChart();
	// console.log("init");
	var parent = this;
	// console.log("Init for: ", this);
	this.getScore();
	setInterval(function(){
		parent.getScore();
	}, 1000);

};

MatchCurrent.prototype.build = function _buildMatch(){
	//render HTML
	var col = document.createElement("div");
	col.className = "col s12 m6";

	var card = document.createElement("div");
	card.className = "card pic-card darken-1";
		col.appendChild(card);

	var card_content = document.createElement("div");
	card_content.className = "card-content white-text";
		card.appendChild(card_content);

	var card_title = document.createElement("span");
	card_title.className = "card-title pic-card-title";
	if(this.name){
		card_title.innerHTML = this.name;
	}else{
		card_title.innerHTML = this.player1.id + " vs " + this.player2.id;
	}
		card_content.appendChild(card_title);

	var match_stat = document.createElement("div");
	match_stat.className = "min-match-stat";
		card_content.appendChild(match_stat);

	var match_graph = document.createElement("div");
	match_graph.id = this.div_id;
		match_stat.appendChild(match_graph);


	var card_act = document.createElement("div");
	card_act.className = "card-action";
	
	var  stats_a = document.createElement("a");
	stats_a.innerHTML = "Stats";
	var  stats_1 = document.createElement("a");
	stats_1.innerHTML = this.player1.id;
	var  stats_2 = document.createElement("a");
	stats_2.innerHTML = this.player2.id;
		card_act.appendChild(stats_a);
		card_act.appendChild(stats_1);
		card_act.appendChild(stats_2);

		card.appendChild(card_act);

	return col;
};


MatchCurrent.prototype.getScore = function _getScoreMatch () {
	var parent = this;
	var rand = parseInt(Math.random()*10000);
	
	var params = {
		url: config.api.endpoint + "/match/" + this.id + "/score" + "?rand=" + rand,
		method:"GET",
		callback: this.updateChart.bind(parent)
	};

	AJAXCall(params);
};

MatchCurrent.prototype.updateChart = function _updateChartCurrent (data) {
	// console.log("Update chart for: ", this );
	data = JSON.parse(data);
	var date = new Date(data.last_point);

	var p1 = {
		name: data.players[0].name,
		score: []
	};
	var p2 = {
		name: data.players[1].name,
		score: []
	};

	if(this.first_update){

		for(var i = 0; i < data.players.length; i++){
			var p = this.chart.series.findObjectByProp("name", data.players[i].name).found_index;

			for(var j = 0; j< data.players[i].history.length; j++){
				var date = new Date(data.players[i].history[j].date);

				var sum = 0;

				//sum of ancient scores
				for(var k = 0; k<j; k++){
					sum+= data.players[i].history[k].number;
				}

				this.chart.series[p].addPoint([Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()), 
											data.players[i].history[j].number + sum]);
			}

		}

		this.first_update = false;
	}

	
	if(this.lastUpdated >= date.getTime()) return;
		// treat data
	for(var i = 0; i < data.players.length; i++){
		if(data.players[i].history.length == 0) continue;

		var sum = 0;
		for(var j = 0; j < data.players[i].history.length; j++){
			sum += data.players[i].history[j].number;
		}

		var date = new Date(data.players[i].history[data.players[i].history.length -1].date);
		var p = this.chart.series.findObjectByProp("name", data.players[i].name).found_index;
		// this.chart.series[p].addPoint(data.players[i].score, true, false);
		this.chart.series[p].addPoint([Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()), sum], true, false);
	}

	this.lastUpdated = date.getTime();
		
}

MatchCurrent.prototype.drawChart = function _drawChart (argument) {
	var parent = this; 
	$("#"+this.div_id).highcharts({
			title:{
				text:'',
			},
			xAxis:{
				type: 'datetime',
				tickInterval : 3600*1000,
				dateTimeLabelFormats:{
					hour: '%H:%M'
				}
			},
			yAxis: {
				title: {
					text: 'Points'
				},
				plotLines: [{
					value: 0,
					width: 1,
					color: '#808080'
				}]
			},
			tooltip: {
				valueSuffix: 'points'
			},
			legend: {
				layout: 'vertical',
				align: 'right',
				verticalAlign: 'middle',
				borderWidth: 0
			},
			series: [{
				name: parent.player1.id,
				data: []
			}, {
				name: parent.player2.id,
				data: [],
				color: "#B22132"
			}],
			chart:{
				backgroundColor: "transparent",
			}
		});
	this.chart = $("#"+this.div_id).highcharts();
	// console.log("Chart:", this.chart);
}


function MatchCurrentManager () {
	this.current_matches = [];
}

MatchCurrentManager.prototype.render = function _renderMatches(){
	var container = document.getElementById("current_match_container");
	for(var i = 0; i < this.current_matches.length; i++){
		var row = document.createElement("div");
		row.className = "row";
		

		var card = this.current_matches[i].build();

		if(this.current_matches[i+1]) var card2 = this.current_matches[i+1].build();

		
		row.appendChild(card);
		if(this.current_matches[i+1]) row.appendChild(card2);

		container.appendChild(row);

		this.current_matches[i].init();
		if(this.current_matches[i+1]) this.current_matches[i+1].init();

		i++; // because we append them 2 by two
	}
};

MatchCurrentManager.prototype.addMatch = function _addMatch (match) {
	this.current_matches.push(match);
};

MatchCurrentManager.prototype.addMatches = function _addMatches (matches) {
	var parent = this;
	matches = JSON.parse(matches);

	for(var i = 0; i< matches.length; i++){
		parent.current_matches.push(new MatchCurrent(matches[i].match_id, matches[i].name, {id:matches[i].player1}, {id:matches[i].player2}));
	}
};

//get current is asyyync!
MatchCurrentManager.prototype.getCurrent = function _getCurrentMatches(callback) {
	var options = {
		url : config.api.endpoint + "/matches/current",
		method: "GET",
		callback:  callback
	};

	AJAXCall(options);
};

var matchManager = new MatchCurrentManager();

matchManager.getCurrent(function (data){
	// console.log(JSON.parse(data));
	matchManager.addMatches(data);
	matchManager.render();
});