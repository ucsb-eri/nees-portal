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
    var PubSub = {
        subscribe: function (topic, callback) {
            this._cb = this._cb || {};
            (this._cb[topic] || (this._cb[topic] = [])).push(callback);
            return this;
        },
        publish: function (topic, data) {
            if (!(this._cb && this._cb[topic])) return this;
            this._cb.each(function (fn) { fn.apply(this, data) });
            return this;
        }
    };
    exports.PubSub = PubSub;
}) (this);
