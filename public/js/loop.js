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
		if (!b.owner == GAME.player.id &&				//not own bullet
			b.x > GAME.player.sprite.x - 3*SCALE &&		//more left than left side of sprite
			b.x < GAME.player.sprite.x + 3*SCALE && 	//less left than right side of sprite
			b.y > GAME.player.sprite.y - 12*SCALE &&	//more down than top of sprite
			b.y < GAME.player.sprite.y					//less down than bottom of sprite
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