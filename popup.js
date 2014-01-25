console.log("Hello World!");
chrome.processes.onUpdatedWithMemory.addListener(function(processes) {
	console.log(processes);
});
