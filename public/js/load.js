
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