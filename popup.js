var Popup = (function() {

	window.onload = load;

	function load() {
		console.log(chrome.browsingData);
		console.log(chrome.processes);
        BrowserUtils.registerCallback(update.displayData);
		BrowserUtils.setUpListeners();
	}
})();

var BrowserUtils = (function() {
	var historyLength = 10,
		procs = [], // last updated process list
		procHistory = [], // history of historyLength previous process lists
		networkStats = {},
		cpuStats = {},
		memoryStats = {},
        callbacks = [];

	/**
	 * Pushes a new element to an array of max length maxLength
	 * If maxLength would be exceeded, removes the first element before pushing
	 */
	function lettucePush(array, newElt, maxLength) {
		maxLength = maxLength || 10;
		if(array.length >= maxLength) {
			array.splice(0, array.length - maxLength + 1);
		}
		array.push(newElt);
	}

	/**
	 * Returns array of pre-processed processes
	 * Each process object has properties for id, network, cpu, and info
	 */
	function getProcesses() {
		return procs;
	}

	/**
	 * Returns array of arrays of pre-processed processes at recent times
	 * The max length of this array is governed by historyLength above
	 */
	function getProcessHistory() {
		return procHistory;
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

	/**
	 * Get array of network information using extractInfoArray
	 */
	function getNetworkInfo(processes) {
		return extractInfoArray(processes, 'network');
	}

	/**
	 * Get array of cpu information using extractInfoArray
	 */
	function getCpuInfo(processes) {
		return extractInfoArray(processes, 'cpu');
	}

    /**
     * Adds a callback to the callbacks list. These callbacks are invoked with
     * data from the chrome.processes api.
     */
    function registerCallback(callback) {
        callbacks.push(callback)
    }

    /**
     * Wrapper function that invokes each registered callback with the proc data.
     */
    function sendProcData(data) {
        for (var i = 0; i < callbacks.length; i++) {
            callbacks[i](data);
        }
    }

	/**
	 * Set up chrome.processes listeners.
     * This adds a listener to chrome.processes, which retrieves information on
     * all chrome processes, and sends formatted data to all registered callbacks.
	 */
	function setUpListeners() {
		chrome.processes.onUpdatedWithMemory.addListener(function(processes) {
			procs.length = 0; // clear procs array
			for(id in processes) {
				if(processes.hasOwnProperty(id)) {
					get_proc_info(processes[id], function(proc) {
						procs.push(proc);
					});
				}
			}

			lettucePush(procHistory, procs, historyLength);

            sendProcData(procs);
			// update.displayData(procs);

			// console.log(processes);

			// console.log(procs);

			// var i, id, text, processDiv;
			// for(id in processes) {
			// 	if(processes.hasOwnProperty(id)) {

			// 		networkStats[id] = processes[id].network;
			// 		cpuStats[id] = processes[id].cpu;
			// 		if(processes[id].network > 0) {
			// 			console.log(processes[id]);//"ID: " + process.osProcessId+", ")
			// 		}
			// 	}
			// }
			// for(id in networkStats) {
			// 	if(networkStats.hasOwnProperty(id)){
			// 		if($('#networkProcess_'+id).length > 0) {
			// 			text = $('#networkProcess_'+id).text();
			// 			$('#networkProcess_'+id).text(text + " | "+networkStats[id]);

			// 			text = $('#cpuProcess_'+id).text();
			// 			$('#cpuProcess_'+id).text(text + " | "+cpuStats[id].toFixed(3));
			// 		} else {
			// 			processDiv = $(document.createElement('div')).attr('id', 'networkProcess_'+id);
			// 			$('#networkStats').append(processDiv);
			// 			processDiv.text(id + " :: " + networkStats[id]);

			// 			processDiv = $(document.createElement('div')).attr('id', 'cpuProcess_'+id);
			// 			$('#cpuStats').append(processDiv);
			// 			processDiv.text(id + " :: " + cpuStats[id].toFixed(3));
			// 		}
			// 	}
			// }
		});
	}

    function get_proc_info(process, callback) {
        var proc = {
            id: process.id,
            network: process.network,
            cpu: process.cpu,
            info: {}
        };

        if (process.tabs.length === 1) {
            // This is a tab process
            proc.info.type = "tab";

            var tabid = process.tabs[0];
            proc.info.tabid = tabid;

            chrome.tabs.get(tabid,
                function(tab) {
                    proc.info.title = tab.title;
                    proc.info.url = tab.url;
                    callback && callback(proc);
                });
        }
        else {
            // Not a tab
            proc.info.type = process["type"];
            callback && callback(proc);
        }

    }

	return {
		getProcesses: getProcesses,
		getNetworkInfo: getNetworkInfo,
		getCpuInfo: getCpuInfo,
		getProcessHistory: getProcessHistory,
		setUpListeners: setUpListeners,
        registerCallback: registerCallback
	}
})();