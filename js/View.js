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
		View,
		sfile, timeout, zipAvail;
	
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
							fillColor: 'yellow',
							fillOpacity: 0.6,
							strokeColor: 'black',
							strokeOpacity: 1,
							strokeWeight: 1
						}, app.settings.getMarkerOptions(data[i].ml)),
						position: loc,
						title: 'Evid: ' + data[i].evid + '\nML: ' + data[i].ml,
						zIndex: -1
					});
				marker.setMap(this._mapObj);
				this._markers.push(marker);
			}
		},
		_highlightMarker: function (index) {
			var marker	  =   this._markers[index],
				markerIcon  =   marker.getIcon();
				
			markerIcon.fillColor = 'red';
			marker.setIcon(markerIcon);
			marker.setZIndex(2);
		},
		_dehighlightMarker: function (index) {
			var marker	  =   this._markers[index],
				markerIcon  =   marker.getIcon();
				
			markerIcon.fillColor = 'yellow';
			marker.setIcon(markerIcon);
			marker.setZIndex(1);
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
			
			this._el.addEvent('tabFocus',
				google.maps.event.trigger.pass([this._mapObj, 'resize']));
		}
	});
	
	info = new View({
		_loadInfo: function (text) {
			this._el.set('html', text);
		},
		setup: function () {
			this._el = tabs.add('INFO');
			this._el.setStyles({
				color: '#333',
				overflow: 'auto',
				padding: '25px 15px',
				width: '95%'
			});
			
			PubSub.subscribe('inputChanged', function (data) {
				var shortName = $('site').options[$('site').selectedIndex]
					.getAttribute('site').toLowerCase();

				info._el.set('text', 'Loading...');

				new Request({
					onSuccess: info._loadInfo,
					url: 'siteInfo.php'
				}).get('site=' + shortName);
			});
			
			this._el.set('text', '');
		}
	});
	
	evtGrid = new View({
		_events: {
			'eventsUpdated': '_loadEvents',
			'inputChanged': '_empty',
			'clearTable': '_empty'
		},
		_loadEvents: function (models) {
			var i, j, k,
				metaData;
				
			this._grid.empty();
			if (!app.Controller.Input._input.sortBy) {
				$$('.sort').removeClass('sort');
			}
			
			for (i = 0, j = models.length; i < j; i++) {
				this._grid.push([
						this.filter(Object.values(
							Object.subset(models[i], this._headers)
					))].append(
					new Element('div', {
						'class': 'evt-item evt-item-' + models[i].id,
						'title': 'You have selected channel(s) from this event'
					})
				), {
					modelNum: i
				});
			}

			// Re-mark evt items on load
			for (i = 0, j = Object.keys(app.Models.Cart.toObj()),
					k = j.length; i < k; i++) {
				$$('.evt-item-' + j[i]).addClass('active');
			}
			
			metaData = app.Models.Events.getMeta();
			$('query-result').set('text', metaData.rows +
				' results.');
			$('table-ctrl-page').set('value', metaData.pageNum + 1);
			$('table-ctrl-total').set('text', metaData.totalPages);
		},
		_empty: function () {
			this._grid.empty();
			this._grid.push([ 'Loading...' ]);
		},
		_onSort: function (tbody, sortIndex) {
			var input   =   app.Controller.Input._input,
				colName =   Object.keyOf(app.settings.EVT_GRID_HEADER,
								sortIndex.get('html'));
				
			this._grid.head.getElements('th').removeClass('sort').removeClass('desc');
			
			if (input.sortBy && !input.desc) {
				sortIndex.addClass('sort');
				sortIndex.addClass('desc');
				input.desc = true;
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
				headerText	=	Object.values(app.settings.EVT_GRID_HEADER)
									.append([]);
				
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
				headers: Object.values(app.settings.EVT_GRID_HEADER)
					.append([]),
				zebra: true
			});
			this._grid.element.addEvent('click:relay(th)', this._onSort);
			this._grid.body.addEvent('click:relay(tr)', this._rowSelected);
			this._grid.body.addEvent('mouseover:relay(tr)', this._rowOver);
			this._grid.body.addEvent('mouseout:relay(tr)', this._rowOut);
			this._grid.inject(this._el);

			PubSub.subscribe('cartUpdated', function () {
				$$('.evt-item').removeClass('active');
				for (var i = 0, j = Object.keys(app.Models.Cart.toObj()),
						k = j.length; i < k; i++) {
					$$('.evt-item-' + j[i]).addClass('active');
				}
			});
			
			$('depToEvid').addEvent('click', this._toggleDepEvid);
		}
	});
	
	cart = new View({
		_events: {
			'cartUpdated': '_loadCart'
		},
		_emailRegex: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,6}$/i,
		_loadCart: function () {
			var	cartItems	=	app.Models.Cart.toObj(),
				pane		=	$('cart-left'),
				tree		=	new Element('ul');

			pane.empty();

			if (Object.getLength(cartItems) === 0) {
				pane.set('html', '<div>No channels selected!</div>');
			} else {
				for (var i = 0, j = Object.values(cartItems), l = j.length;
					i < l; i++) {
						
					var	chnList	=	new Element('ul'),
						evtChns	=	j[i].chnList;
	
					for (var p = 0, q = evtChns.length; p < q; p++) {
						chnList.adopt(new Element('li', {
							'text': evtChns[p]
						}));
					}
	
					tree.adopt((new Element('li', {
						'html': '<b>Event</b>: ML ' +  j[i].ml + ' @ ' +
								j[i].dist + 'km from ' + j[i].site +
							'<br /><b>Evid</b>: ' + j[i].evid+
							'<br /><b>Time</b>: ' + j[i].time +
							'<br /><b>Channels</b>: [' + evtChns.length + ']'
						}))
						.adopt(chnList));
					pane.adopt(tree);
				}
			}
		},
		submit: function () {
			var	cartData, formatData, userData,
				name	=	$('cart-input-name').value,
				email   =   $('cart-input-email').value,
				format;
			
			// Simple validation of email
			if (!this._emailRegex.test(email)) {
				alert('Please enter a valid e-mail address!');
				return;
			}
			
			cartData = {};
			
			userData			=	{};
			userData.name		=	name;
			userData.email		=	email;
			cartData.userData	=	userData;
			
			formatData			=	{};
			$$('#cart-input-format tbody tr').each(function (tableRow) {
				if (tableRow.getElement('.format-toggle').checked) {
					var f, formatName =
						tableRow.getElement('.format-name').get('text');
						
					f			=	formatData[formatName]	=	{};
					f.calibrate	=
						tableRow.getElement('.calib-calib').checked ?
							'calib'	:	'counts';
					f.time	=
						tableRow.getElement('.time-absolute').checked ?
							'absolute'	:	'relative';
				}
			});
			cartData.formatData	=	formatData;

			if (Object.getLength(formatData) == 0) {
				alert('Please select a format!');
				return;
			}
			
			cartData.evtData	=	app.Models.Cart.toObj();
			
			console.log(JSON.encode(cartData));
			
			new Request({
				method: 'post',
				url: app.settings.CART_SUBMIT_URL
			}).send(cartData);
		},
		setup: function () {
			var	appCart		=	this._el		=	$('app-cart'),
				cartOverlay	=	this._overlay	=	new Element('div', {
					'styles': {
						'background-color': 'rgba(0, 0, 0, 0.8)',
						'height': '100%',
						'left': 0,
						'position': 'absolute',
						'top': 0,
						'width': '100%',
						'z-index': 99
					}
				});
				
			for (var i = 0, j = app.settings.formats, k = Object.getLength(j);
					i < k; i++) {
				var	formatName	=	Object.keys(j)[i],
					formatProps	=	Object.values(j)[i],
					tableRow	=	new Element('tr');
				
				tableRow.adopt(
					new Element('td').adopt(
						new Element('input', {
							class: 'format-toggle',
							type: 'checkbox'
						})
					),
					new Element('td', {
						class: 'format-name',
						text: formatName
					}),
					new Element('td').adopt(
						new Element('input', {
							class: 'calib-calib',
							disabled: !formatProps.calibrate.calib,
							name: formatName + '-calib',
							type: 'radio'
						}),
						new Element('span', {
							text: 'Calib'
						}),
						new Element('br'),
						new Element('input', {
							class: 'calib-counts',
							disabled: !formatProps.calibrate.counts,
							name: formatName + '-calib',
							type: 'radio'
						}),
						new Element('span', {
							text: 'Counts'
						})
					),
					new Element('td').adopt(
						new Element('input', {
							class: 'time-absolute',
							disabled: !formatProps.time.absolute,
							name: formatName + '-time',
							type: 'radio'
						}),
						new Element('span', {
							text: 'Absolute'
						}),
						new Element('br'),
						new Element('input', {
							class: 'time-relative',
							disabled: !formatProps.time.relative,
							name: formatName + '-time',
							type: 'radio'
						}),
						new Element('span', {
							text: 'Relative'
						})
					)
				);
				
				$('cart-input-format').tBodies[0].adopt(tableRow);
			}
			
			$$('#cart-input-format td').each(function (tableCell) {
				var b = tableCell.getElements('input:enabled[type=radio]');
				if (b.length > 0) b[0].set('checked', true);
			});

			document.body.adopt(cartOverlay);
			$$(this._el, this._overlay).fade('hide');

			$('view-cart').addEvent('click',
				appCart.fade.pass('in', appCart));
			$('view-cart').addEvent('click',
				cartOverlay.fade.pass('in', cartOverlay));

			$('cart-close').addEvent('click',
				appCart.fade.pass('out', appCart));
			$('cart-close').addEvent('click',
				cartOverlay.fade.pass('out', cartOverlay));
			$('cart-submit').addEvent('click', this.submit);
		}
	});
	
	channelBox = new View({
		_events: {
			'channelsUpdated':	'_loadChannels',
			'eventSelected':	'hide',
			'eventsUpdated':	'hide'
		},
		_loadChannels: function (models) {
			var	i, j, k,
				bodyRow,
				headRow;
			
			this._grid.empty();
			for (i = 0, j = models.length; i < j; i++) {
				this._grid.push([
					new Element('div', {
						'class': 'cart-item',
						'title': 'Add/Remove from Cart'
					}),
				].append(Object.values(
					Object.subset(models[i], this._headers)
				)).append([
					new Element('div', {
						'class': 'wv-item',
						'title': 'Select for viewing'
					})
				]), {
					'chan': models[i].chan
				});
			}
			
			if (models.length > 0) {
				// Synchronize table col width
				bodyRow = this._grid.body.getElement('tr').getElements('td');
				headRow = this._grid.head.getElements('th');
				for (i = 0, j = headRow.length - 1; i < j; i++) {
					headRow[i].setStyle('width', bodyRow[i].offsetWidth -
						parseInt(bodyRow[i].getStyle('padding'), 10) * 2 + 'px');
				}

				// Re-mark channel cart items on load
				for (i = 0, j = $$('#channel-grid-body tr'), k = j.length;
						i < k; i++) {
					if (app.Models.Cart.has(this.getCurrentEvent().evid,
							j[i].get('chan'))) {
						j[i].getElement('.cart-item').addClass('active');
					}
				}
				
				if ($$('.cart-item:not(#chn-add-all):not(.active)').length === 0) {
					$('chn-add-all').addClass('active');
				} else {
					$('chn-add-all').removeClass('active');
				}

				// Set up clickable items
				$$('.wv-item, .cart-item:not(#chn-add-all)').addEvent('click', function () {
					this.toggleClass('active');
				});
				$$('.cart-item:not(#chn-add-all)').addEvent('click', this._addToCart);

				$$('.wv-item').addEvent('click', function () {
					if ($$('.wv-item.active').length > 4) {
						this.removeClass('active');
						alert('Can only view 4 items at a time.');
					}
				});
			} else {
				this._grid.push(['No channels availible']);
			}
			
			this._el.fade('in');
			this._slideObj.slideIn();
		},
		_adjustSize: function () {
			var	gridH,
				offsetH = $('app-grid').getSize().y - 5,
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
			var i, j,
				active		=	$$('.cart-item.active:not(#chn-add-all) ! tr'),
				inactive	=	$$('.cart-item:not(.active):not(#chn-add-all) ! tr');
			
			for (i = 0, j = inactive.length; i < j; i++) {
				app.Models.Cart.remove(this.getCurrentEvent().evid,
					'' + inactive[i].get('chan'));
			}
			
			for (i = 0, j = active.length; i < j; i++) {
				var evid	=   this.getCurrentEvent().evid,
					evt	 =   app.Models.Events.get(evid);
				
				app.Models.Cart.add(this.getCurrentEvent().evid,
					{
						ml: evt.ml,
						siteEvt: evt.id,
						time: evt.time
					}, '' + active[i].get('chan'));
			}
			
			if ($$('.cart-item:not(#chn-add-all):not(.active)').length === 0) {
				$('chn-add-all').addClass('active');
			} else {
				$('chn-add-all').removeClass('active');
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
				var currChn;
				chanArr.push(row.get('chan'));

				// nsamp and srate appear not to vary per chn
				currChn = app.Models.Channels.get(row.get('chan'));
				nsamp = currChn.nsamp;
				srate = currChn.srate;
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
				(Date.parse(evtTime.replace('(UTC)', 'UTC')))/1000,
				nsamp,
				srate
			));
		},
		hide: function () {
			this._slideObj.slideOut();
			this._el.fade('out');
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
				headers: [
					new Element('div', {
						class: 'cart-item',
						id: 'chn-add-all',
						title: 'Add/Remove all channels'
					})
				]
				.append(Object.values(app.settings.CHN_GRID_HEADER))
				.append(['']),
				zebra: true
			});
			this._headEl.adopt(new Element('table').adopt(this._grid.thead));
			this._bodyEl.adopt(new Element('table').adopt(this._grid.body));
			
			window.addEvent('resize', this._adjustSize);
			this._adjustSize();
			
			this._slideObj = new Fx.Slide(this._el, {
				duration: 'short',
				hideOverflow: false,
				link: 'chain',
				mode: 'horizontal'
			});
			this._el.fade('hide');
			this._slideObj.hide();
			
			$('channel-close').addEvent('click', this.hide);
			$('chn-control-view').addEvent('click', this._viewSelected);
			
			$('chn-add-all').addEvent('click', function () {
				if ($('chn-add-all').hasClass('active')) {
					// Remove all from cart
					$$('.cart-item').removeClass('active');
				} else {
					$$('.cart-item').addClass('active');
				}
				this._addToCart();
			}.bind(this));
		},
		getCurrentEvent: function () {
			return this._currEvt || {};
		},
		setCurrentEvent: function (currEvt) {
			this._currEvt = currEvt;
		}
	});

}) ();
