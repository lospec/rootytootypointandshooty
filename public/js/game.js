//This is the main entry point for client side code, which gets compiled into a single file. All code should be put into a separate file, then included below.

const $ = document.querySelector.bind(document);

const $$ = document.querySelectorAll.bind(document);
CSW = 10; //character sprite width
CSH = 14; //character sprite height

const GAME = {
	player: {kills: 0, deaths: 0, cooldown: 10},
	playerList: {},
	started: false,
	bullets: {},
	ui: {},
	sounds: {},
};

//chat
function addChatMessage (message, username) {
	let html = '<div>';
	if (username) html+= '<b>'+username+':</b> '+message;
	else html +='<i>'+message+'</i></div>';
	$('#chat').insertAdjacentHTML('beforeend', html);
}

const mouse = {left: false, x: 0, y: 0};

document.addEventListener('mousemove', function(e) {
	mouse.x = e.pageX;
	mouse.y = e.pageY;
});


document.addEventListener('mousedown', e=>{
	if (!GAME.started) return;

	//if left click
	if (e.button == 0) {
		mouse.left = true;
	}
});

document.addEventListener('mouseup', e=>{
	if (!GAME.started) return;

	//if left click
	if (e.button == 0) {
		mouse.left = false;
	}
});


//handles keyboard input
function keyboard(value) {
	let key = {};
	key.value = value;
	key.isDown = false;
	key.isUp = true;
	key.press = undefined;
	key.release = undefined;
	//The `downHandler`
	key.downHandler = event => {
		if (event.key === key.value) {
			if (key.isUp && key.press) key.press();
			key.isDown = true;
			key.isUp = false;
			event.preventDefault();
		}
	};

	//The `upHandler`
	key.upHandler = event => {
		if (event.key === key.value) {
			if (key.isDown && key.release) key.release();
			key.isDown = false;
			key.isUp = true;
			event.preventDefault();
		}
	};

	//Attach event listeners
	const downListener = key.downHandler.bind(key);
	const upListener = key.upHandler.bind(key);

	window.addEventListener("keydown", downListener, false);
	window.addEventListener("keyup", upListener, false);

	// Detach event listeners
	key.unsubscribe = () => {
		window.removeEventListener("keydown", downListener);
		window.removeEventListener("keyup", upListener);
	};

	return key;
}

//GAME LOOP (runs every frame)
function gameLoop(delta) {

	//look at mouse
	if (mouse.x < window.innerWidth/2 && GAME.player.sprite.scale.x > 0){ //if mouse on left & sprite is not flipped
		GAME.player.sprite.scale.x = -SCALE; // flip sprite
		this.socket.emit('playerLook', -1);
	} else if (mouse.x > window.innerWidth/2 && GAME.player.sprite.scale.x < 0){
		GAME.player.sprite.scale.x = SCALE; //if mouse on right and & sprite not flipped
		this.socket.emit('playerLook', 1);
	}

	//shoot 
	if (mouse.left && GAME.player.cooldown <=0 ) {
		let angle = Math.atan2(mouse.x-window.innerWidth/2, mouse.y-window.innerHeight/2) * 180 / Math.PI;
		angle = 360 - Math.round(angle - 180) - 90; 
		
		this.socket.emit('shoot',angle);
		console.log('shoot',angle);

		GAME.player.cooldown = 10;
		GAME.sounds.shoot.play();
	}
	GAME.player.cooldown -= delta;

	//move player
	if (GAME.player.sprite.v.x !== 0 || GAME.player.sprite.v.y !== 0) {
		//if (GAME.player.sprite.x + GAME.player.sprite.v.x * SCALE < 0) return;
		//if (GAME.player.sprite.x + GAME.player.sprite.v.x * SCALE > 512*SCALE) return;
		//if (GAME.player.sprite.y + GAME.player.sprite.v.y * SCALE < 0) return;
		//if (GAME.player.sprite.y + GAME.player.sprite.v.y * SCALE < 512*SCALE) return;
		
		GAME.player.sprite.x += GAME.player.sprite.v.x * SCALE;
		GAME.player.sprite.y += GAME.player.sprite.v.y * SCALE;
		this.socket.emit('playerMovement', { x: GAME.player.sprite.x/SCALE, y: GAME.player.sprite.y/SCALE});
		offsetPlayer();
	}

	//loop through all bullets in existence
	for(i in GAME.bullets) {
		let b = GAME.bullets[i]
		b.x += b.v.x;
		b.y += b.v.y;
	
		//check for collission
		if (
			b.x > GAME.player.sprite.x - 3*SCALE &&
			b.x < GAME.player.sprite.x + 3*SCALE &&
			b.y > GAME.player.sprite.y - 12*SCALE &&
			b.y < GAME.player.sprite.y
			) {
				GAME.player.sprite.x = 0; 
				GAME.player.sprite.y = 0; 
				offsetPlayer();
				
				this.socket.emit('hit', 'bullet', i);

				//show you died text
				let deadText = new PIXI.Text('YOU DIED',{fontFamily : '04B03', fontSize: 128, fill : 0xffffff, align : 'center'});
				deadText.anchor.set(0.5, 0);
				deadText.x = window.innerWidth/2;
				deadText.y = 10;
				deadText.roundPixels=true
				GAME.app.stage.addChild(deadText);

				setTimeout(e=>{deadText.destroy()}, 2000);
			}
	}
}

//offsets the arena on screen so that the player is centered
function offsetPlayer() {
	GAME.arena.x = window.innerWidth/2 - GAME.player.sprite.x;
	GAME.arena.y = window.innerHeight/2 - GAME.player.sprite.y;
}
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

//pixi settings
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
PIXI.settings.ROUND_PIXELS = true;

let SCALE = 5;
let SPEED = 2;

//load required font
var font = new FontFaceObserver('04B03');
font.load().then(function () {
	console.log('font loaded')
	window.socket = io();

	//the client has successfully connected to the server
	this.socket.on("connected", function () {
		console.log("connected to server");
		$('.popup.join').show();
	});

	//if it fails
	this.socket.on("joinfail", function (info) {
		$('.popup .error').innerHTML = 'ERROR:'+info;
		$('.popup .error').classList.add('visible');
		console.warn("failed to join game:",info);
	});

	//when join is successful
	this.socket.on("joined", function (player) {
		$('.popup.join').hide();
		$('.popup .error').classList.remove('visible');
		console.log("joined game");
		addChatMessage('you joined the game');
		startGame(player);
	});
});

//clicked join
$('.popup.join button.join').addEventListener('click', e=> {
	//join as the selected character
	this.socket.emit('join', $('.popup.join input.name').value, $('.popup.join .color').value);
});

//clicked cancel
$('.popup.join button.cancel').addEventListener('click', e=> {
	$('.popup.join').hide();
});

//prevent leaving page by accident
window.addEventListener('beforeunload', function (e) {
	e.preventDefault(); 
	e.returnValue = 'If you leave this page you will exit the game';
});