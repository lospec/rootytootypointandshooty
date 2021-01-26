(function(){


    function initPopup (popup) {

        //use this as dropdown element if not specified (for when el.initDropdown is called)
        if (!popup) popup = this;


        //make sure it's the right element
        if (!popup.classList.contains('popup')) return console.log(popup,'is not a popup');

        //add click event
        popup.addEventListener('click', function (e) {

            //hide popup
	        if (e.target.classList.contains('popup'))
	            e.target.hide(e);

        });

        //add toggle function to element
        popup.show = showPopup.bind(popup);
        popup.hide = hidePopup.bind(popup);

    }

    function showPopup (e) {

		this.classList.add('open');
		document.body.classList.add('popupOpen');

		//enable any file-inputs
		this.querySelectorAll('.file-uploader-holder').forEach(f => f.enable());

		if (e) e.preventDefault();
    }

	const event = new Event('close-popup');

    function hidePopup (e) {

		this.classList.remove('open');
		document.body.classList.remove('popupOpen');

		//run onHide function if defined
		if (this.onHide) this.onHide();

		//disable any file-inputs
		this.querySelectorAll('.file-uploader-holder').forEach(f => f.disable());

		//clear any custom css that was added to generic popup
		this.querySelector('.content').style = '';

		//dispatch custom event for closing the popup
		this.dispatchEvent(event);

		if (e) e.preventDefault();
    }


    //add function to elements so they can be turned into dropdowns
    HTMLElement.prototype.initPopup = initPopup;

    //initialize every popup on page
    var popups = document.querySelectorAll('.popup');
    popups.forEach((c)=> initPopup(c));

})();
/*global HTMLElement*/






//show a generic popup
function popup (title,message,options) {
	var popupWindow = document.getElementById('popup-reusable');
	if (!options) options = [];

	//change title
	popupWindow.querySelector('.content h2').innerHTML = title;

	//change message
	popupWindow.querySelector('.content p').innerHTML = message;

	//clear buttons
	var buttonSet = popupWindow.querySelector('.buttons');
	buttonSet.innerHTML = '';

	//loop through options
	Object.keys(options).forEach(function(key,index) {
		//create button
		var newButton = document.createElement('button');
		newButton.className = 'link-button';
		newButton.innerHTML = key;

		//add click event
		newButton.addEventListener('click', function () {

			//if the option is just a string
			if (typeof options[key] == 'string') {

				//preset to just close the popup
				if (options[key] == 'hide')
					return popupWindow.hide();

				//else assume URL and redirect
				return window.location.href = options[key];
			}

			//execute button's function, sending popupWindow as this
			options[key].call(popupWindow);
		});

		//add to form
		buttonSet.appendChild(newButton);
	});

	//show popup
	popupWindow.show();
}

/*global Event*/