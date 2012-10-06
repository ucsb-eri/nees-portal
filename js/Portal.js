/* vim: set tabstop=4 shiftwidth=4: */
/*jshint mootools:true */
(function (global) {
    'use strict';
    
	document.addEvent("domready", function () {
		[Controller, View, Model].invoke("initialize");

		Controller.attach(Model.Data);
		Model.Data.attach(View.Map, View.Info, Model.Events);
		Model.Events.attach(View.Map, View.Table);

		Controller.retrieveInput();

		$$(".toggle:not(.active)").retrieve("slide").invoke("hide");
		$("site").focus();
	});

}) (this);

