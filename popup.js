var Popup = (function() {

	window.onload = load;

	function load() {
		console.log(chrome.browsingData);
		console.log(chrome.processes);
        BrowserUtils.registerCallback(update.displayData);
		BrowserUtils.setUpListeners();
		update.setup();
		$('#tabButton').on('click', BrowserUtils.closeTab());
	}
})();

var Achievements = (function() {

})();