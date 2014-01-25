var BrowserUtils = (function() {
	var historyLength = 10,
		procs = [], // last updated process list
		procHistory = [], // history of historyLength previous process lists
		networkStats = {},
		cpuStats = {},
		memoryStats = {},
        callbacks = [],
        someTabIds = [];

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

    function formatProcHistory(procHistory) {
        var newProcHistory = {},
            row,
            col,
            proc,
            procName,
            procz;

        for (row = 0; row < procHistory.length; row++) {
            procz = procHistory[row];
            console.log(procz.length, procz, procHistory[row].length);
            for (col = 0; col < procz.length; col++) {
                proc = procz[col];
                procName = proc.info.title || proc.info.type;
                if (!(procName in newProcHistory)) {
                    newProcHistory[procName] = Array.apply(null, new Array(procHistory.length)).map(Number.prototype.valueOf,0);
                }
            }
        }

        // var newProcHistory = {};
        // for (var row = 0; row < procHistory.length; row++) {
        //     procs = procHistory[row];
        //     console.log(procs.length, procs);
        //     for (var col = 0; col < procs.length; col++) {
        //         var proc = procs[col];
        //         console.log(proc.info);
        //         var procName = proc.info.title || proc.info.type;

        //         if (newProcHistory.hasOwnProperty(procName)) {
        //             newProcHistory[procName].push(proc.cpu);
        //         }
        //         else {
        //             newProcHistory[procName] = [proc.cpu];
        //         }
        //     }
        // }
        // console.log("NEWPROCHISTORY:", newProcHistory);
        return newProcHistory;

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
                // console.log(procHistory);
                formatProcHistory(procHistory);
                sendProcData(procs);
    			// update.displayData(procs);
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

    /**
     * Creates and returns a handler to close a tab
     * @param id    the tabId
     * @return      handler to close the relevant tab
     */
    function closeTab(id) {
    	return function(evt) {
    		chrome.tabs.remove(id || someTabIds.pop());
    	}
    }

    /**
     * Returns the first element in an array matching the
     * input property/value pair
     * @param array      the array in question
     * @param prop       the property name
     * @param val        the value of the property to match
     */
    function getArrayEltByProp(array, prop, val) {
    	var i;
    	for(i=0;i<array.length;i++) {
    		if(array[i][prop] === val) {
    			return array[i];
    		}
    	}
    	return null;
    }

    /**
     * Creates and returns a click handler that creates
     * a menu with additional information about the selected
     * process
     * @param id             the id of the selected process
     * @param processList    the list of all processes
     * @return               hover handler
     */
    function createProcessMenu(id, processList, container) {
    	return function(evt) {
    		var left = evt.offset().left,
    			top = evt.offset().top,
    			menu = $(document.createElement('div')),
    			removeTabButton,
    			process;
    		container = container || $('#lettuceWrap');
    		menu.attr('id', 'procMenu');
    		container.append(menu);
    		process = getArrayEltByProp(processList, 'id', id);
    		if(process && process.info && process.info.type === 'tab') {
    			removeTabButton = $(document.createElement('button'));
    			removeTabButton.attr({
    				type: 'button'
    			});
    			removeTabButton.text('close tab');
    			removeTabButton.on('click', closeTab(process.info.tabid));
    			menu.append(removeTabButton);
    		}
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
        closeTab: closeTab,
        getSomeTabIds: getSomeTabIds
	}
})();

BrowserUtils.setUpListeners();