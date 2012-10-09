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
    
	var DisplayAlgorithms = global.DisplayAlgorithms = ({
        getCircleOptions: function (ml) {
            return {
                opacity: 0.1 + 0.2 * ml,
                radius: 200 + 300 * (ml - 1)
            };
        }
	});
    
}) (this);
