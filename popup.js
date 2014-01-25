var Popup = (function() {

	window.onload = load;

	function load() {
		console.log("Hello World!");
		console.log(chrome.browsingData);
		chrome.processes.onUpdatedWithMemory.addListener(function(processes) {
			console.log(processes);
		});
	}

})();