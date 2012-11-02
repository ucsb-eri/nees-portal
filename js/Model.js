/* vim: set tabstop=4 shiftwidth=4: */
/*jslint mootools:true */
var app     =   window.app || (window.app = {}),
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
        
        init: function (options) {
            this._meta = {};
            this._models = [];
            this.setOptions(options);
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
            this._meta      =   json._meta;
            this._models    =   json._data;
            
            if (this.options.changed) {
                this.options.changed(this._models);
            }
        },
        create: function (model) {
            this._models.push(model);
        },
        fetch: function (obj) {
            var queryString = this._objToStr(obj);
            
			new Request.JSON({
				onSuccess: this._processData,
				url: this.options.url
            }).post(queryString);
        },
        getMeta: function () {
            return this._meta;
        },
        toArray: function () {
            return this._models;
        }
    });
    
    Sites = new Collection({
        changed: function () {
            PubSub.publish('eventsUpdated');
        },
        url: 'sites.php'
    });
    app.Models.Sites = Sites;
    
    Events = new Collection({
        changed: function () {
            PubSub.publish('eventsUpdated');
        },
        url: 'events.php'
    });
    app.Models.Events = Events;
    
    Channels = new Collection({
        changed: function () {
            PubSub.publish('channelsUpdated');
        },
        url: 'channels.php'
    });
    app.Models.Events = Events;
    
}) ();
