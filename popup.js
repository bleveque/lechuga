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
                    var proc = processes[id];
                    get_proc_info(proc, function(info) {console.log("INFO!:", info)});
					// if(processes[id].network > 0) {
					// 	console.log(processes[id]);
					// }
				}
			}
		});
	}

    function get_proc_info(process, callback) {
        var info = {};

        if (process.tabs.length === 1) {
            // This is a tab process
            info["name"] = "tab";

            var tabid = process.tabs[0];
            info["tabid"] = tabid;

            chrome.tabs.get(tabid,
                function(tab) {
                    info["title"] = tab.title;
                    info["url"] = tab.url;
                    callback(info);
                });
        }
        else {
            // Not a tab
            info["name"] = process["type"];
            callback(info);
        }
        // if (process.tabs.length > 0) {
        //     console.log("TYPE:", process.type, "TABS:", process.tabs);
        // }

        return info;
    }


})();