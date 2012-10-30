/* vim: set tabstop=4 shiftwidth=4: */
/*jslint mootools:true */

/**
 * Handles user input
 * 
 * -----------------------------------------------------------------------------
 * Layout
 * -----------------------------------------------------------------------------
 * Controller
 * - initialize()
 * - attach()
 * - get(k)
 * - getInput()
 * - notify()
 * - set(k, v)
 * - update()
 * 
 *     TableCtrls
 *     - initialize()
 *     - gotoPage(opt)
 *     - resetPageCount()
 *     - setCurrentPage(inputNum)
 *     - setMaxPages(maxPages)
 */
(function (global) {
    'use strict';
    
    /**
     * Handle user input
     */
	var Controller = global.Controller = (function () {
		var
			ctrls		=	["site", "radius", "minMag", "maxMag", "sDate",
                "eDate", "itemsPerPage"],
			input		=	{},
			observers	=	[];
            
		function retrieveInput() {
			input = {};

			for (var idx = 0, l = ctrls.length; idx < l; idx++) {
				var val = ctrls[idx];

				if (typeOf(val) === 'string') {
					val == 'site' ?
						input[val] = $(val) :
						input[val] = $(val).value;
				}
			}

			input.page			=	0;
			input.maxPages		=	0;

			Controller.TableCtrls.resetPageCount();
			Controller.notify();
		}

		return {
			initialize: function () {
                var firstEvent = new Date(0);
                firstEvent.setUTCSeconds(979439174);
                
				// Initialize input fields
				ctrls.each(function (strId) {
					if (~strId.toLowerCase().indexOf('date')) {
						var picker = new global.Picker.Date($(strId), {
							format:			'%x',
							pickerClass:	'datepicker_jqui',
							positionOffset:	{ x: 0, y: 5 },
							yearPicker:		true
						});
                        
                        $(strId).store('picker', picker);
					} else {
						$(strId).addEvent('change',
								Controller.update.bind(Controller));
						$(strId).addEvent('keypress', function (evt) {
							// update if Enter pressed
							if (evt.code === 13) {
								this.update();
							}
						}.bind(Controller));
					}
				});
                
                $('sDate').retrieve('picker').select(firstEvent);
                $('eDate').retrieve('picker').select(new Date());
                $$('datepicker_jqui').addEvent('select',
                    Controller.update.bind(Controller));

				// Initialize sliders
				$$('.toggle>span').each(function (el) {
					var
						sWrap	=	el.getParent(),
						sObj	=	new Fx.Slide(
                            sWrap.getElements('.toggle-target')[0], {
								duration: 'short',
								link: 'chain',
								resetHeight: true
						});

					sWrap.store('slide', sObj);

					el.addEvent('click', function() {
						if (this.hasClass('active')) {
							this.retrieve('slide').slideOut().chain(
								function () {
									this.removeClass('active');
								}.bind(this)
							);
						} else {
							this.retrieve('slide').slideIn().chain(
								function () {
									this.addClass('active');
								}.bind(this)
							);
						}
					}.bind(sWrap));
				});
                
				this.TableCtrls = new TableCtrls();
			},
			attach: function () {
				for (var idx = 0, j = arguments, k = arguments.length;
					idx < k; idx++) {
					if (j[idx].update) observers.push(j[idx]);
				}
			},
			get: function (k) {
				return input[k];
			},
			getInput: function () {
				return input;
			},
			notify: function () {
				for (var idx = 0, l = observers.length; idx < l; idx++) {
					observers[idx].update(this);
				}
			},
			set: function (k, v) {
				return input[k] = v;
			},
			update: function () {
				retrieveInput();
			}
		};
	}) ();
    
    var Main = Controller.Main = (function () {
    });
    
	var TableCtrls = (function () {
		var	$super		=	Controller,
			settings    =	{
				first:	'table-ctrl-first',
				last:	'table-ctrl-last',
				next:	'table-ctrl-next',
				prev:	'table-ctrl-prev',

				maxPages:	'table-ctrl-total',
				page:		'table-ctrl-page'
			};
		return new Class({
			initialize: function () {
				$(settings.first).addEvent('click', this.gotoPage(-2));
				$(settings.last).addEvent('click', this.gotoPage(2));
				$(settings.next).addEvent('click', this.gotoPage(1));
				$(settings.prev).addEvent('click', this.gotoPage(-1));

				$(settings.page).addEvent('change', function () {
					this.setCurrentPage($(settings.page).get('value') - 1);
				}.bind(this));
			},
			gotoPage: function (opt) {
				var     target	=	0,
					    navOpt	=	opt;

				return (function () {
					var
						currPage	=	$super.get('page'),
						maxPages	=	$super.get('maxPages');

					switch (navOpt) {
					case -2: // First
						target = 0; break;
					case -1: // Prev
						target = currPage - 1; break;
					case 1: // Next
						target = currPage + 1; break;
					case 2: // Last
						target = maxPages - 1; break;
					}

					this.setCurrentPage(target);
				}.bind(this));
			},
			resetPageCount: function () {
				$(settings.page).set('value', 1);
			},
			setCurrentPage: function (inputNum) {
				var pageNum = parseInt(inputNum, 10);
				if (pageNum < 0 || pageNum >= $super.get('maxPages')) {
					$(settings.page).set('value', $super.get('page') + 1);
					return;
				}

				$(settings.page).set('value', pageNum + 1);
				$super.set('page', pageNum);
				$super.notify();
			},
			setMaxPages: function (maxPages) {
				$super.set('maxPages', maxPages);
				$(settings.maxPages).set('text', maxPages);
			}
		});
	}) ();

}) (this);
