var Popup = (function() {

	window.onload = load;

	function load() {
		console.log("Hello World!");
		console.log(chrome.browsingData);
		console.log(chrome.processes);
		setUpListeners();
	}

	function setUpListeners() {
		chrome.processes.onUpdatedWithMemory.addListener(function(processes) {
			var i, id;
			for(id in processes) {
				if(processes.hasOwnProperty(id)) {
					if(processes[id].network > 0) {
						console.log(processes[id]);//"ID: " + process.osProcessId+", ")
					}
				}
			}
		});
	}

})();