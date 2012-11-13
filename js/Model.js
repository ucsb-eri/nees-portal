/* vim: set tabstop=4 shiftwidth=4: */
/*jslint mootools:true */
var app     =   window.app || (window.app = {}),
    _       =   window._,
    PubSub  =   window.PubSub;

/**
 * Handles application data
 * 
 * -----------------------------------------------------------------------------
 * Layout
 * -----------------------------------------------------------------------------
 * Model
 */
(function () {
    var Collection, Sites, Events, Channels;
    
    // Initialize app.Models namespace
    app.Models = {};
    
    // Collection Class holds data models
    Collection = new Class({
        Implements: Options,
        options: {},
        
        initialize: function (options) {
            _.bindAll(this);
            this._meta = {};
            this._models = [];
            this.setOptions(options);
            
            if (this.options.fetchOn) {
                this.options.fetchOn.split(',').each(function (topic) {
                    PubSub.subscribe(topic, this.fetch);
                }.bind(this));
            }
        },
        _objToStr: function (obj) {
            var values = [];
            
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    values.push(key + '=' + obj[key]);
                }
            }
            return values.join('&');
        },
        _processData: function (json) {
            this._meta      =   json.$meta;
            this._models    =   json.$data;
            
            if (this.options.changed) {
                this.options.changed(this._models);
            }
        },
        create: function (model) {
            this._models.push(model);
        },
        fetch: function (obj) {
            var queryString = obj ? this._objToStr(obj) : '';
            
			new Request.JSON({
				onSuccess: this._processData,
				url: this.options.url
            // }).post(queryString);
			}).get(queryString);
        },
        getMeta: function () {
            return this._meta;
        },
        toArray: function () {
            return this._models;
        }
    });
    
    Events = new Collection({
        changed: function (data) {
            PubSub.publish('eventsUpdated', data);
        },
        fetchOn: 'inputChanged',
        url: 'events.json'
        //url: 'events.php'
    });
    app.Models.Events = Events;
    
    Channels = new Collection({
        changed: function (data) {
            PubSub.publish('channelsUpdated', data);
        },
        fetchOn: 'eventSelected',
        url: 'channels.json'
    });
    app.Models.Events = Events;
    
}) ();
