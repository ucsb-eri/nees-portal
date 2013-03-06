/**
 * Set up app
 */
var app			=	window.app || (window.app = {});

(function () {
	'use strict';

	app.DEBUG	=	true;
	app.version	=	'0.2.3';

	window.addEvent('load', function () {
		app.Controller.Input.init();
		app.Controller.Input.getInput();
		app.Controller.TableNav.init();
	});
	
}) ();
