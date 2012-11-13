/* vim: set tabstop=4 shiftwidth=4: */
/*jshint mootools:true */

/**
 * Implementation of Publish/Subscribe pattern

 * 
 * -----------------------------------------------------------------------------
 * Layout
 * -----------------------------------------------------------------------------
 *  PubSub
 *  - subscribe(topic, callback)
 *  - publish(topic, data)
 */
(function (exports) {
    var DEBUG = true;
    
    var PubSub = {
        subscribe: function (topic, callback) {
            if (DEBUG) console.log('Attached listener to ' + topic + '.');
            this._cb = this._cb || {};
            (this._cb[topic] || (this._cb[topic] = [])).push(callback);
            return this;
        },
        publish: function (topic, data) {
            if (!(this._cb && this._cb[topic])) return this;
            if (DEBUG) console.log('Executed ' + this._cb[topic].length +
                ' callbacks attached to ' + topic + '.');

            this._cb[topic].each(function (fn) { fn(data) });
            return this;
        }
    };
    exports.PubSub = PubSub;
}) (window);
