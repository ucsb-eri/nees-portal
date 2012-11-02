/* vim: set tabstop=4 shiftwidth=4: */
/*jshint mootools:true */
var app = app || {};

(function () {
    'use strict';
    
    app.version = '0.0.0';
    
    PubSub.subscribe('inputChanged', function (data) {
        app.Models.Events.fetch(data);
    });
    
    // @@TODO hook up PubSubs
    // @@TODO initialize controllers
    
    /*
    // Initialize objects
	document.addEvent('domready', function () {
		[global.Controller, global.View, global.Model].invoke('initialize');

		global.Controller.attach(global.Model.Data);
        global.Model.Channels.attach(global.View.ChannelBox);
		global.Model.Data.attach(global.View.Map, global.View.Info,
            global.Model.Events);
		global.Model.Events.attach(global.View.Map, global.View.Table);

		global.Controller.update();

		$$('.toggle:not(.active)').retrieve('slide').invoke('hide');
		$('site').focus();
	});
    */

}) ();
