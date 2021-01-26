//INITIALIZE GAME
function startGame(player) {
	GAME.sounds.shoot = document.createElement("audio");
	GAME.sounds.shoot.src = "/sounds/shoot.wav";
	GAME.sounds.die = document.createElement("audio");
	GAME.sounds.die.src = "/sounds/die.wav";

	GAME.player.id = player.id;
	GAME.player.name = player.name;

	//create pixi app
	GAME.app = new PIXI.Application({ 
		backgroundColor: 0x000000,
		resizeTo: window,
		autoDensity: true,
		resolution: devicePixelRatio,
		antialias: false,
		width: window.innerWidth,
		height: window.innerHeight,
	});
	document.body.appendChild(GAME.app.view);

	//create world container
	GAME.arena = new PIXI.Container();
	GAME.arena.sortableChildren = true;
	GAME.app.stage.addChild(GAME.arena);

	//BACKGROUND
	const background = PIXI.Sprite.from("images/battlefield.png");
	background.x = 0;
	background.y = 0;
	background.width = 512 * SCALE;
	background.height = 512 * SCALE;
	GAME.arena.addChild(background);


	// PLAYER
	GAME.player.sprite = PIXI.Sprite.from('data:image/png;base64,'+player.sprite);
	GAME.player.sprite.anchor.set(0.5, 1);
	GAME.player.sprite.x = player.x * SCALE;
	GAME.player.sprite.y = player.y * SCALE;
	GAME.player.sprite.width = CSW * SCALE;
	GAME.player.sprite.height = CSH * SCALE;
	GAME.player.sprite.zIndex = 999999;
	GAME.player.sprite.v = { x: 0, y: 0 }; //velocity
	GAME.arena.addChild(GAME.player.sprite);

	offsetPlayer();

	//score text
	GAME.ui.scoreText = new PIXI.Text('SCORE: 0 [0/0]',{fontFamily : '04B03', fontSize: 16*5, fill : 0xffffff, align : 'center'});
	GAME.ui.scoreText.anchor.set(0, 0);
	GAME.ui.scoreText.x = 10;
	GAME.ui.scoreText.y = 0;
	GAME.ui.scoreText.roundPixels=true
	GAME.ui.scoreText.width = GAME.ui.scoreText.width * 2 /5;
	GAME.ui.scoreText.height = GAME.ui.scoreText.height * 2 /5;
	GAME.app.stage.addChild(GAME.ui.scoreText);

	//leaders text
	GAME.ui.leadersText = new PIXI.Text('leaderboard',{fontFamily : '04B03', fontSize: 16*5, fill : 0xffffff, align : 'right'});
	GAME.ui.leadersText.anchor.set(1, 0);
	GAME.ui.leadersText.x = window.innerWidth;
	GAME.ui.leadersText.y = 10;
	GAME.ui.leadersText.roundPixels=true
	GAME.ui.leadersText.width = GAME.ui.leadersText.width * 2 /5;
	GAME.ui.leadersText.height = GAME.ui.leadersText.height * 2 /5;
	GAME.app.stage.addChild(GAME.ui.leadersText);


	//get list of players
	this.socket.on("currentPlayers", function (players) {
		console.log("joingame:", players);
		Object.keys(players).forEach(function (id) {
			let player = players[id];
			if (player.id !== self.socket.id) {
				playerJoin(player);
			}
		});
	});

	this.socket.on("newPlayer", function (player) {
		console.log("connect:", player);
		addChatMessage(player.name+' joined');
		playerJoin(player);
	});


	this.socket.on("disconnect", function (playerId) {
		console.log("disconnect:", playerId);
		if (GAME.playerList.hasOwnProperty(playerId)) {
			console.log('gotta remove sprite',GAME.playerList[playerId])
			GAME.playerList[playerId].parent.removeChild(GAME.playerList[playerId]);
			delete GAME.playerList[playerId];
		}
		else console.warn('player',playerId,'not found')
	});

	this.socket.on("playerMoved", function (playerInfo) {
		let movedPlayer = GAME.playerList[playerInfo.id]
		if (!movedPlayer) console.warn('player not found (move)', playerInfo);

		movedPlayer.x = playerInfo.x * SCALE;
		movedPlayer.y = playerInfo.y * SCALE;
		movedPlayer.zIndex = playerInfo.y
		
		GAME.arena.updateTransform();
	});

	this.socket.on("playerLooked", function (id, direction) {
		let movedPlayer = GAME.playerList[id];
		if (!movedPlayer) console.warn('player not found (move)', id);
		movedPlayer.scale.x = direction * SCALE;

		movedPlayer.getChildByName('nameLabel').scale.x = direction *0.4;
	});

	this.socket.on("died", function (id, x, y, newDeathCount, killerId) {
		if (id == GAME.player.id) {
			GAME.sounds.die.play();
			GAME.player.sprite.x = x*SCALE;
			GAME.player.sprite.y = y*SCALE;
			GAME.player.deaths = newDeathCount;
			updateScore();
			offsetPlayer();

		} else if (GAME.playerList[id]) {
			console.log(GAME.playerList[id].name,'died',x,y);
			GAME.playerList[id].deaths++;
			GAME.playerList[id].x = x*SCALE;
			GAME.playerList[id].y = y*SCALE;
			//if you were the one that killed them
			if (killerId == GAME.player.id) {
				GAME.player.kills++;
				updateScore();
			}

		}
	});

	this.socket.on("scoreboard", function (leaders) {
		console.log('leaders',leaders);

		let text = '1st: '+leaders[0]
		if (leaders[1]) text+= '\n 2nd: '+leaders[1];
		if (leaders[2]) text+= '\n 3rd: '+leaders[2];

		GAME.ui.leadersText.text =  text;
	});

	this.socket.on("newBullet", function (bullet) {
		let angle = bullet.angle * (Math.PI/180);
		let newBullet = PIXI.Sprite.from('/images/bullet_basic.png');
		newBullet.serverId = bullet;
		//newBullet.anchor.set(0.5, 0.5);
		newBullet.x = bullet.x*SCALE + SCALE*10*Math.cos(angle);
		newBullet.y = (bullet.y - CSH/2) * SCALE + SCALE*10*Math.sin(angle); //this needs to be adjusted for characters of varied height
		newBullet.zIndex = 10; 
		newBullet.scale.x = SCALE;
		newBullet.scale.y = SCALE;
		newBullet.anchor.set(1, 0.5); // sets it so the position is the very tip of the projectile (middle/right of sprite)
		newBullet.rotation = angle;
		newBullet.v = { x: bullet.speed*SCALE * Math.cos(angle), y: bullet.speed*SCALE * Math.sin(angle) }; //velocity
		
		//add to game
		GAME.arena.addChild(newBullet);
		GAME.bullets[bullet.id] = newBullet;

		//destroy
		setTimeout(e=>{newBullet.destroyBullet()}, bullet.ttl*100);
		newBullet.destroyBullet = ()=>{
			delete GAME.bullets[bullet.id];
			newBullet.destroy();
		}
	});

	//keyboard controls
	keyboard("ArrowRight").press = () => {
		GAME.player.sprite.v.x = SPEED;
	};
	keyboard("ArrowRight").release = () => {
		GAME.player.sprite.v.x = 0;
	};
	keyboard("ArrowLeft").press = () => {
		GAME.player.sprite.v.x = -SPEED;
	};
	keyboard("ArrowLeft").release = () => {
		GAME.player.sprite.v.x = 0;
	};
	keyboard("ArrowUp").press = () => {
		GAME.player.sprite.v.y = -SPEED;
	};
	keyboard("ArrowUp").release = () => {
		GAME.player.sprite.v.y = 0;
	};
	keyboard("ArrowDown").press = () => {
		GAME.player.sprite.v.y = +SPEED;
	};
	keyboard("ArrowDown").release = () => {
		GAME.player.sprite.v.y = 0;
	};


	keyboard("Enter").press = () => {
		this.socket.emit('chat', prompt('Chat:'));
	};
	this.socket.on("chat", addChatMessage);

	//start game loop
	GAME.app.ticker.add(delta => gameLoop(delta));
	GAME.started = true;
} 

function updateScore () {
	GAME.ui.scoreText.text = 'SCORE: '+(GAME.player.kills-GAME.player.deaths)+' ['+GAME.player.kills+'/'+GAME.player.deaths+']';
}

function playerJoin(player) {
	// ADD NEW PLAYER
	let newPlayer = PIXI.Sprite.from('data:image/png;base64,'+player.sprite);
	newPlayer.anchor.set(0.5, 1);
	newPlayer.x = player.x * SCALE;
	newPlayer.y = player.y * SCALE;
	newPlayer.zIndex = 10;
	newPlayer.width = CSW * SCALE;
	newPlayer.height = CSH * SCALE;
	newPlayer.v = { x: 0, y: 0 }; //velocity
	newPlayer.name = player.name;
	GAME.arena.addChild(newPlayer);

	let floatingName = new PIXI.Text(player.name,{fontFamily : '04B03', fontSize: 8, fill : 0xffffff, align : 'center'});
	floatingName.anchor.set(0.5, 0);
	floatingName.y = -CSH;
	floatingName.roundPixels=true
	floatingName.width = floatingName.width * 0.4 ;
	floatingName.height = floatingName.height * 0.4 ;
	floatingName.name = 'nameLabel';
	newPlayer.addChild(floatingName);

	//add to player list
	GAME.playerList[player.id] = newPlayer;
}