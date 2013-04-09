// tab.js
// ======
//
// Provides tab functionality for a specified element
//
// Structure:
// - el: Element given as parameter in constructor
//   - #tabBar: Contains <div>s acting as tabs
//   - #tabView: Holds content <div>s for each tab
(function () {
    'use strict';
    
    var Tabs = new Class({
		// Constructor
        initialize: function (wrap) {
            _.bindAll(Tabs);
            this._wrap = wrap;
            
            this._tabCounter = 0; // Used as tab "id"
            
            this._bar = new Element('div');
            this._bar.set('id', 'tabBar');
            this._wrap.adopt(this._bar);
            
            this._view = new Element('div');
            this._view.set('id', 'tabView');
            this._wrap.adopt(this._view);
            
            window.addEvent('resize', this._updateSize.bind(this));
            this._updateSize();
        },
        // Adjusts the size of the contextPane when parent element is resized.
        _updateSize: function () {
            var size = this._wrap.getCoordinates();
            this._bar.setStyle('height', '45px');
            this._view.setStyle('height', Math.max(size.height - 45, 0) + 'px');
        },
        // Adds a tab with a title specified by name and returns the contentPane
        //   of the tab.
        add: function (name) {
            var title   =   new Element('div'),
                view    =   new Element('div');
            
            title.set({
                'class': 'tabTitle',
                'text': name
            });
            title.store('tabNum', this._tabCounter);
            this._tabCounter++;
            title.addEvent('click', function (evt) {
                this.select(evt.target.retrieve('tabNum'));
            }.bind(this));
            this._bar.adopt(title);
            
            view.set('class', 'tabView');
            this._view.adopt(view);
            
            this.select(0);
            
            return view;
        },
		// Activate a specified tab
        select: function (idx) {
			// Hide all tabViews
            this._wrap.getElements('.tabTitle, .tabView').removeClass('active');
            this._wrap.getElements('.tabView').hide();

			// Show selected tabView
            this._wrap.getElements('.tabTitle')[idx].addClass('active');
            this._wrap.getElements('.tabView')[idx].addClass('active');
            this._wrap.getElements('.tabView')[idx].show();
        }
    });
    window.Tabs = Tabs;

}) ();
