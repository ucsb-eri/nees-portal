/* vim: set tabstop=4 shiftwidth=4: */
/*jslint mootools:true */
var app     =   window.app || (window.app = {}),
    _       =   window._,
    Picker  =   window.Picker,
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
        _.bindAll(this, 'getInput', 'getSites', 'loadSites');
        
        dateFields.each(function (el) {
            var datePicker = new Picker.Date(el,
                app.settings.DP_SETTINGS);
            el.store('_picker', datePicker);
        });
        $('sDate').retrieve('_picker').select(app.settings.FIRST_EVENT);
        $('eDate').retrieve('_picker').select(new Date());
        
        this.getSites();
        
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
    Controller.Input.getSites = (function () {
        new Request({
            async: false,
            onSuccess: this.loadSites,
            url: 'sites.xml'
        }).get();
    });
    Controller.Input.loadSites = (function (txt, xml) {
        function addOption(node, level, parent) {
            var thisEl;
            if (node.tagName === 'category') {
                thisEl = new Element('optgroup', {
                    label: node.getAttribute('name'),
                    id: node.getAttribute('id')
                });
            } else {
                thisEl = new Element('option', {
                    id: node.getAttribute('id'),
                    lat: node.getAttribute('lat'),
                    lon: node.getAttribute('lon'),
                    // Insert Unicode &nbsp; character to create dropdown
                    //   hierarchy
                    text: (new Array(level + 1).join('\u00a0\u00a0')) +
                        node.getAttribute('name') +
                            ' (' + node.getAttribute('descrip') + ')',
                    value: node.getAttribute('id')
                });
            }
            parent.adopt(thisEl);
            if (node.hasChildNodes()) {
                for (var i = 0, j = node.childNodes, k = j.length; i < k; i++) {
                    addOption(j[i], level + 1, (node.tagName === 'category') ?
                        thisEl : parent);
                }
            }
        }
        for (var i = 0, j = xml.getElementsByTagName('category'), k = j.length;
                i < k; i++) {
            addOption(j[i], 0, $('site'));
        }
    });
    
    // Event query table navigation
    // @@TODO: page/maxPages should not be 'clickable'. page should have change event
    Controller.TableNav = {
        _currPage: 0,
        _maxPage: 0
    };
    Controller.TableNav.init = (function () {
        _.bindAll(Controller.TableNav);
        $('table-ctrls').addEvent('click:relay(div.btn)',
            Controller.TableNav.navOnClick);
        
        PubSub.subscribe('inputChanged', function () {
            Controller.TableNav._currPage = 0;
        });
        PubSub.subscribe('eventsUpdated', function () {
            var metaData = app.Models.Events.getMeta();
            this._currPage = metaData.pageNum;
            this._maxPage = metaData.totalPages;
            
            this.checkBounds();
        }.bind(this));
        
        this.checkBounds();
    });
    Controller.TableNav.checkBounds = (function () {
        if (this._currPage === 0) {
            $$('.table-ctrl.left-motion').addClass('disabled');
        } else {
            $$('.table-ctrl.left-motion').removeClass('disabled');
        }
        
        if (this._currPage == this._maxPage - 1) {
            $$('.table-ctrl.right-motion').addClass('disabled');
        } else {
            $$('.table-ctrl.right-motion').removeClass('disabled');
        }
    });
    Controller.TableNav.nav = (function (offset) {
        switch (parseInt(offset, 10)) {
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
        
        app.Controller.Input._input.page = this._currPage;
        app.Controller.Input._input.maxPages = this._maxPage;
        app.Models.Events.fetch(app.Controller.Input._input);
    });
    Controller.TableNav.navOnClick = (function (evt, btn) {
        this.nav(btn.get('data-page-offset'));
        evt.preventDefault();
    });
    
    app.Controller = Controller;

}) ();
