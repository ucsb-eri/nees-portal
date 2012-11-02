/* vim: set tabstop=4 shiftwidth=4: */
/*jslint mootools:true */
var app     =   window.app || (window.app = {}),
    _       =   window._,
    PubSub  =   window.PubSub;

/**
 * Handles user input
 * 
 * -----------------------------------------------------------------------------
 * Layout
 * -----------------------------------------------------------------------------
 * Controller
 */
(function () {
    'use strict';
    
    var inputFields =   $$('.app-input-flds'),
        dateFields  =   $$('.app-input-flds-date');
        
    /**
     * Handle user input
     */
    var Controller = {};
    
    // Handle input
    Controller.Input = {};
    Controller.Input.init = (function () {
        _.bindAll(this, 'getInput');
        
        dateFields.each(function (el) {
            var datePicker = new global.Picker.Date(el,
                app.settings.DP_SETTINGS);
            el.store('_picker', datePicker);
        });
        $('sDate').retrieve('_picker').select(app.settings.FIRST_EVENT);
        $('eDate').retrieve('_picker').select(new Date());
        
        inputFields.addEvent('change', this.getInput);
    });
    Controller.Input.getInput = (function () {
        this._input = {};
        
        for (var idx = 0, l = inputFields.length; idx < l; idx++) {
            this._input[inputFields[idx].get('id')] = inputFields[idx].value;
        }
        
        this._input.page = this._input.maxPages = 0;
        
        PubSub.publish('inputChanged', this._input);
    });
    
    // Event query table navigation
    // @@TODO: page/maxPages should not be 'clickable'. page should have change event
    var tableFields = $$('.event-table-ctrl');
    Controller.TableNav = {
        _currPage: 0,
        _maxPage: 0
    };
    Controller.TableNav.init = (function () {
        tableFields.addEvent('click', this.navOnClick);
        
        global.PubSub.subscribe('inputChanged', function () {
            Controller.TableNav._currPage = 0;
        });
    });
    Controller.TableNav.checkBounds = (function () {
        if (this._currPage === 0) {
            $$('.event-table-ctrl.left-motion').addClass('disabled');
        } else {
            $$('.event-table-ctrl.left-motion').removeClass('disabled');
        }
        
        if (this._currPage == this._maxPage - 1) {
            $$('.event-table-ctrl.right-motion').addClass('disabled');
        } else {
            $$('.event-table-ctrl.right-motion').removeClass('disabled');
        }
    });
    Controller.TableNav.nav = (function (offset) {
        switch (offset) {
        case -2:
            this._currPage = 0;
            break;
        case -1:
            this._currPage--;
            break;
        case 1:
            this._currPage++;
            break;
        case 2:
            this._currPage = this._maxPage - 1;
            break;
        }
        
        this.checkBounds();
        
        app.Models.Events.fetch({ page: this._currPage });
        
        $('table-ctrl-page').set('value', this._currPage + 1);
        $('table-ctrl-total').set('text', this._maxPages);
    });
    Controller.TableNav.navOnClick = (function (evt) {
        var pageOffset = evt.target.get('data-page-offset');
        if (!pageOffset) return;
        
        this.nav(pageOffset);
    });
    
    app.Controller = Controller;

}) ();
