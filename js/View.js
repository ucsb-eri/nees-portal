/* vim: set tabstop=4 shiftwidth=4: */
/*jslint mootools:true */
var app     =   window.app || (window.app = {}),
    _       =   window._,
    google  =   window.google,
    PubSub  =   window.PubSub,
    Tabs    =   window.Tabs;

(function () {
    'use strict';
    
    var info,
        infoTab,
        map,
        mapTab,
        tabs,
        View;
    
    app.View = {};
    
    tabs = new Tabs('app-viewport');
    
    View = new Class({
        initialize: function (options) {
            _.bindAll(this);
            Object.append(this, options);
            this.setup();
        },
        link: function (type, fn) {
            PubSub.subscribe(type, fn);
        },
        render: function () {},
        setup: function () {}
    });
    
    mapTab = tabs.add('map');
    map = new View({
        _el: mapTab,
        _drawCircle: function (center, radius) {
			this._mapCirc.setMap(null);
			this._mapCirc.setCenter(center);
			this._mapCirc.setRadius(radius * 1000);
			this._mapCirc.setMap(this._mapObj);
        },
        _drawMarkers: function (data) {
            for (var i = 0, j = data.length; i < j; i++) {
                var loc		=	new google.maps.LatLng(data[i].lat,
                                    data[i].lon),
                    marker	=	new google.maps.Marker({
                        icon: Object.append({
                            path: google.maps.SymbolPath.CIRCLE,
                            fillOpacity: 0.5,
                            fillColor: 'orange',
                            strokeOpacity: 0,
                        }, app.settings.getMarkerOptions(data[i].ml)),
                        position: loc,
                        zIndex: 1
                    });
    
                marker.setMap(this._mapObj);
                this._markers.push(marker);
            }
        },
        _highlightMarker: function () {
        },
        _dehighlightMarker: function () {
        },
        _resetMarkers: function () {
			for (var i = this._markers.length - 1; i >= 0; i--) {
				this._markers[i].setMap(null);
				this._markers.pop();
			}
        },
        setPosition: function (data) {
			var center = new google.maps.LatLng(data.site.lat, data.site.lon);

			if (this._mapCirc.getCenter() &&
                this._mapCirc.getCenter().equals(center) &&
                this._mapCirc.getRadius() === data.radius * 1000) {
                return;
            }

			this._mapObj.setOptions({
				center:	center
			});

			this._drawCircle(center, data.radius);
			this._mapObj.fitBounds(this._rangeCircle.getBounds());
        },
        setup: function () {
            this._markers = [];
            this._mapobj = new global.google.maps.Map(this._el, {
                center: new google.maps.LatLng(0, 0),
				mapTypeId: google.maps.MapTypeId.TERRAIN,
                zoom: 0
            });
            
            this.link('inputChanged', this.setPosition);
            this.link('eventsChanged', this._drawMarkers);
        }
    });
    
    infoTab = tabs.add('Info');
    info = new View({
        _el: infoTab
    });
    
    /*

    // Station info tab
	var Info = (function () {
		var
			data	=	{
				// DOM Elements
				test: null,
				wrap: null
			};

		return new Class({
			initialize: function (el) {
				data.wrap = el;
				var testDiv = data.test = new Element('div', {
					styles : {
						'backgroundColor': '#FFF',
						'height': '100%',
						'width': '100%'
					},
					text: ''
				});

				data.wrap.adopt(testDiv);
			},
			update: function (obj) {
				data.test.set('text', obj.getValues().site.toString());
			}
		});
	}) ();

	var Table = (function () {
		var
			settings	=	{
				tableHeader: {
					time: 'Date (UTC)',
					depth: 'Depth (km)',
					dist: 'Dist (km)',
					ml:	'Mag'
				},
				wrap: 'app-evt-table'
			},
			data	=	null,
			el		=	null;
		return new Class({
			initialize: function () {
				el = $(settings.wrap);
				$('depToEvid').addEvent('click', function (evt) {
					if (evt.target.checked) {
						delete settings.tableHeader.depth;
						settings.tableHeader.evid = 'Evid';
					} else {
						delete settings.tableHeader.evid;
						settings.tableHeader.depth = 'Depth';
					}
					this.render();
				}.bind(this));
			},
			addRow: function (obj) {
				var
					currIdx		=	el.getElements('tr.dataRow').length,
					tableRow	=	new Element('tr');

				tableRow.addClass(currIdx % 2 ? 'even' : 'odd');
				tableRow.addClass('dataRow');
				tableRow.store('rowNum', currIdx);
                tableRow.store('evid', obj.id);
                tableRow.store('siteId', global.Model.Events.getSiteId());

				var chkBox = new Element('input', { type: 'checkbox' });
				tableRow.adopt(chkBox);

				for (var idx = 0, j = Object.keys(settings.tableHeader),
                        k = j.length; idx < k; idx++) {
					var tableCell = new Element('td');
                    
					if (obj[j[idx]]) {
                        tableCell.appendText(this.parse(obj[j[idx]]));
					}
                    
					tableRow.adopt(tableCell);
				}

				tableRow.addEvent('mouseenter',
                    View.Map.highlightMarker.bind(tableRow));
				tableRow.addEvent('mouseleave',
                    View.Map.dehighlightMarker.bind(tableRow));
                tableRow.addEvent('click', this.getChannels.bind(tableRow));
				el.adopt(tableRow);
			},
			clear: function () {
				el.empty();
				this.writeHeader();
			},
            getChannels: function () {
                global.Model.Channels.update(this.retrieve('evid'),
                    this.retrieve('siteId'));
            },
			parse: function (obj) {
				// @@TODO: Parse data into readable format
				if (~obj.toString().indexOf('UTC')) {
					obj = obj.toString().replace(' (UTC)', '');
				}
				return obj;
			},
			render: function () {
				this.clear();

				var tblData = data.getEvents();
				for (var idx = 0, l = tblData.length; idx < l; idx++) {
					this.addRow(tblData[idx]);
				}
			},
			update: function (obj) {
				data = obj;
				this.render();
			},
			writeHeader: function () {
				var
					tHead	=	new Element('thead'),
					tRow	=	new Element('tr');

				tRow.adopt(new Element('th')); // Empty col for chkboxes

				for (var idx = 0, j = Object.values(settings.tableHeader),
                        l = j.length; idx < l; idx++) {
					var
						headCol = new Element('th', {
							text: j[idx]
						});
					headCol.store('idx', idx);
					headCol.addEvent('click', function (evt) {
                        var sortMarkers = evt.target.getElements('span.sort');
                        if (sortMarkers) {
                            sortMarkers.toggleClass('asc');
                            sortMarkers.toggleClass('desc');
                        } else {
                            $$('.sort').destroy();
                            
                            evt.target.adopt('span', {
                                'class': 'sort desc'
                            });
                        }
						global.Model.Data.sortBy(
                            Object.keys(settings.tableHeader)[
                                evt.target.retrieve('idx')
                            ]
                        );
					});
					tRow.adopt(headCol);
				}
				tHead.adopt(tRow);
				el.adopt(tHead);
			}
		});
	}) ();

	var ChannelBox = (function () {
		var
            data        =   null,
            el          =   {},
			settings	=	{
				sideBar: 'app-grid',
				titleBar: 'app-title',
                test: false
			};

		function getOffsets() {
			return {
				x: $(settings.sideBar).getSize().x,
				y: $(settings.titleBar).getSize().y
			};
		}
		return new Class({
			initialize: function () {
                var
                    wrap = el.wrap = new Element('div', {'id': 'channel-box'});
                document.body.adopt(wrap);

                window.addEvent('resize', this.onResize.bind(this));
                this.onResize();
                el.wrap.fade('hide');
			},
            
            hide: function () {
                el.wrap.fade('hide');
            },
            onResize: function () {
                el.wrap.setStyles({
                    top: getOffsets().y + 'px',
                    height: (window.getSize().y - getOffsets().y) + 'px',
                    left: getOffsets().x + 'px'
                });
            },
            render: function () {
                var
                    bodyRow, headRow,
                    
                    scrollPane  =   new Element('div'),
                    tBodyTable  =   new Element('table'), // Put header and body
                    tHeadTable  =   new Element('table'), // in separate tables
                    tBody       =   new Element('tbody'),
                    tHead       =   new Element('thead'),
                    tHeadRow    =   new Element('tr');

                el.wrap.empty();

                // Write header
                tHeadRow.adopt(new Element('th', { text: '?' })); // Checkbox cl
                for (var i = 0, j = data.$meta.headers, k = j.length; i < k;
                        i++) {
                    tHeadRow.adopt(new Element('th', {
                        text: data.$meta.headers[i]
                    }));
                }
                
                tHead.adopt(tHeadRow);
                tHeadTable.adopt(tHead);
                el.wrap.adopt(tHeadTable);

                // Write table
                for (var i = 0, j = data.$data, k = j.length; i < k; i++) {
                    var
                        tRow = new Element('tr'),
                        chkBox = new Element('td');
                        
                    chkBox.adopt(new Element('input', {
                        type: 'checkbox'
                    }));
                    tRow.adopt(chkBox);
                    
                    for (var p = 0, q = j[i], r = q.length; p < r; p++) {
                        tRow.adopt(new Element('td', {
                            text: q[p]
                        }));
                    }

                    tRow.addClass(i % 2 === 0 ? 'even' : 'odd');
                    tBody.adopt(tRow);
                }
                tBodyTable.adopt(tBody);
                tBodyTable.setStyle('width', '100%');
                scrollPane.adopt(tBodyTable);
                scrollPane.setStyle('overflow', 'auto');
                scrollPane.setStyle('padding-bottom', '2em');
                scrollPane.setStyle('width', '100%');
                el.wrap.adopt(scrollPane);
                
                window.addEvent('resize', function () {
                    scrollPane.setStyle('height',
                        ($('channel-box').getSize().y - tHeadRow.getSize().y) + 'px');
                });
                scrollPane.setStyle('height',
                    ($('channel-box').getSize().y - tHeadRow.getSize().y) + 'px');

                if (tBodyTable.getElements('tr').length > 0) {
                    // sync thead and tbody widths
                    bodyRow =   tBodyTable.getElements('tr')[0],
                    headRow =   tHeadTable.getElements('tr')[0];

                    for (var i = 0, j = bodyRow.getElements('td'),
                            k = headRow.getElements('th'), l = j.length;
                            i < l; i++) {
                        $$(j[i], k[i]).setStyle('width', j[i].getSize().x + 'px');
                    }

                    tHeadTable.set('width', tBodyTable.getSize().x + 'px');
                }

                this.show();
            },
            show: function () {
                el.wrap.fade('show');
            },
            update: function (obj) {
                data = obj.getChannels();
                this.render();
            }
		});
	}) ();
    */

}) ();
