var express = require('express');
var app = express();

var bodyParser = require("body-parser");

var mysql = require('mysql');

var config = require('./config.js');

var http = require('https');

var xml = require('xml-js-converter');

var cors = require('cors');
app.use(cors());
app.options('*', cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// database
var connection = mysql.createConnection({
	host: config.db.location,
	user: config.db.username,
	password: config.db.password,
	database: config.db.database
});

function getConnection(){
	// connection.connect();
}

connection.connect();

function noCache(res){
	res.set("Cache-Control", "no-cache, no_store, must-revalidate");
	res.set("Pragma", "no-cache");
	res.set("Expires", "0");
}

function sendErr (err, res) {
	res.json({
		error:{
			code: 100,
			message : "Server error: " + err.message
		}
	});
}


// root
app.get("/picacoin", function (req, res, err) {
	var host = req.get("host");
	res.status(200);
	res.redirect("http://assos.utc.fr/picasso/picacoin");
	res.end();
});

// match

app.get("/picacoin/match/:id", function (req, res, err) {
	var match_id = req.params.id;
	res.redirect("/picacoin/match/"+match_id+"/score");
});

app.get("/picacoin/match/:id/score", function (req, res, err) {
	var match_id = req.params.id;

	getConnection();

	var p1 = null, p2=null;
	var sql = "SELECT `player1`,`player2` FROM `match` WHERE `id`="+connection.escape(match_id);
	connection.query(sql, function(err,results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		p1 = results[0]['player1'];
		p2 = results[0]['player2'];
	});

	sql = "SELECT * FROM `points` WHERE `match_id`=" + connection.escape(match_id) + " ORDER BY `date`";
	connection.query(sql, function (err, results){
		if (err){
			sendErr(err, res);
			throw new Error(err);
		}

		var totP1=0, totP2=0;
		var hp1 = [], hp2 = [];
		var response = {
			match_id: match_id,
			players: [{
						name: p1,
						score: 0,
						history: []
					},
					{
						name: p2,
						score: 0,
						history: []
					}
				],
			points : [],
			last_point : null
		};


		for(var i = 0; i< results.length; i++){
			if(results[i]['user_id'] == p1 && results[i]['number']>0){
				totP1 += results[i]['number'];
				hp1.push({number:results[i]['number'], date: results[i]['date']});
			}else if(results[i]['user_id'] == p2 && results[i]['number']>0){
				totP2 += results[i]['number'];
				hp2.push({number:results[i]['number'], date: results[i]['date']});
			}

			response.points.push({
				date: results[i]['date'],
				number: results[i]['number'],
				player: results[i]['user_id']
			});


			if(i == results.length -1) response.last_point = results[results.length -1]['date'];
		}

		response.players[0].score = totP1;
		response.players[1].score = totP2;
		response.players[0].history = hp1;
		response.players[1].history = hp2;

		noCache(res);
		
		res.json(response);
		res.end();
	});
});


app.get("/picacoin/match/:id/end", function (req, res, err){
	var match_id = req.params.id;

	getConnection();

	var sql = "UPDATE `match` SET `in_course`=0,end_date=NOW() WHERE `id`=" + connection.escape(match_id);

	connection.query(sql, function (err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		res.json({
			success:{
				match_id: match_id,
				message: "Match ended successfully"
			}
		});
	});
});
// matches

app.get("/picacoin/matches/stats", function (req, res, err) {
	
});

app.get("/picacoin/matches/current", function (req, res, err) {
	getConnection();
	var sql = "SELECT `id`,`name`,`player1`,`player2` FROM `match`WHERE `in_course`=1";
	connection.query(sql, function(err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		var resp = [];
		for(var i = 0; i< results.length; i++){
			resp.push({
				match_id: results[i]['id'],
				name: results[i]['name'],
				player1: results[i]['player1'],
				player2: results[i]['player2']
			});
		}

		noCache(res);

		res.json(resp);
		res.end();

	});
});

// users

app.get("/picacoin/users/:user", function (req, res, err) {
	var user_id = req.params.user;

	getConnection();

	var sql = "SELECT * from `users` WHERE `login` = " + connection.escape(user_id);
	connection.query(sql, function (err, results, fields){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		if(results.length == 0){
			res.json({
				error:{
					code: 401,
					message: "User "+user_id+" does not exist"
				}
			});

			return;	
		}
		
		if(results.length > 1 ){
			res.json({
				error:{
					code: 402,
					message: "More than 1 user found with same login: " + user_id
				}
			});
		}

		noCache(res);

		res.json({
			login: results[0]['login'],
			id: results[0]['id'],
			name: results[0]['name'],
			last_name: results[0]['last_name'],
			person:{
				sex: results[0]['sex'],
				hand: results[0]['hand'],
				age: results[0]['age']
			}
		});

		res.end();
	});
});

app.get("/picacoin/users/:user/current", function (req, res, err){
	var usr_id = req.params.user;
	var sql = "SELECT * FROM `match` WHERE `in_course`=1 AND (`player1`=" + connection.escape(usr_id) + " OR `player2`="+ connection.escape(usr_id) + ")";

	connection.query(sql, function (err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		if(results.length == 0){
			res.json({
				error:{
					code: 403,
					message: "User has no current matches"
				}
			});
			return;
		}

		var response = {
			player: usr_id,
			matches: []
		};

		for(var i = 0; i<results.length; i++){
			response.matches.push({
					id: results[i]['id'],
					name: results[i]['name'],
					players : [
						results[i]['player1'],
						results[i]['player2']
					]
			});
		}

		noCache(res);

		res.json(response);
		res.end();
	});
});

app.get("/picacoin/autocomplete", function (req, res, err) {

	getConnection();

	var sql = "SELECT `login` FROM `users`";
	connection.query(sql, function (err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		var json = [];
		for(var i = 0; i < results.length; i++){
			json.push(results[i]['login']);
		}

		noCache(res);

		res.json(json);
		res.end();
	});
});

//post

app.post("/picacoin/matches/new", function (req, res, err) {
	var p1 = req.body.player1;
	var p2 = req.body.player2;

	getConnection();

	var m_name = req.body.m_name;
	var sql = "SELECT * FROM `users` WHERE `login`=" + connection.escape(p1) + " OR `login`=" + connection.escape(p2);
	connection.query(sql, function(err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		if(results.length != 2){
			res.json({
				error:{
					code: 301,
					message : "More than 2 users with usernames " + p1 + ", " + p2 + " found, or one of two has no account"
				}
			});
			return;
		}

		sql = "INSERT INTO `match` (id, name, player1, player2, in_course, creation_date, end_date) VALUES (0, " + (connection.escape(m_name) || (connection.escape(p1) + " vs " + connection.escape(p2)) )+ ", " +connection.escape(p1)+ ", " +connection.escape(p2)+ ", 1, NOW(), NOW())";

		connection.query(sql, function(err, results){
			if(err){
				sendErr(err, res);
				throw new Error(err);
			}

			res.json({
				success:{
					match_id: results.insertId,
					match_name : m_name,
					player1 : p1,
					player2 : p2
				}
			});

			res.end();
		});

	});
});

app.post("/picacoin/users/new", function (req, res, err) {
	var user_id = req.body.login;
	var user_sex = req.body.person.sex;
	var user_hand = req.body.person.hand;
	var user_age = req.body.person.age;
	var user_name = req.body.name;
	var user_last_name = req.body.last_name;

	if(!user_id || user_id == ""){
		res.json({
			error:{
				code: 404,
				message: "User ID (login) must be set"
			}
		});
		return;
	}
	getConnection();

	var sql = "SELECT `login` FROM `users` WHERE `login`=" + connection.escape(user_id);
	connection.query(sql, function(err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		if(results.length > 0){
			res.json({
				error:{
					code: 403,
					message: "User already Exists"
				}
			});
			return;
		}

	});

	sql = "INSERT INTO `users` (id, login, name, last_name, sex, hand, age) VALUES (0, "+connection.escape(user_id)+", "+connection.escape(user_name)+ ", " + connection.escape(user_last_name) +", " + connection.escape(user_sex)+", "+connection.escape(user_hand)+","+connection.escape(user_age)+")";
	console.log(sql);
	connection.query(sql, function (err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		res.json({
			success:{
				usr_id: results.insertId,
				usr_login: user_id
			}
		});

		res.end();
	});
});

app.post("/picacoin/cas_auth", function (req, res, err){
	var ticket  = req.body.ticket;
	var service = req.body.service;

	var response = "";

	var options = {
		hostname: "cas.utc.fr",
		path: "/cas/serviceValidate?service=" + service + "&ticket=" + ticket,
		method: 'GET'
	};

	var request = http.request(options, function (resp){
		resp.setEncoding('utf8');
		resp.on('data', function(chunk){
			response+= chunk;
		});

		resp.on('end', function(){
			// console.log("Cas response: ",response);
			xml.fromXml(response, {}, function (err, result){
				if(err){
					res.json({
						error:{
							code:600,
							message: "Error in translation of:" + response
						}
					});
					return;
				}
				res.send(result);
			});
			// res.send(response);
		})
	});

	request.on('error', function(e){
		console.log("Error: ", e);
	});

	request.end();

});

app.post("/picacoin/match/:id/points/", function (req, res, err){
	var match_id = req.params.id;
	var usr_id = req.body.player;
	var points = req.body.points;
	if(points > 2 || points == 0){
		res.json({
			error:{
				code: 500,
				message: "Number of points can't be > 2 or equal to 0"
			}
		});
		return;
	}

	getConnection();

	var sql = "SELECT `id`,`in_course`,`player1`,`player2` FROM `match` WHERE `id`="+ connection.escape(match_id);
	connection.query(sql, function(err, results){
		if(err){
			sendErr(err, res);
			throw new Error(err);
		}

		if(results.length == 0){
			res.json({
				error:{
					code: 501,
					message: "More than 1 match with id" + match_id+ " found!"
				}
			});
			return;
		}else if(results.length > 1){
			res.json({
				error:{
					code: 502,
					message: "No match with id" + match_id+ " found!"
				}
			});
			return;
		}

		if (results[0]['in_course'] == 0){
			res.json({
				error:{
					code: 503,
					message: "Can't award points to player "+usr_id+ " because match "+match_id+ " has already finished",
				}
			});
			return;
		}

		if(usr_id != results[0]['player1'] && usr_id != results[0]['player2']){
			res.json({
				error:{
					code:504,
					message: "Player " + usr_id + " is not in this match",
				}
			});
			return;
		}

		
		sql = "INSERT INTO `points` (user_id, date, number, match_id) VALUES ("+connection.escape(usr_id)+",NOW(),"+connection.escape(points)+","+connection.escape(match_id)+")";
		connection.query(sql, function(err, results){
			if(err){
				sendErr(err, res);
				throw new Error(err);
			}

			res.json({
				success:{
					points: points,
					player: usr_id,
					match_id: match_id,
					message: "Points awarded successfully"
				}
			});
			res.end();
		});
	});

});


app.listen(9090, function(){
	console.log("Listening!");
});