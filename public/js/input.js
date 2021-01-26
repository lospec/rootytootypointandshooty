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
