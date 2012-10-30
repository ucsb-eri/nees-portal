/* vim: set tabstop=4 shiftwidth=4: */
/*jshint mootools:true */

/**
 * Handles data retrieval and storage.
 * 
 * -----------------------------------------------------------------------------
 * Layout
 * -----------------------------------------------------------------------------
 * Model
 *  - initialize()
 *  - sendRequest(type, opts, callback, bind)
 * 
 *     Channels
 *      - initialize()
 *      - processChannels()
 *      - update(evid)
 *     Data
 *      - getValues()
 *      - setValues(opts)
 *      - sortBy(col)
 *      - update(obj)
 *     Events
 *      - getEvents()
 *      - getSiteId()
 *      - processEvents(json)
 *      - update(obj)
 */
(function (global) {
    'use strict';
    
	var Model = global.Model = (function () {
		var settings = {
			requestUrl: 'get.php'
		};

		return {
			initialize:		function () {
            // Initialize child objects
                this.Channels = new Channels();
                this.Data = new Data();
                this.Events = new Events();
            },
            /**
             * Handle AJAX requests
             */
			sendRequest:	function (type, opts, callback, bind) {
				var queryString = '';
				
				for (var k in opts) {
					if (opts[k] && opts.hasOwnProperty(k)) {
						queryString += k + '=' + opts[k] + '&';
					}
				}

				queryString += 'type=' + type;

				new Request.JSON({
					onSuccess: bind ? callback.bind(bind) : callback,
					url: settings.requestUrl
				}).post(queryString);
			}
		};
	}) ();

    var Channels = (function () {
        var
            $super = Model,
            data = {
                channels: null,
                evid: -1
            },
            queryResult = 'channel-results';

        return new Class({
            Extends: global.Observable,
            initialize: function () {},
            getChannels: function () {
                return data.channels;
            },
            processChannels: function (json) {
				data.channels = json;
                
//				$(queryResult).set('text', 'Found ' + json.$meta.rows +
//                    ' results.');

				this.notify();
            },
            update: function (evid, siteId) {
                $super.sendRequest('chn', {
                    evid: evid,
                    siteId: siteId
                }, this.processChannels, this);
            }
        });
    }) ();

	var Data = (function () {
		var
			values	=	{};

		return new Class({
            Extends: global.Observable,
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
            meta        =   {},
			queryResult	=	'query-result';

		return new Class({
            Extends: global.Observable,
			getEvents: function () {
				return events;
			},
            getSiteId: function () {
                return meta.siteId;
            },
			processEvents: function (json) {
				events  =   json.$data;
                meta    =   json.$meta;
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
