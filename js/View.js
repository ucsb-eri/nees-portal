/* vim: set tabstop=4 shiftwidth=4: */
/*jslint mootools:true */
var app         =   window.app || (window.app = {}),

    _           =   window._,
    google      =   window.google,
    PubSub      =   window.PubSub,
    Tabs        =   window.Tabs;

(function () {
    'use strict';
    
    var cart,
        channelBox,
        info,
        infoTab,
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
            for (var i = 0, j = data.length; i < j; i++) {
                var loc		=	new google.maps.LatLng(data[i].lat,
                                    data[i].lng),
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
            // @@TODO: Fill in code
        },
        _dehighlightMarker: function () {
            // @@TODO: Fill in code
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
            this._el = tabs.add('Map');
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
    
    infoTab = tabs.add('Info');
    info = new View({
        _el: infoTab
    });
    
    evtGrid = new View({
        _events: {
            'eventsUpdated': '_loadEvents'
        },
        _loadEvents: function (models) {
            var metaData;
                
            this._grid.empty();
            for (var i = 0, j = models.length; i < j; i++) {
                this._grid.push(Object.values(
                    Object.subset(models[i], this._headers)
                ), {
                    modelNum: i
                });
            }
            
            metaData = app.Models.Events.getMeta();
            $('query-result').set('text', 'Found ' + metaData.rows + ' results.');
            $('table-ctrl-page').set('value', metaData.pageNum + 1);
            $('table-ctrl-total').set('text', metaData.totalPages);
        },
        _onSort: function (tbody, sortIndex) {
            var input = app.Controller.Input._input;
            if (input.sortBy === this._headers[sortIndex]) {
                if (input.desc) {
                    delete input.sortBy;
                    delete input.desc;
                } else {
                    input.desc = true;
                }
            } else {
                input.sortBy = this._headers[sortIndex];
            }
            
            app.Models.Events.fetch(input);
            // Trigger onSort
        },
        _rowSelected: function (evt, row) {
            var modelNum    =   row.get('modelNum'),
                evid        =   app.Models.Events.toArray()[modelNum].evid;
                
            this._el.getElements('tr').removeClass('selected');
            row.addClass('selected');
            
            PubSub.publish('eventSelected', {
                evid: evid,
                siteId: $(app.Controller.Input._input.site).get('id')
            });
        },
        _toggleDepEvid: function () {
            var hasDepth    =   this._headers.contains('depth'),
                headerText  =   Object.values(app.settings.EVT_GRID_HEADER);
                
            this._headers = Object.keys(app.settings.EVT_GRID_HEADER);
            if (hasDepth) {
                headerText[headerText.indexOf('Depth (km)')] = 'Evid';
                this._headers[this._headers.indexOf('depth')] = 'evid';
            }
            this._grid.set('headers', headerText);
            
            this._loadEvents(app.Models.Events.toArray());
        },
        setup: function () {
            _.bindAll(this);
            this._el = $('app-evt-table');
            
            this._headers = Object.keys(app.settings.EVT_GRID_HEADER);
            
            this._grid = new HtmlTable({
                classZebra: 'odd',
                gridContainer : this._el,
                headers: Object.values(app.settings.EVT_GRID_HEADER),
                zebra: true
            });
            this._grid.element.addEvent('click:relay(th)', this._onSort);
            this._grid.body.addEvent('click:relay(tr)', this._rowSelected);
            this._grid.inject(this._el);
            
            $('depToEvid').addEvent('click', this._toggleDepEvid);
        }
    });
    
    cart = new View({
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
            'channelsUpdated': '_loadChannels'
        },
        _loadChannels: function (models) {
            this._slideObj.hide();
            this._grid.empty();
            for (var i = 0, j = models.length; i < j; i++) {
                this._grid.push(Object.values(
                    Object.subset(models[i], this._headers)
                ), {
                    modelNum: i
                });
            }
            this._slideObj.slideIn();
        },
        _adjustSize: function () {
            var titleH = $('app-title').getSize().y,
                offsetH = window.getSize().y - titleH,
                sidebarW = $('app-grid').getSize().x;
            this._el.setStyles({
                top: titleH + 'px',
                height: offsetH + 'px',
                left: sidebarW + 'px'
            });
            this._gridEl.setStyle('height', '300px');
        },
        setup: function () {
            _.bindAll(this);
            this._el = $('app-channel-box');
            this._gridEl = $('channel-grid');
            
            this._headers = Object.keys(app.settings.CHN_GRID_HEADER);
            
            this._grid = new HtmlTable({
                classZebra: 'odd',
                gridContainer : this._gridEl,
                headers: Object.values(app.settings.CHN_GRID_HEADER),
                zebra: true
            });
            this._grid.inject(this._gridEl);
            
            window.addEvent('resize', this._adjustSize);
            this._adjustSize();
            
            this._slideObj = new Fx.Slide(this._el, {
                hideOverflow: false,
                mode: 'horizontal'
            });
            this._slideObj.hide();
        }
    });
    
    /*

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
