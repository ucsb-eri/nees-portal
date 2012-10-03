(function (global) {
	var View = (function () {
		return {
			initialize: function () {
				this.Tabs.initialize();
				this.Map.initialize(this.Tabs.createTab("Map"));
				this.Info.initialize(this.Tabs.createTab("Info"));
				this.Table.initialize();
				this.ChannelBox.initialize();

				$$(".tabTitle")[0].fireEvent("click");
			}
		};
	}) ();
	global.View = View;
}) (this);

(function (global) {
	var Tabs = (function () {
		var
			$super	=	global,
			data	=	{
				// DOM Elements
				bar		:	null,
				view	:	null,
				wrap	:	null,
			},
			settings = {
				wrap	:	"app-viewport"
			};

		return {
			initialize: function () {
				data.wrap = $(settings.wrap);

				data.bar = new Element("div");
				data.bar.set("id", "tabBar");
				data.wrap.adopt(data.bar);

				data.view = new Element("div");
				data.view.set("id", "tabView");
				data.wrap.adopt(data.view);

				window.addEvent("resize", function () {
					return global.Tabs.refreshSize.bind(global.Tabs);
				});
				global.Tabs.refreshSize();
			},
			createTab: function (tabName) {
				var
					title	=	new Element("div"),
					view	=	new Element("div");

				title.set({
					"class"	:	"tabTitle",
					"text"	:	tabName
				});
				title.store("view", view);
				title.addEvent("click", this.openTab.bind(title));

				view.set("class", "tabView");

				data.bar.adopt(title);
				data.view.adopt(view);

				return view;
			},
			openTab: function () {
				$$(".tabTitle, .tabView").removeClass("active");
				// $$(".tabView").hide();
				$$(this, this.retrieve("view")).addClass("active");
				// this.retrieve("view").show();
			},
			refreshSize: function () {
				var size = data.wrap.getCoordinates();
				data.bar.setStyle("height", "25px");
				data.view.setStyle("height", Math.max(size.height - 25, 0) + "px");
			}
		};
	}) ();
	global.Tabs = Tabs;

	var Map = (function () {
		var
			$super	=	global,
			data	=	{
				mapCirc	:	new google.maps.Circle({
					fillColor:		"black",
					fillOpacity:	0.25,
					strokeOpacity:	0
				}),
				mapObj	:	null,
				markers	:	[]
			};

		function addMarker(lat, lon, ml) {
			// @@TODO: Add real size algorithm
			var
				loc		=	new google.maps.LatLng(lat, lon),
				marker	=	new google.maps.Circle({
					center: loc,
					fillColor: "orange",
					fillOpacity: DisplayAlgorithms.getOpacity(ml),
					strokeOpacity: 0,
					map: data.mapObj,
					radius: DisplayAlgorithms.getRadius(ml),
					zIndex: 1
				});

			marker.setMap(data.mapObj);
			data.markers.push(marker);
		};
		function clearMarkers() {
			for (var idx = data.markers.length - 1; idx >= 0; idx--) {
				data.markers[idx].setMap(null);
				data.markers.pop();
			}
		};
		function drawCircle(center, rdx) {
			// Erase previous circle
			data.mapCirc.setMap(null);

			data.mapCirc.setCenter(center);
			data.mapCirc.setRadius(rdx * 1000);
			data.mapCirc.setMap(data.mapObj);
		};

		return {
			initialize: function (el) {
				var mapOpts = {
					mapTypeId: google.maps.MapTypeId.TERRAIN
				};
				data.mapObj = new google.maps.Map(el, mapOpts);
			},

			// marker highlighting functions
			dehighlightMarker: function () {
				for (var idx = 0, j = data.markers, k = j.length; idx < k; idx++) {
					j[idx].set("fillOpacity", j[idx].get("oldOpacity"));
				}
			},
			highlightMarker: function () {
				var selIdx = this.retrieve("rowNum");
				for (var idx = 0, j = data.markers, k = j.length; idx < k; idx++) {
					j[idx].set("oldOpacity", j[idx].get("fillOpacity"));
					j[idx].set("fillOpacity", idx === selIdx ? "1" : "0.2");
				}
			},

			setPosition: function(opts) {
				var center =
						new google.maps.LatLng(opts.site.lat, opts.site.lon);
				if (!data.markers) return;

				if (data.mapCirc.getCenter() &&
					data.mapCirc.getCenter().equals(center) &&
					data.mapCirc.getRadius() == opts.radius * 1000) return;

				data.mapObj.setOptions({
					center	:	center,
				});

				drawCircle(center, opts.radius);
				data.mapObj.fitBounds(data.mapCirc.getBounds());
			},
			update: function (obj) {
				if (obj.getValues) {
					this.setPosition(obj.getValues());
				} else if (obj.getEvents()) {
					clearMarkers();
					for (var idx = 0, j = obj.getEvents(), k = j.length; idx < k; idx++) {
						addMarker(j[idx].lat, j[idx].lng, j[idx].ml);
					}
				}
			}
		};
	}) ();
	global.Map = Map;

	var Info = (function () {
		var
			$super	=	global,
			data	=	{
				// DOM Elements
				test: null,
				wrap: null
			};

		return {
			initialize: function (el) {
				data.wrap = el;
				var testDiv = data.test = new Element("div", {
					"styles" : {
						"backgroundColor"	:	"#FFF",
						"height"			:	"100%",
						"width"				:	"100%",
					},
					text: ""
				});

				data.wrap.adopt(testDiv);
			},
			update: function (obj) {
				data.test.set("text", obj.getValues().site.toString());
			}
		};
	}) ();
	global.Info = Info;

	var Table = (function () {
		var
			settings	=	{
				tableHeader: {
					time:	"Date (UTC)",
					depth:	"Depth",
					dist:	"Dist (km)",
					ml	:	"Mag"
				},
				wrap: "app-evt-table"
			},
			data		=	null,
			el			=	null;
		return {
			initialize: function () {
				el = $(settings.wrap);
				$('depToEvid').addEvent('click', function (evt) {
					if (evt.target.checked) {
						delete settings.tableHeader.depth;
						settings.tableHeader.evid = "Evid";
					} else {
						delete settings.tableHeader.evid;
						settings.tableHeader.depth = "Depth";
					}
					this.render();
				}.bind(this));
			},
			addRow: function (obj) {
				var
					$super		=	global,
					currIdx		=	el.getElements("tr.dataRow").length,
					tableRow	=	new Element("tr");

				tableRow.addClass(currIdx % 2 ? "even" : "odd");
				tableRow.addClass("dataRow");
				tableRow.store("rowNum", currIdx);

				var chkBox = new Element("input", { type: "checkbox" });
				tableRow.adopt(chkBox);

				for (var idx = 0, j = Object.keys(settings.tableHeader), k = j.length; idx < k; idx++) {
					var tableCell = new Element("td");
					obj[j[idx]] && tableCell.appendText(this.parse(obj[j[idx]]));
					tableRow.adopt(tableCell);
				}

				tableRow.addEvent("mouseenter", function () {
					return global.Map.highlightMarker.bind(tableRow);
				});
				tableRow.addEvent("mouseleave", function () {
					return global.Map.dehighlightMarker.bind(tableRow);
				});
				el.adopt(tableRow);
			},
			clear: function () {
				el.empty();
				this.writeHeader();
			},
			parse: function (obj) {
				// @@TODO: Parse data into readable format
				if (~obj.toString().indexOf('UTC')) {
					obj = obj.toString().replace(" (UTC)", "");
				}
				return obj;
			},
			render: function () {
				this.clear();

				var tblData = data.getEvents();
				for (var idx = 0, l = tblData.length; idx < l; idx++) {
					this.addRow(tblData[idx])
				}
			},
			update: function (obj) {
				data = obj;
				this.render();
			},
			writeHeader: function () {
				var
					tHead	=	new Element("thead");
					tRow	=	new Element("tr");

				tRow.adopt(new Element("th")); // Empty col for chkboxes

				for (var idx = 0, j = Object.values(settings.tableHeader), l = j.length;
					idx < l; idx++) {
					var
						headCol = new Element("th", {
							text: j[idx]
						});
					headCol.store("idx", idx);
					headCol.addEvent("click", function (evt) {
						this.sortBy(Object.keys(settings.tableHeader)[evt.target.retrieve("idx")]);
					}.bind(Model.Data));
					tRow.adopt(headCol);
				}
				tHead.adopt(tRow);
				el.adopt(tHead);
			}
		};
	}) ();
	global.Table = Table;

	var ChannelBox = (function () {
		var
			settings	=	{
				sideBar:	"app-grid",
				titleBar:	"app-title"
			};

		function getOffsets() {
			return {
				x: $(settings.sideBar).getSize().x,
				y: $(settings.titleBar).getSize().y
			}
		}
		function getPageHeight() {
			return window.getSize().y;
		}
		return {
			initialize: function () {

/* @@TODO: FILLER CODE - REMOVE */
/*
document.body.adopt(new Element("div", {
	styles: {
		backgroundColor: "#555",
		position: "absolute",
		top: getOffsets().y + "px",
		height: (getPageHeight() - getOffsets().y) + "px",
		left: getOffsets().x + "px",
		width: "300px"
	},
	text: "filler Channel bar",
	id: "testbar"
}));
$("testbar").hide.delay(3000, $("testbar"));
*/
/* END FILLER CODE */

			}
		};
	}) ();
	global.ChannelBox = ChannelBox;

}) (this.View);

