(function (global) {
	var DisplayAlgorithms = ({
		getOpacity: function(ml) {
			return 0.1 + 0.2 * ml;
		},
		getRadius: function (ml) {
			return 200 + 300 * (ml - 1);
		}
	});
	global.DisplayAlgorithms = DisplayAlgorithms;
}) (this);
