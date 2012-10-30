/* vim: set tabstop=4 shiftwidth=4: */
/*jshint mootools:true */

(function (global) {
    'use strict';
    
    var Portal = global.Portal = function () {
        this.version = '0.0.0';
    };
    
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

}) (this);
