var Popup = (function() {

	window.onload = load;

	var procs = [];

	var networkStats = {},
		cpuStats = {},
		memoryStats = {};

	function load() {
		console.log(chrome.browsingData);
		console.log(chrome.processes);
		setUpListeners();
	}

	function get_proc_info(process) {
		return {};
	}

	function getProcesses() {
		return procs;
	}

	/**
	 * Returns an array of _____ info
	 * @param processes    array of process objects (returned by
	 *                     getProcesses)
	 * @param prop         property name to extract
	 * @return             array of {id: <proc id>, val: <info_val>}
	 */
	function extractInfoArray(processes, prop) {
		var infoArray = [],
			i;
		for(i=0;i<processes.length;i++) {
			infoArray.push({
				id: processes[i].id,
				val: processes[i][prop]
			});
		}
		return infoArray;
	}

	function getNetworkInfo(processes) {
		return extractInfoArray(processes, 'network');
	}

	function getCpuInfo(processes) {
		return extractInfoArray(processes, 'cpu');
	}


	/**
	 * Set up chrome.processes listeners
	 */
	function setUpListeners() {
		chrome.processes.onUpdatedWithMemory.addListener(function(processes) {
			procs.length = 0; // clear procs array
			for(id in processes) {
				if(processes.hasOwnProperty(id)) {
					procs.push({
						id: id,
						network: processes[id].network,
						cpu: processes[id].cpu,
						info: get_proc_info(processes[id])
					});
				}
			}
			console.log(processes);
			console.log(getNetworkInfo(procs));







			var i, id, text, processDiv;
			for(id in processes) {
				if(processes.hasOwnProperty(id)) {
					networkStats[id] = processes[id].network;
					cpuStats[id] = processes[id].cpu;
					if(processes[id].network > 0) {
						console.log(processes[id]);//"ID: " + process.osProcessId+", ")
					}
				}
			}
			for(id in networkStats) {
				if(networkStats.hasOwnProperty(id)){
					if($('#networkProcess_'+id).length > 0) {
						text = $('#networkProcess_'+id).text();
						$('#networkProcess_'+id).text(text + " | "+networkStats[id]);

						text = $('#cpuProcess_'+id).text();
						$('#cpuProcess_'+id).text(text + " | "+cpuStats[id].toFixed(3));
					} else {
						processDiv = $(document.createElement('div')).attr('id', 'networkProcess_'+id);
						$('#networkStats').append(processDiv);
						processDiv.text(id + " :: " + networkStats[id]);

						processDiv = $(document.createElement('div')).attr('id', 'cpuProcess_'+id);
						$('#cpuStats').append(processDiv);
						processDiv.text(id + " :: " + cpuStats[id].toFixed(3));
					}
				}
			}
		});
	}

	return {
		getProcesses: getProcesses,
		getNetworkInfo: getNetworkInfo,
		getCpuInfo: getCpuInfo
	}

})();