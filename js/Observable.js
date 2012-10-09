/* vim: set tabstop=4 shiftwidth=4: */
/*jshint mootools:true */
(function (global) {
    'use strict';
    
    /**
     * Defines a class of Objects which notifies observers when data is changed.
     */
    var Observable = new Class({
        attach: function () {
            if (!this.observers) this.observers = []; // lazy initialization
            
            for (var idx = 0, j = arguments, k = j.length; idx < k; idx++) {
                if (j[idx].update) {
                    this.observers.push(j[idx]);
                }
            }
        },
        notify: function () {
            if (this.observers) {
                for (var idx = 0, l = this.observers.length; idx < l; idx++) {
                    this.observers[idx].update(this);
                }
            }
        }
    });
    global.Observable = Observable;

}) (this);
