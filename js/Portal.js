(function (global) {

	document.addEvent("domready", function () {
		[Controller, View, Model].invoke("initialize");

		Controller.attach(Model.Data);
		Model.Data.attach(View.Map, View.Info, Model.Events);
		Model.Events.attach(View.Map, View.Table);

		Controller.retrieveInput();

		$$(".toggle:not(.active)").retrieve("slide").invoke("hide");
		$("site").focus();
	});

}) (this);

