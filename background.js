var BrowserUtils = (function() {
	var historyLength = 10,
		procs = [], // last updated process list
		procHistory = {}, // history of historyLength previous process lists
		networkStats = {},
		cpuStats = {},
		memoryStats = {},
        callbacks = [],
        testFlag = true;
        someTabIds = [];

	/**
	 * Pushes a new element to an array of max length maxLength
	 * If maxLength would be exceeded, removes the first element before pushing
	 */
	// function lettucePush(array, newElt, maxLength) {
	// 	maxLength = maxLength || 10;
	// 	if(array.length >= maxLength) {
	// 		array.splice(0, array.length - maxLength + 1);
	// 	}
	// 	array.push(newElt);
	// }

    function lettucePush(array, newElt, maxLength) {
        maxLength = maxLength || 10;
        // console.log("ARRAY:", array)
        var n = (array[0] && array[0].length) || 0;
        if(array.length >= maxLength) {
            array.splice(0, n - maxLength + 1);
        }

        for (var i=0; i < newElt.length; i++) {
            var proc = newElt[i];
            var procName = proc.info.type === 'tab' ? proc.info.title : proc.info.type;
            if (!array[procName]) {
                array[procName] = [];
                for(var j=0; j<=n; j++) array[procName][j] = 0;
            }
            array[procName].push(proc.cpu)
        }
        // array.push(newElt);
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
            // registerCallback(update.updateData);
            var processesArray = [];
			procs.length = 0; // clear procs array
			for(id in processes) {
                if(processes.hasOwnProperty(id)) {
                    processesArray.push(processes[id]);
					// get_proc_info(processes[id], function(proc) {
					// 	procs.push(proc);
     //                    console.log(proc.info);
					// });
				}
			}

            get_proc_info(processesArray, function() {
    			lettucePush(procHistory, procs, historyLength);
                if (testFlag) {
                    testFlag = false;
                    update.setup(procs);
                }
                sendProcData(procs);

            });

		});
	}

    function get_proc_info(processes, callback) {
        if (processes.length > 0) {
            var process = processes.pop();
            var proc = {
                id: process.id,
                network: process.network,
                cpu: process.cpu,
                memory: process.privateMemory,
                info: {}
            };

            if (process.tabs.length === 1) {
                // This is a tab process
                proc.info.type = "tab";

                var tabid = process.tabs[0];
                proc.info.tabid = tabid;
                someTabIds.push(tabid);


                chrome.tabs.get(tabid,
                    function(tab) {
                        proc.info.title = tab.title;
                        proc.info.url = tab.url;
                        procs.push(proc);
                        get_proc_info(processes, callback);
                        // callback && callback(proc);
                    });
            }
            else {
                // Not a tab
                proc.info.type = process.type;
                procs.push(proc);
                get_proc_info(processes, callback);
                // callback && callback(proc);
            }
        }
        else {
            // processes is empty
            callback && callback();
        }
    }

    function getSomeTabIds() {
    	return someTabIds;
    }

	return {
		getProcesses: getProcesses,
		getNetworkInfo: getNetworkInfo,
		getCpuInfo: getCpuInfo,
		getProcessHistory: getProcessHistory,
		setUpListeners: setUpListeners,
        registerCallback: registerCallback,
        getSomeTabIds: getSomeTabIds
	}
})();

BrowserUtils.setUpListeners();