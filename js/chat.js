
//chat
function addChatMessage (message, username) {
	let html = '<div>';
	if (username) html+= '<b>'+username+':</b> '+message;
	else html +='<i>'+message+'</i></div>';
	$('#chat').insertAdjacentHTML('beforeend', html);
}
