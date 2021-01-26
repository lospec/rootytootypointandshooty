var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var fs = require('fs');

var players = {};
var bullet = {};
var bullets = 0;

var star = {
	x: Math.floor(Math.random() * 700) + 50,
	y: Math.floor(Math.random() * 500) + 50
};
var scores = {
	blue: 0,
	red: 0
};

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
	console.log(socket.id, 'connected');

	socket.emit('connected', socket.id);

	socket.on('join', function (name,character) {
		
		//make sure name is good
		if (name.length < 3) return socket.emit('joinfail', 'name too short'); 
		if (name.length > 10) return socket.emit('joinfail', 'name too long'); 

		console.log(socket.id,'joined as',name,character);
		
		//load avatar
		fs.readFile('./images/'+character+'.png', {encoding: 'base64'}, (err, bitmap) => {
			if (err) return socket.emit('joinfail', 'avatar not found');

			// create a new player and add it to our players object
			players[socket.id] = {
				name: name,
				character: character,
				sprite:bitmap,
				x: Math.random()*512,
				y: Math.random()*512,
				id: socket.id,
				kills: 0,
				deaths: 0,
			};

			socket.emit('joined', players[socket.id]);
			socket.emit('currentPlayers', players);
			socket.emit('scoreUpdate', scores);
			updateLeaders();

			socket.broadcast.emit('newPlayer', players[socket.id]);
			
			// when a player disconnects, remove them from our players object
			socket.on('disconnect', function () {
				if (!players[socket.id]) return;

				console.log(socket.id,players[socket.id].name,'disconnected');
				io.emit('disconnect', socket.id);
				
				io.emit('chat', String(players[socket.id].name+' left the game'));
				delete players[socket.id];

				updateLeaders();
			});
			
			socket.on('chat', function (message) {
				console.log(socket.id,players[socket.id].name+':',message);
				oi.emit('chat', String(message),players[socket.id].name);
			});
		
			// when a player moves, update the player data
			socket.on('playerMovement', function (movementData) {
				players[socket.id].x = movementData.x;
				players[socket.id].y = movementData.y;
				socket.broadcast.emit('playerMoved', players[socket.id]);
			});
		
			// when a player moves, update the player data
			socket.on('playerLook', function (direction) {
				socket.broadcast.emit('playerLooked',socket.id, direction);
			});
			
			//player tried to shoot
			socket.on('shoot', function (angle) {
				bullets++;
				let id = bullets;

				bullet[id] = {
					id: id,
					owner: socket.id,
					x: players[socket.id].x,
					y: players[socket.id].y,
					angle: angle,
					ttl: 5,
					speed: 3,
				};

				io.emit('newBullet', bullet[id]);
			});

			socket.on('hit', function (method, id) {

				if (method == 'bullet') {
					players[bullet[id].owner].kills++;
					players[socket.id].deaths++;
					io.emit('chat', players[bullet[id].owner].name+' killed '+players[socket.id].name);
					io.emit('died', socket.id, Math.random()*512, Math.random()*512, players[socket.id].deaths, bullet[id].owner);
					updateLeaders();
				}				
			});

			function updateLeaders () {
				let leaders = Object.values(players).sort((a,b)=> {
					let aScore = a.kills-a.deaths;
					let bScore = b.kills-b.deaths;
					console.log('sorting',a.name,aScore,'-',b.name,bScore,'=',(aScore - bScore));
					return bScore - aScore;
				}).map(p => p.name+'['+(p.kills-p.deaths)+']').slice(0,2);

				io.emit('scoreboard', leaders);
			}
		});
	});
	

});




server.listen(40180, function () {
	console.log(`Listening on ${server.address().port}`);
});
