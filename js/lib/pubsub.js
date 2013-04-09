// PubSub.js
// =========
//
// Implementation of Publish/Subscribe pattern. Callbacks subscribed to a topic
//   are fired when data is published to that topic.
//
(function () {
	'use strict';

	var DEBUG = false;

	var PubSub = {
		// Register a function to be called when the specified topic is
		//   published
		subscribe: function (topic, callback) {
			if (DEBUG) console.log('Attached listener to ' + topic + '.');
			this._cb = this._cb || {};
			(this._cb[topic] || (this._cb[topic] = [])).push(callback);
			return this;
		},
		// Fire callbacks subscribed to the specified topic with specified data
		//   object as argument
		publish: function (topic, data) {
			if (!(this._cb && this._cb[topic])) return this;
			if (DEBUG) console.log('Executed ' + this._cb[topic].length +
				' callbacks attached to ' + topic + '.');

			this._cb[topic].each(function (fn) { fn(data) });
			return this;
		}
	};
	window.PubSub = PubSub; // Introduce object to global scope

}) ();
