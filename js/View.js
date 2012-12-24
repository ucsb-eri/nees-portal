/* vim: set tabstop=4 shiftwidth=4: */
/*jslint mootools:true */
var	app		=	window.app || (window.app = {}),

	_		=	window._,
	google	=	window.google,
	PubSub	=	window.PubSub,
	Tabs	=	window.Tabs;

(function () {
	'use strict';
	
	var	cart,
		channelBox,
		info,
		map,
		tabs,
		evtGrid,
		View;
	
	app.View = {};
	
	tabs = new Tabs($('app-viewport'));
	
	View = new Class({
		initialize: function (options) {
			Object.append(this, options);
			_.bindAll(this);
			
			if (this._events) {
				Object.each(this._events, function (v, k) {
					PubSub.subscribe(k, this[v]);
				}, this);
			}
			
			this.setup();
		},
		render: function () {},
		setup: function () {}
	});
	
	map = new View({
		_events: {
			'inputChanged': 'setPosition',
			'eventsUpdated': '_drawMarkers'
		},
		_drawCircle: function (center, radius) {
			this._mapCirc.setMap(null);
			this._mapCirc.setCenter(center);
			this._mapCirc.setRadius(radius * 1000);
			this._mapCirc.setMap(this._mapObj);
		},
		_drawMarkers: function (data) {
			this._resetMarkers();

			for (var i = 0, j = data.length; i < j; i++) {
				var loc		=	new google.maps.LatLng(data[i].lat,
									data[i].lng),
					marker	=	new google.maps.Marker({
						flat: true,
						icon: Object.append({
							path: google.maps.SymbolPath.CIRCLE,
							fillColor: 'orange',
							strokeOpacity: 0
						}, app.settings.getMarkerOptions(data[i].ml)),
						position: loc,
						zIndex: -1
					});
				
				marker.setShadow({
					path: google.maps.SymbolPath.CIRCLE,
					fillColor: 'black',
					fillOpacity: 1,
					scale: marker.getIcon().scale
				});
	
				marker.setMap(this._mapObj);
				this._markers.push(marker);
			}
		},
		_highlightMarker: function (index) {
			this._markers.each(function(marker) {
				marker.setVisible(false);
			});
			this._markers[index].setVisible(true);
		},
		_dehighlightMarker: function (index) {
			this._markers.each(function(marker) {
				marker.setVisible(true);
			});
		},
		_resetMarkers: function () {
			for (var i = this._markers.length - 1; i >= 0; i--) {
				this._markers[i].setMap(null);
				this._markers.pop();
			}
		},
		setPosition: function (data) {
			var center = new google.maps.LatLng($(data.site).get('lat'),
				$(data.site).get('lon'));

			if (this._mapCirc.getCenter() &&
				this._mapCirc.getCenter().equals(center) &&
				this._mapCirc.getRadius() === data.radius * 1000) {
				return;
			}

			this._mapObj.setOptions({
				center:	center
			});

			this._drawCircle(center, data.radius);
			this._mapObj.fitBounds(this._mapCirc.getBounds());
		},
		setup: function () {
			this._markers = [];
			this._el = tabs.add('MAP');
			this._mapObj = new google.maps.Map(this._el, {
				center: new google.maps.LatLng(0, 0),
				mapTypeId: google.maps.MapTypeId.TERRAIN,
				zoom: 8
			});
			this._mapCirc = new google.maps.Circle(
				app.settings.MAP_CIRCLE_SETTINGS);
			this._mapCirc.setMap(this._mapObj);
			
		}
	});
	
	info = new View({
		setup: function () {
			this._el = tabs.add('INFO');
			this._el.set('text', '');
		}
	});
	
	evtGrid = new View({
		_events: {
			'eventsUpdated': '_loadEvents',
			'clearTable': '_empty'
		},
		_loadEvents: function (models) {
			var metaData;
				
			this._empty();
			for (var i = 0, j = models.length; i < j; i++) {
				this._grid.push([new Element('div', {
					'class': 'evt-item evt-item-' + models[i].id
				})].append(
					this.filter(Object.values(
						Object.subset(models[i], this._headers)
					))
				), {
					modelNum: i
				});
			}

			// Re-mark evt items on load
			$$('.evt-item').setStyle('background-color', 'grey');
			for (var i = 0, j = Object.keys(app.Models.Cart.toObj()),
					k = j.length; i < k; i++) {
				$$('.evt-item-' + j[i]).setStyle('background-color', 'red');
			}
			
			metaData = app.Models.Events.getMeta();
			$('query-result').set('text', 'Found ' + metaData.rows +
				' results.');
			$('table-ctrl-page').set('value', metaData.pageNum + 1);
			$('table-ctrl-total').set('text', metaData.totalPages);
		},
		_empty: function () {
			this._grid.empty();
		},
		_onSort: function (tbody, sortIndex) {
			var input   =   app.Controller.Input._input,
				colName =   Object.keyOf(app.settings.EVT_GRID_HEADER,
								sortIndex.get('text'));
				
			this._grid.head.getElements('th').removeClass('sort').removeClass('desc');
			
			if (input.sortBy && input.sortBy === colName) {
				if (input.desc) {
					delete input.sortBy;
					delete input.desc;
				} else {
					sortIndex.addClass('sort');
					sortIndex.addClass('desc');
					input.desc = true;
				}
			} else {
				sortIndex.addClass('sort');
				input.sortBy = colName;
				if (input.desc) delete input.desc;
			}
			input.page = 0;
			
			app.Models.Events.fetch(input);
			
		},
		_rowOver: function (evt, row) {
			map._highlightMarker(parseInt(row.get('modelNum'), 10));
		},
		_rowOut: function (evt, row) {
			map._dehighlightMarker(parseInt(row.get('modelNum'), 10));
		},
		_rowSelected: function (evt, row) {
			var modelNum	=   parseInt(row.get('modelNum'), 10),
				date		=   app.Models.Events.toArray()[modelNum].time,
				evid		=   app.Models.Events.toArray()[modelNum].id,
				
				evtObj		=   {
					evid: evid,
					date: date,
					siteId: $(app.Controller.Input._input.site).get('id')
				};

			this.clearSelection();
			row.addClass('selected');
			
			channelBox.setCurrentEvent(evtObj);
			PubSub.publish('eventSelected', evtObj);
		},
		_toggleDepEvid: function () {
			var	hasDepth	=	this._headers.contains('depth'),
				headerText	=	[''].append(
					Object.values(app.settings.EVT_GRID_HEADER));
				
			this._headers = [''].append(
				Object.keys(app.settings.EVT_GRID_HEADER));

			if (hasDepth) {
				headerText[headerText.indexOf('Depth (km)')] = 'Evid';
				this._headers[this._headers.indexOf('depth')] = 'evid';
			}
			this._grid.set('headers', headerText);
			
			this._loadEvents(app.Models.Events.toArray());
		},
		clearSelection: function () {
			this._el.getElements('tr').removeClass('selected');
		},
		filter: function (oldArr) {
			var newArr = [];
			for (var i = 0, j = oldArr.length; i < j; i++) {
				if (typeof oldArr[i] === 'string') {
					newArr[i] = oldArr[i].replace(' (UTC)', '');
				} else {
					newArr[i] = oldArr[i];
				}
			}
			return newArr;
		},
		setup: function () {
			_.bindAll(this);
			this._el = $('app-evt-table');
			
			this._headers = Object.keys(app.settings.EVT_GRID_HEADER);
			
			this._grid = new HtmlTable({
				classZebra: 'odd',
				gridContainer : this._el,
				headers: [''].append( // blank header for cart indicator
			Object.values(app.settings.EVT_GRID_HEADER)),
				zebra: true
			});
			this._grid.element.addEvent('click:relay(th)', this._onSort);
			this._grid.body.addEvent('click:relay(tr)', this._rowSelected);
			this._grid.body.addEvent('mouseover:relay(tr)', this._rowOver);
			this._grid.body.addEvent('mouseout:relay(tr)', this._rowOut);
			this._grid.inject(this._el);

			PubSub.subscribe('cartUpdated', function () {
				$$('.evt-item').setStyle('background-color', 'grey');
				for (var i = 0, j = Object.keys(app.Models.Cart.toObj()),
						k = j.length; i < k; i++) {
					$$('.evt-item-' + j[i]).setStyle('background-color', 'red');
				}
			});
			
			$('depToEvid').addEvent('click', this._toggleDepEvid);
		}
	});
	
	cart = new View({
		_events: {
			'cartUpdated': '_loadCart'
		},
		_loadCart: function () {
			var	cartItems	=	app.Models.Cart.toObj(),
				pane		=	$('cart-left'),
				tree		=	new Element('ul');

			pane.empty();

			for (var i = 0, j = Object.keys(cartItems),
					k = Object.values(cartItems), l = j.length; i < l; i++) {
				var	chnList	=	new Element('ul'),
					evtChns	=	Object.keys(k[i]);

				tree.adopt(new Element('li', { 'text': 'Event ' + j[i] }));

				for (var p = 0, q = evtChns.length; p < q; p++) {
					chnList.adopt(new Element('li', { 'text': 'Channel' + evtChns[p] }));
				}

				tree.adopt(chnList);
				pane.adopt(tree);
			}
		},
		setup: function () {
			var appCart = this._el = $('app-cart');

			this._el.fade('hide');
			$('view-cart').addEvent('click', appCart.fade.pass('in', appCart));
			$('cart-close').addEvent('click',
				appCart.fade.pass('out', appCart));
		}
	});
	
	channelBox = new View({
		_events: {
			'channelsUpdated': '_loadChannels',
			'eventsUpdated': 'hide'
		},
		_loadChannels: function (models) {
			var	i, j,
				bodyRow,
				headRow;
			
			this._slideObj.hide();
			this._grid.empty();
			for (var i = 0, j = models.length; i < j; i++) {
				this._grid.push([$$(
					new Element('div', { 'class': 'cart-item' }),
					new Element('div', { 'class': 'wv-item' })
				)].append(Object.values(
					Object.subset(models[i], this._headers)
				)), {
					'chnId': models[i].id,
					'modelNum': i,
					'nsamp': models[i].nsamp,
					'srate': models[i].srate
				});
			}
			
			if (models.length > 0) {
				// Synchronize table col width
				bodyRow = this._grid.body.getElement('tr').getElements('td');
				headRow = this._grid.head.getElements('th');
				for (var i = 0, j = headRow.length - 1; i < j; i++) {
					headRow[i].setStyle('width', bodyRow[i].offsetWidth -
						parseInt(bodyRow[i].getStyle('padding'), 10) * 2 + 'px');
				}

				// Re-mark channel cart items on load
				for (var i = 0, j = $$('#channel-grid-body tr'), k = j.length;
						i < k; i++) {
					if (app.Models.Cart.has(this.getCurrentEvent().evid,
							j[i].get('chnId'))) {
						j[i].getElement('.cart-item').addClass('active');
					}
				}

				// Set up clickable items
				$$('.wv-item, .cart-item').addEvent('click', function () {
					this.toggleClass('active');
				});

				$$('.wv-item').addEvent('click', function () {
					if ($$('.wv-item.active').length > 4) {
						this.removeClass('active');
						alert('Can only view 4 items at a time.');
					}
				});
			} else {
				this._grid.push(['No channels availible']);
			}
			
			this._slideObj.slideIn();
		},
		_adjustSize: function () {
			var titleH = $('app-title').getSize().y,
				gridH,
				offsetH = window.getSize().y - titleH,
				sidebarW = $('app-grid').getSize().x;
			this._el.setStyles({
				height: offsetH + 'px',
				left: sidebarW + 'px'
			});
			
			gridH = $('channel-title').getSize().y +
					$('channel-controls').getSize().y +
					$('channel-grid-head').getSize().y;
			this._bodyEl.setStyle('height', offsetH - gridH);
		},
		_addToCart: function () {
			var	active		=	$$('.cart-item.active ! tr'),
				inactive	=	$$('.cart-item:not(.active) ! tr');
			
			for (var i = 0, j = inactive.length; i < j; i++) {
				app.Models.Cart.remove(this.getCurrentEvent().evid,
					'' + inactive[i].get('chnId'));
			}
			for (var i = 0, j = active.length; i < j; i++) {
				app.Models.Cart.add(this.getCurrentEvent().evid,
					'' + active[i].get('chnId'));
			}
			PubSub.publish('cartUpdated', app.Models.Cart._data);
		},
		_viewSelected: function () {
			var	evtTime, nsamp, srate,
				chanArr				=	[],
				selectedChannels	=	$$('.wv-item.active ! tr');

			if (selectedChannels.length === 0) {
				alert('No channels selected for viewing!');
				return;
			}

			$$('.wv-item.active ! tr').each(function (row) {
				chanArr.push(row.get('chan'));

				// nsamp and srate appear not to vary per chn
				nsamp = row.get('nsamp');
				srate = row.get('srate');
			});

			for (var i = 0, j = app.Models.Events.toArray(), k = j.length;
					i < k; i++) {
				if (j[i].id === this.getCurrentEvent().evid) {
					evtTime = j[i].time;
				}
			}

			// Open WF Viewer
			window.open(app.settings.constructWF(
				$('site').options[$('site').selectedIndex].get('site'),
				chanArr,
				new Date().parse(evtTime).getTime(),
				nsamp,
				srate
			));
		},
		hide: function () {
			this._slideObj.slideOut();
		},
		setup: function () {
			_.bindAll(this);
			this._el = $('app-channel-box');
			this._headEl = $('channel-grid-head');
			this._bodyEl = $('channel-grid-body');
			
			this._headers = Object.keys(app.settings.CHN_GRID_HEADER);
			
			this._grid = new HtmlTable({
				classZebra: 'odd',
				gridContainer : this._gridEl,
				headers: [''].append(
					Object.values(app.settings.CHN_GRID_HEADER)
				),
				zebra: true
			});
			this._headEl.adopt(new Element('table').adopt(this._grid.thead));
			this._bodyEl.adopt(new Element('table').adopt(this._grid.body));
			
			window.addEvent('resize', this._adjustSize);
			this._adjustSize();
			
			this._slideObj = new Fx.Slide(this._el, {
				hideOverflow: false,
				mode: 'horizontal'
			});
			this._slideObj.hide();
			
			$('channel-close').addEvent('click', this.hide);
			$('chn-control-view').addEvent('click', this._viewSelected);
			$('chn-control-add').addEvent('click', this._addToCart);
		},
		getCurrentEvent: function () {
			return this._currEvt || {};
		},
		setCurrentEvent: function (currEvt) {
			this._currEvt = currEvt;
		}
	});

}) ();
