/* vim: set tabstop=4 shiftwidth=4: */
/*jslint mootools:true */
(function (global) {
    'use strict';
    
	var DisplayAlgorithms = ({
        getCircleOptions: function (ml) {
            return {
                opacity: 0.1 + 0.2 * ml,
                radius: 200 + 300 * (ml - 1)
            };
        }
	});
	global.DisplayAlgorithms = DisplayAlgorithms;
}) (this);
