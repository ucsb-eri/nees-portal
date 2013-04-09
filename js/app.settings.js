// app.settings.js
// ===============

// Settings file for NEES Portal
(function () {
	'use strict';

	// Do setup
	var app,
		settings = app.settings = {};

	// Make sure app namespace is loaded
	if (this.app) {
		app = this.app;
	} else {
		throw 'Error: app namespace not yet loaded.'
	}
	
	
	// <Settings>

	var
		// URL constants
		URL = {
			// URL to submit cart JSON to for processing
			'CART_SUBMIT': 'cartProc.php',
			// URL used to get data in 'SITE' tab, just appends site shortname
			'FACILITIES': 'http://eot-dev.nees.ucsb.edu/facilities/',
			// URL to 'Format Details' PDF linked to in cart
			'FORMAT': 'format.pdf',
			// Static page linked to in 'HELP' tab
			'HELP': 'help.php',
			// String used to construct image URL of channel thumbnail preview
			'THUMB': 'thumbnail.php?ddir={DDIR}&file={DFILE}&time={EPOCH}';
			// Base URL of WaveForm Viewer
			'WF_BASE': 'http://nees.ucsb.edu:8889/wf/'
		},
		// UTC time of first event (Used as left date for date input range)
		firstEvtUTC = 1072944000;

	// String used to display number of items in cart
	settings.cartCountStr = '{chnCount} chans in {evtCount} events';
	
	// Settings concerning displayed formats
	settings.formats = {
		'ASCII': {
			enabled: true, name: 'asc', 
			calibrate: { counts: true, calib: true },
			time: { absolute: true, relative: true }
		},
		'COSMOS': {
			enabled: false, name: 'cos',
			calibrate: { counts: true, calib: true },
			time: { absolute: true, relative: false }
		},
		'MINISEED': { enabled: true, name: 'msd',
			calibrate: { counts: true, calib: false },
			time: { absolute: true, relative: false }
		},
		'RDV': {
			enabled: true, name: 'rdv',
			calibrate: { counts: true, calib: true },
			time: { absolute: true, relative: true }
		},
		'SAC': {
			enabled: true, name: 'sac',
			calibrate: { counts: true, calib: true },
			time: { absolute: true, relative: false }
		},
		'MATLAB-CSV': {
			enabled: true, name: 'mlb',
			calibrate: { counts: true, calib: true },
			time: { absolute: true, relative: false }
		}
	};
	
// > Input Settings
	// Default value for sDate field
	settings.firstEvt = new Date(0);
	settings.firstEvt.setUTCSeconds(firstEvtUTC);

	// Datepicker Settings (Used for both sDate and eDate)
	settings.dpSettings = {
		'format': '%x',
		'pickerClass': 'datepicker_jqui',
		'positionOffset': { 'x': -20, 'y': 5},
		'yearPicker': true
	};


// > Map Settings
	// Settings for Range Circle (circle indicating events within distance)
	settings.rgcSettings = {
		fillColor: 'black',
		fillOpacity: 0.25,
		strokeOpacity: 0.0
	};
		
	// Algorithm used to determine Map marker size based on event magnitude
	settings.markerSettings = function (ml) {
		return {
			scale: 4 + 0.5 * Math.pow(ml, 2)
		};
	};

// > Evt Grid Settings
	// Event Grid Header
	// > format:
	// >   <json field>: <display text>
	settings.evtGridHeader = {
		'time': 'Date (UTC)',
		'depth': 'Depth (km)',
		'dist': 'Dist (km)',
		'ml':	'Mag'
	};

// ChannelBox Settings
	// ChannelBox Header
	// > format:
	// >   <json field>: <table header html>
	settings.chnGridHeader = {
		'chan': '<span title="We assign location codes, e.g. 00 or 99 to the '
			+ 'channel names to identify the instrument and its location. The '
			+ 'images in the Info tab show the relative position and depth. '
			+ 'Survey maps are available for the site layouts.">Channel</span>',
		'snr': '<span title="Ratio of peak value to pre-event RMS level">SNR'
			+ '</span>',
		'peaka': '<span title="Abs value of filtered-signal\'s peak (0.5 to '
			+ '40Hz)">Peak</span>'
	};
	// Constructs URL for WaveForm Viewer
	settings.getWFUrl = function (site, stations, time, nsamp, srate) {
		time -= 15;
		
		var	endTime	=	time + 10 + (nsamp - 1) / srate,
			staStr	=	stations.join('|'),
			params	=	[site, staStr, time, endTime];

		return settings.URL.WF_BASE + params.join('/');
	};

	// </Settings>
	
}) ();

