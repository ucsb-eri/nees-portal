/* vim: set tabstop=4 shiftwidth=4: */
/*jslint mootools:true */
var app	 =   window.app || (window.app = {});

/**
 * Specifies algorithms controlling how certain objects are displayed
 * 
 * -----------------------------------------------------------------------------
 * Layout
 * -----------------------------------------------------------------------------
 * app.settings
 * - DP_SETTINGS
 * - FIRST_EVENT
 * - MAP_CIRCLE_SETTINGS
 * 
 * - getMarkerOptions(ml)
 */
(function () {
	'use strict';
	
	var	// Constant primatives
		FIRST_EVENT_UTC		=	979439174, // UTC time of first event
		WAVEFORM_BASE_URL	=	'http://nees.ucsb.edu:8888/wf/',
		// Initialize settings object
		settings			=   {};
		
	// Constant objects
	settings.DP_SETTINGS	=   { // DatePicker opts
		format: '%x',
		pickerClass: 'datepicker_jqui',
		positionOffset: { x: 0, y: 5},
		yearPicker: true
	},
	settings.MAP_CIRCLE_SETTINGS	=   { // google.maps.Circle
		fillColor: 'black',
		fillOpacity: 0.25,
		strokeOpacity: 0
	};
	settings.CHN_GRID_HEADER = {
		chan: 'Channel',
		snr: 'SNR',
		peaka: 'Peak'
	};
	settings.EVT_GRID_HEADER = {
		time: 'Date (UTC)',
		depth: 'Depth (km)',
		dist: 'Dist (km)',
		ml:	'Mag'
	};
		
	// Default value for sDate field
	settings.FIRST_EVENT = new Date(0);
	settings.FIRST_EVENT.setUTCSeconds(FIRST_EVENT_UTC);

	// Algorithm used to determine Map marker size based on event magnitude
	settings.getMarkerOptions = function (ml) {
		return {
			fillOpacity: 1,
			scale: 3 + Math.pow(2 * ml, 1.5)
		};
	};
	settings.constructWF = function (site, stations, time, nsamp, srate) {
		var	endTime	=	time + (nsamp - 1) / srate,
			staStr	=	stations.join('|'),
			params	=	[site, staStr, time, endTime];

		// Convert epoch ms to sec
		time	/=	1000;
		endTime	/=	1000;

		return WAVEFORM_BASE_URL + params.join('/');
	};
	
	app.settings = settings;
	
}) ();
