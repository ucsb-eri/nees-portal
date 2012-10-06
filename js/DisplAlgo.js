(function (global) {
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
