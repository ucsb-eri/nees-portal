/* vim: set tabstop=4 shiftwidth=4: */
/*jshint mootools:true */

/**
 * Creates a toggleable element
 * 
 * -----------------------------------------------------------------------------
 * Layout
 * -----------------------------------------------------------------------------
 *  Toggle
 *  - constructor(title, target)
 */
(function (exports) {
    'use strict';
    
    var slideOptions = {
            duration: 'short',
            link: 'chain',
            resetHeight: true
        },
        Toggle = (function (title, target) {
            var slideObj    =   new Fx.Slide(target, slideOptions),
                wrap        =   title.getParent();
            
            title.addEvent('click', function () {
                if (wrap.hasClass('active')) {
                    slideObj.slideOut().chain(wrap.removeClass('active'));
                } else {
                    slideObj.slideIn().chain(wrap.addClass('active'));
                }
            });
        });
    
    exports.Toggle = Toggle;
}) (this);