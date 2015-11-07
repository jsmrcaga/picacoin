function MatchCurrent (m_id, p1, p2) {
	this.id = 0;

	this.player1 = {};
	this.player2 = {};
	this.player1.id = p1.id;
	this.player2.id = p2.id;
	this.player1.name = p1.name;
	this.player2.name = p2.name;

	this.player1.score = 0;
	this.player2.score = 0;

	this.chart = null;

	this.div_id = this.id+"_container";
}

MatchCurrent.prototype.init = function _initMatch () {
	this.getScore();

	this.drawChart();

	setTimeout(function(){
		this.getScore();
	}, 1000);
	this.build();
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
	card_title.className = "card=title pic-card-title";
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
	stats_1.innerHTML = this.player1.name;
	var  stats_2 = document.createElement("a");
	stats_2.innerHTML = this.player2.name;
		card_act.appendChild(stats_a);
		card_act.appendChild(stats_1);
		card_act.appendChild(stats_2);

		card.appendChild(card_act);

	return col;
};

MatchCurrent.prototype.getScore = function _getScoreMatch () {
	var parent = this;

	var params = {
		url: config.api.endpoint + "/match/" + this.id + "/score",
		method:"GET",
		callback: updateChart
	};

	AJAXCall(params);
};

MatchCurrent.prototype.updateChart = function _updateChartCurrent (data) {
	data = JSON.parse(data);
		// treat data

	for(var i = 0; i < data.players.length; i++){
		var p = parent.chart.series.findObjectByProp("id", data.players[i].id).found_index;
		parent.chart.series[p].addPoint(data.players[i].score, true, false);
	}
		
}

MatchCurrent.prototype.drawChart = function _drawChart (argument) {
	var parent = this; 
	this.chart = $(this.div_id).highcharts({
			title:{
				text:'',
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
				name: parent.player1.name,
				data: []
			}, {
				name: parent.player2.name,
				data: [],
				color: "#B22132"
			}],
			chart:{
				backgroundColor: "transparent",
			}
		});
}

function MatchCurrentManager () {
	this.current_matches = [];
}

MatchCurrentManager.prototype.render = function _renderMatches(){
	var container = document.getElementById("current_match");
	for(var i = 0; i < this.current_matches.length; i++){
		var row = document.createElement("div");
		row.className = "row";
		
		var card = this.current_matches[i].build();
		var card2 = this.current_matches[i+1].build();
		
		row.appendChild(card);
		row.appendChild(card2);
		i++; // because we append them 2 by two

		container.appendChild(row);


		card.init();
		card2.init();
	}
};

MatchCurrentManager.prototype.addMatch = function _addMatch (match) {
	this.current_matches.push(match);
};

MatchCurrentManager.prototype.addMatches = function _addMatches (matches) {
	for(var i = 0; i< matches.length; i++){
		this.current_matches.push(matches[i]);
	}
};

MatchCurrentManager.prototype.getCurrent = function _getCurrentMatches() {
	var options = {
		url : config.api.endpoint + "/matches/current",
		method: "GET",
		callback:  this.addMatches
	};

	AJAXCall(options);
};

var matchManager = new MatchCurrentManager();
matchManager.getCurrent();
matchManager.render();