(function (global) {

	var Model = (function () {
		var settings = {
			requestUrl: "get.php"
		};

		return {
			initialize:		function () {}, // Do nothing
			sendRequest:	function (opts, callback, bind) {
				var queryString = "";
				
				for (var k in opts) {
					opts[k] && opts.hasOwnProperty(k) &&
						(queryString += k + "=" + opts[k] + "&");
				}

				// @@TODO: type=evt for testing
				queryString += "type=evt";

				new Request.JSON({
					onSuccess	:	bind ? callback.bind(bind) : callback,
					url			:	settings.requestUrl
				}).post(queryString);
			}
		};
	}) ();
	global.Model = Model;

	var Data = (function () {
		var
			$super				=	Model,
			observers			=	[],
			values				=	{};

		return {
			attach: function () {
				for (var idx = 0, j = arguments, k = arguments.length; idx < k; idx++) {
					j[idx].update && observers.push(j[idx]);
				}
			},
			getValues: function () {
				return values;
			},
			notify: function () {
				for (var idx = 0, l = observers.length; idx < l; idx++) {
					observers[idx].update(this);
				}
			},
			setValues: function (opts) {
				// Gather site details
				var selOption	=	opts.site.options[opts.site.selectedIndex];
				values.site		=	{
					name		:	opts.site.value,
					lat			:	parseFloat(selOption.getAttribute("lat")) || 34.42,
					lon			:	parseFloat(selOption.getAttribute("lon")) || -119.84,

					toString	:	function () {
						return this.name;
					}
				};

				// Set default if no value availible
				values.maxMag	=	opts.maxMag || 9;
				values.minMag	=	opts.minMag || 0;
				values.radius	=	opts.radius || 0;

				// Set if availible
				opts.eDate && (values.eDate = opts.eDate);
				opts.sDate && (values.sDate = opts.sDate);

				values.page			=	opts.page;
				values.itemsPerPage	=	opts.itemsPerPage;

				this.notify();
			},
			sortBy: function (col) {
				// @@TODO implement real sorting stuffs
				if (values.sortBy === col) {
					values.desc = (values.desc + 1) % 2;
				} else {
					values.sortBy = col;
					values.desc = 0;
				}
				values.page = 0;
				this.notify();
			},
			// Receives from: Controller
			update: function (obj) {
				this.setValues(obj.getInput());
			}
		};
	}) ();
	Model.Data = Data;

	var Events = (function () {
		var
			$super		=	Model;
			events		=	[],
			observers	=	[],
			queryResult	=	'query-result'

		return {
			attach: function () {
				for (var idx = 0, j = arguments, k = arguments.length; idx < k; idx++) {
					j[idx].update && observers.push(j[idx]);
				}
			},
			getEvents: function () {
				return events;
			},
			notify: function () {
				for (var idx = 0, l = observers.length; idx < l; idx++) {
					observers[idx].update(this);
				}
			},
			processEvents: function (json) {
				events = json.$data;
				Controller.TableCtrls.setMaxPages(json.$meta.totalPages);
				$(queryResult).set('text', 'Found ' + json.$meta.rows + ' results.');

				this.notify();
			},
			update: function (obj) {
				$super.sendRequest(obj.getValues(), this.processEvents, this);
			}
		};
	}) ();
	Model.Events = Events;

}) (this);

