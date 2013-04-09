// Controller.js
// =============
//
// Controller handles the input fields of the data portal, triggering events to
// drive the application.
// 
(function () {
	'use strict';

	// Make sure app namespace is loaded
	var app;
	if (this.app && this.app.settings) {
		app = this.app;
	} else {
		throw 'Error: app namespace not loaded yet.'
	}

	// Set up variables
	var Controller  = {},
		inputs = $$('.app-input-flds');


// <Controller.Input>
// ------------------
// Handles Input

	// Handle user input from Input box
	Controller.Input = {};

	// Initialize input controls
	Controller.Input.init = (function () {
		_.bindAll(this, 'getInput', 'getSites', 'loadSites');

	// Initialize DatePickers
		$$('.app-input-flds-date').each(function (el) {
			var datePicker = new Picker.Date(el,
				app.settings.dpSettings);
			el.store('_picker', datePicker);
		});
		$('sDate').retrieve('_picker').select(app.settings.firstEvt);
		$('eDate').retrieve('_picker').select(new Date());

	// Load sites
		this.getSites();
		
	// Handle input events
		inputs.addEvent('change', this.getInput);
		inputs.addEvent('keypress', function (evt) {
			if (evt.key === 'enter') {
				this.getInput();
			}
		}.bind(this));

		// Set up PGA-field
		$('pga-field')[$('enable-PGA').checked ? 'show' : 'hide']();
		$('enable-PGA').addEvent('click', function () {
			$('pga-field')[$('enable-PGA').checked ? 'show' : 'hide']();
		});
		$('enable-PGA').addEvent('click', this.getInput);

		// Check for site notice in <shortName>.txt
		$('site-msg').hide();
		PubSub.subscribe('inputChanged', function (data) {
			var siteName = $('site').options[$('site').selectedIndex]
				.getAttribute('site').toLowerCase();
				
			$('site-msg').hide();
				
			new Request({
				noCache: true,
				onSuccess: Controller.Input.siteMsg,
				url: Drupal.settings.drupal_path + '/' + siteName + '.txt'
			}).get();
		});
	});
	
	// Display msg regarding site
	Controller.Input.siteMsg = (function (txt) {
		$('site-msg').show();
		$('site-msg').set('html', txt);
	});
	
	// Prepare user input for data request
	Controller.Input.getInput = (function () {
		this._input = {};

		// Load input
		for (var idx = 0, l = inputs.length; idx < l; idx++) {
			this._input[inputs[idx].get('id')] = inputs[idx].value;
		}

		if (!$('enable-PGA').checked) {
			delete this._input['minPGA'];
			delete this._input['maxPGA'];
		}

		// Reset pagination variables
		this._input.page = this._input.maxPages = 0;

		PubSub.publish('inputChanged', this._input);
	});

	// Send request for Station data. Calls Controller.Input.loadSites when
	// data is received
	Controller.Input.getSites = (function () {
		var reqUrl = Drupal.settings.drupal_path + '/sites.php';
		new Request({
			async: false,
			onSuccess: this.loadSites,
			url: reqUrl
		}).get();
	});

	// Retrieve Station data from sites.php
	Controller.Input.loadSites = (function (txt, xml) {
		// Turn XML node into <option>
		function addOption(node, level, parent) {
			var nbsp	=   '\u00a0', // Unicode &nbsp; character
				thisEl;
			if (node.tagName === 'category') {
				thisEl = new Element('optgroup', {
					label: node.getAttribute('name'),
					id: node.getAttribute('id')
				});
			} else {
				thisEl = new Element('option', {
					id: node.getAttribute('id'),
					lat: node.getAttribute('lat'),
					lon: node.getAttribute('lon'),
					site: node.getAttribute('name'),

					// Create site 'hierarchical structure' with spaces
					text: (new Array(level + 1).join(nbsp + nbsp)) +
						node.getAttribute('name') +
							' (' + node.getAttribute('descrip') + ')',
					value: node.getAttribute('id')
				});
				
				if (node.tagName === 'none') thisEl.disabled = true;
			}
			parent.adopt(thisEl);
			if (node.hasChildNodes()) {
				for (var i = 0, j = node.childNodes, k = j.length; i < k; i++) {
					addOption(j[i], level + 1, (node.tagName === 'category') ?
						thisEl : parent);
				}
			}
		}
		
		// Cycle through nodes
		for (var i = 0, j = xml.getElementsByTagName('category'), k = j.length;
				i < k; i++) {
			addOption(j[i], 0, $('site'));
		}
	});

// </Controller.Input>

// <Controller.TableNav>
// ---------------------
// Handles pagination of evtGrid
	
	// Event query table navigation
	Controller.TableNav = {
		_currPage: 0,
		_maxPage: 0
	};

	// Initialize Table Navigation controls
	Controller.TableNav.init = (function () {
		_.bindAll(Controller.TableNav);

		// Attach events
		$('table-ctrls').addEvent('click:relay(div.btn)',
			Controller.TableNav.navOnClick);
		$('table-ctrl-page').addEvent('keypress',
			Controller.TableNav.pageEntered);

		// Reset to first page if input is changed
		PubSub.subscribe('inputChanged', function () {
			Controller.TableNav._currPage = 0;
		});
		// Update page navigation settings when eventsUpdated
		PubSub.subscribe('eventsUpdated', function () {
			var metaData = app.Models.Events.getMeta();
			this._currPage = metaData.pageNum;
			this._maxPage = metaData.totalPages;
			
			this.checkBounds();
		}.bind(this));

		// Make sure page is in bounds
		this.checkBounds();
	});

	// Disable buttons if max/min is reached
	Controller.TableNav.checkBounds = (function () {
		// Check lower bound
		if (this._currPage < 1) {
			$('table-ctrl-prev').addClass('disabled');
		} else if ($('table-ctrl-prev').hasClass('disabled')) {
			$('table-ctrl-prev').removeClass('disabled');
		}
		
		// Check upper bound
		if (this._currPage >= this._maxPage - 1) {
			$('table-ctrl-next').addClass('disabled');
		} else if ($('table-ctrl-next').hasClass('disabled')) {
			$('table-ctrl-next').removeClass('disabled');
		}
	});

	// Called by navOnClick and pageEntered to navigate to another page
	Controller.TableNav.nav = (function (offset) {
		PubSub.publish('clearTable', {});
		this._currPage += parseInt(offset, 10);

		this._currPage = Math.max(0, this._currPage);
		this._currPage = Math.min(this._currPage, this._maxPage - 1);
		
		app.Controller.Input._input.page = this._currPage;
		app.Models.Events.fetch(app.Controller.Input._input);
	});

	// Handle mouse click on nav buttons
	Controller.TableNav.navOnClick = (function (evt, btn) {
		this.nav(btn.get('data-page-offset'));
		evt.preventDefault();
	});

	// Handle direct input of page number
	Controller.TableNav.pageEntered = (function (evt) {
		if (evt.key === 'enter') {
			this._currPage = $('table-ctrl-page').value - 1;
            this._currPage = this._currPage.limit(0, this._maxPage - 1);
			app.Controller.Input._input.page = this._currPage;
			app.Models.Events.fetch(app.Controller.Input._input);
		}
	});

// </Controller.TableNav>

}) ();
