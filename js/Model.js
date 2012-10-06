/* vim: set tabstop=4 shiftwidth=4: */
/*jshint mootools:true */
(function (global) {
    'use strict';
    
	var Model = (function () {
		var settings = {
			requestUrl: 'get.php'
		};

		return {
			initialize:		function () {
                this.Channels = new Channels();
                this.Data = new Data();
                this.Events = new Events();
            }, // Do nothing
			sendRequest:	function (type, opts, callback, bind) {
				var queryString = '';
				
				for (var k in opts) {
					if (opts[k] && opts.hasOwnProperty(k)) {
						queryString += k + '=' + opts[k] + '&';
					}
				}

				// @@TODO: type=evt for testing
				queryString += 'type=' + type;

				new Request.JSON({
					onSuccess: bind ? callback.bind(bind) : callback,
					url: settings.requestUrl
				}).post(queryString);
			}
		};
	}) ();
	global.Model = Model;
    
    var Channels = (function () {
        return new Class({
            Extends: Observable,
            initialize: function () {}
        });
    }) ();
    
	var Data = (function () {
		var
			values		=	{};

		return new Class({
            Extends: Observable,
			getValues: function () {
				return values;
			},
			setValues: function (opts) {
				// Gather site details
				var selOption	=	opts.site.options[opts.site.selectedIndex];
				values.site		=	{
					name: opts.site.value,
					lat: parseFloat(selOption.getAttribute('lat')),
					lon: parseFloat(selOption.getAttribute('lon')),

					toString: function () {
						return this.name;
					}
				};

				// Set default if no value availible
				values.maxMag =	opts.maxMag ? opts.maxMag : 9;
				values.minMag = opts.minMag ? opts.minMag : 0;
				values.radius = opts.radius ? opts.radius : 0;

				// Set if availible
				opts.eDate  &&  (values.eDate = opts.eDate);
				opts.sDate  &&  (values.sDate = opts.sDate);

				values.page			=	opts.page;
				values.itemsPerPage	=	opts.itemsPerPage;

				this.notify();
			},
			sortBy: function (col) {
				if (values.sortBy === col) { // Toggle asc/desc if same sortCol
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
		});
	}) ();

	var Events = (function () {
		var
			$super		=	Model,
			events		=	[],
			queryResult	=	'query-result';

		return new Class({
            Extends: Observable,
			getEvents: function () {
				return events;
			},
			processEvents: function (json) {
				events = json.$data;
				global.Controller.TableCtrls.setMaxPages(json.$meta.totalPages);
				$(queryResult).set('text', 'Found ' + json.$meta.rows +
                    ' results.');

				this.notify();
			},
			update: function (obj) {
				$super.sendRequest('evt', obj.getValues(),
                    this.processEvents, this);
			}
		});
	}) ();

}) (this);
