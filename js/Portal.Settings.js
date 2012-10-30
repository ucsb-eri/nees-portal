/* vim: set tabstop=4 shiftwidth=4: */
/*jslint mootools:true */

/**
 * Specifies algorithms controlling how certain objects are displayed
 * 
 * -----------------------------------------------------------------------------
 * Layout
 * -----------------------------------------------------------------------------
 * DisplayAlgorithms
 *  - getCircleOptions(ml)
 */
(function (global) {
    'use strict';
    
	var Settings = global.Settings= ({
        getCircleOptions: function (ml) {
            return {
                fillOpacity: 0.1 + 0.2 * ml,
                scale: 3 + Math.pow(2 * ml, 1.5)
            };
        }
	});
    
}) (this);
