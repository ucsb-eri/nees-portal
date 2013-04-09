// Nees Portal 0.2.4
// =================
//
// > by Andrew Lo, for UCSB NEES
// > http://nees.ucsb.edu
//

//
// Set up application
//
(function () {
	'use strict';

	// Set up app namespace
	var app = this.app = {};
	app.DEBUG   = true;
	app.version = '0.2.4';

	window.addEvent('domready', function () {
		// Initialize Input controllers
		app.Controller.Input.init();
		app.Controller.TableNav.init();

		// Misc init tasks
		$('formatDetails').set('href', app.settings.FORMAT_DETAILS_URL);
		$('formatDetails').set('target', '_blank');

		// Run for initial state
		app.Controller.Input.getInput();
	});
	
}) ();

