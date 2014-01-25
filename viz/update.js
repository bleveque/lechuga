var update = (function() {

//Width and height
var width = '300',
    height = '300',
    radius = Math.min(width, height) / 2,
    color = d3.scale.category20(),
    cpus,
    mems,
    arc,
    svg,
    g,
    lastData,
    shouldUpdate = true,
    path,
    vizPieCPU = d3.layout.pie()
                .sort(null)
                .value(function(d) { return d; });
    vizPieMem = d3.layout.pie()
                .sort(null)
                .value(function(d) { return d; });

/**
 * Initial setup for d3 elements
 */
function setup() {
    var jsonData = BrowserUtils.getProcesses();
    cpus = [];
    mems = [];
    for (item in jsonData) {
        if(jsonData.hasOwnProperty(item)) {
            cpus.push(jsonData[item].cpu);
            mems.push(jsonData[item].memory);
        }
    }

    //Create SVG element
    svgCPU = d3.select("#cpuContainer").append("svg")
        .attr({
            height: height,
            width: width
        })
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
        .attr("class","svgCPU")

    svgMem = d3.select("#memContainer").append("svg")
        .attr({
            height: height,
            width: width
        })
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
        .attr("class","svgMem")

    
    arcCPU = d3.svg.arc()
        .innerRadius(radius - 50)
        .outerRadius(radius);

    arcMem = d3.svg.arc()
        .innerRadius(radius - 50)
        .outerRadius(radius);

    gCPU = svgCPU.selectAll(".arc")
        .data(vizPieCPU(cpus))
        .enter().append("g")
        .attr("class", "arc");

    gMem = svgMem.selectAll(".arc")
        .data(vizPieMem(mems))
        .enter().append("g")
        .attr("class", "arc");

    // // Add loading text.
    // gCPU.append("text")
    //     .style("text-anchor", "middle")
    //     .style("font-size","24px")
    //     .text("Loading...");
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
        shouldUpdate = false;
        evt.stopPropagation();
        $('#procMenu').remove();
        $('#lettuceWrap').on('click', function() {
            $('#procMenu').remove();
            shouldUpdate = true;
        });
        var left = evt.clientX,
            top = evt.clientY,
            menu = $(document.createElement('div')),
            nameDiv = $(document.createElement('div')),
            memDiv = $(document.createElement('div')),
            cpuDiv = $(document.createElement('div')),
            removeTabButton,
            process,
            name,
            mem,
            cpu;
        container = container || $('#lettuceWrap');
        menu.attr('id', 'procMenu');
        menu.css({
            position: 'absolute',
            left: left,
            top: top,
            background: 'rgba(255,100,0,0.5)'
        })
        container.append(menu);
        process = getArrayEltByProp(processList, 'id', id);
        mem = process.memory;
        cpu = process.cpu;
        if(process && process.info && process.info.type === 'tab') {
            removeTabButton = $(document.createElement('button'));
            removeTabButton.attr({
                type: 'button'
            });
            removeTabButton.text('close tab');
            removeTabButton.on('click', function(evt) {
                shouldUpdate = true;
                closeTab(process.info.tabid)(evt);
            });
            menu.append(removeTabButton);
            name = process.info.title;
        } else {
            name = process.info.type;
        }
        nameDiv.text(name);
        memDiv.text(mem);
        cpuDiv.text(cpu);
        menu.append(nameDiv);
        menu.append(memDiv);
        menu.append(cpuDiv);

    }
}


/**
 * Filters list of processes to reflect current filter settings
 * @param jsonData     the list of processes to filter
 * @return             the filtered list
 */
function filterProcesses(jsonData) {
    var filter = $('#filterSelect').val().toLowerCase().replace(/ /g,''),
        ret = [],
        type,
        i;
    for(i=0;i<jsonData.length;i++) {
        // debugger;
        type = jsonData[i].info.type;
        if(filter === 'all' || (type === 'tab' &&  filter==='tabsonly') || (type !== 'tab' && filter==='notabs')){
            ret.push(jsonData[i]);
        }
    }
    return ret;
}

/**
 * Update the d3 elements
 * @param jsonData    an array of processes
 */
function displayData(jsonData) {

    if(!shouldUpdate) {
        return;
    }
    $('#cpuContainer').empty(); // Clear
    $('#memContainer').empty(); // Clear

    jsonData = filterProcesses(jsonData);
    cpus = [];
    mems = [];
    for (item in jsonData) {
        if(jsonData.hasOwnProperty(item)) {
            cpus.push(jsonData[item].cpu);
            mems.push(jsonData[item].memory);
        }
    }

    var totalCPU = 0; 
    var totalMem = 0; 

    for(var i=0, len=cpus.length; i<len; i++){
        totalCPU += cpus[i];  //Iterate over your first array and then grab the second element add the values up
    }
    if (totalCPU === 0) {
        return;
    }
    for(var i=0, len=mems.length; i<len; i++){
        totalMem += mems[i];  //Iterate over your first array and then grab the second element add the values up
    }
    if (totalMem === 0) {
        return;
    }

    $('#loading').empty(); // Clear
    $('#filters').css('display','block');

    // For finding maxes
    var dummyCPUS = cpus.slice(0);
    var dummyMems = mems.slice(0);
    maxCPUVals = [];
    maxMemVals = [];

    for(var i=0;i<4;i++) {
        var maxCPUVal = Math.max.apply(Math, dummyCPUS);
        maxCPUVals.push(maxCPUVal);

        var maxMemVal = Math.max.apply(Math, dummyMems);
        maxMemVals.push(maxMemVal);

        var indexCPU = dummyCPUS.indexOf(maxCPUVal);
        var indexMem = dummyMems.indexOf(maxMemVal);

        if (indexCPU > -1) {
            dummyCPUS.splice(indexCPU, 1);
        }
        if (indexMem > -1) {
            dummyMems.splice(indexMem, 1);
        }
    }

    names = []
    for (item in jsonData) {
        if(jsonData.hasOwnProperty(item)) {
            // Determine title to display

            if (maxCPUVals.indexOf(jsonData[item].cpu) === -1) {
                // Not one of the bigger processes, so set its title to a blank string
                // console.log("one: " + jsonData[item].cpu);
                names.push("");
            } else {
                // one of max vals, get real name
                if (jsonData[item].info.type == "tab") {

                    if (jsonData[item].info.title.length >= 10) {
                        var url = jsonData[item].info.url
                        title = url.match(/[^w]\w+\.{1}/g)

                        if (title == null) {
                            names.push(jsonData[item].info.title.slice(1,10))
                        }
                        else {
                            var matchNum = 0;
                            if (title[matchNum].match(/www/g)) {
                                matchNum += 1
                            }
                            if (title[matchNum][0].match(/\w/g)){
                                // first char is alpha, so slice from there
                                finalTitle = title[matchNum].slice(0,-1);
                                names.push(finalTitle);
                            }
                            else {
                                finalTitle = title[matchNum].slice(1,-1);
                                names.push(finalTitle);
                            }

                        }

                    }
                    else {
                        names.push(jsonData[item].info.title);
                    }
                }
                else {
                    names.push(jsonData[item].info.type);
                }
            }
        }
    }

    // Define svg canvas
    svgCPU = d3.select("#cpuContainer").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")

    // Define svg canvas
    svgMem = d3.select("#memContainer").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")



    arcCPU = d3.svg.arc()
        .innerRadius(radius - 50)
        .outerRadius(radius);

    arcMem = d3.svg.arc()
        .innerRadius(radius - 50)
        .outerRadius(radius);


    pathCPU = svgCPU.datum(cpus).selectAll("path")
                          .data(vizPieCPU)
                          .attr("d", arc)

    pathMem = svgMem.datum(mems).selectAll("path")
                          .data(vizPieMem)
                          .attr("d", arc)

    // Defines arcs
    gCPU = svgCPU.selectAll(".arc")
        .data(vizPieCPU(cpus))
        .enter().append("g")
        .attr("class", "arc")
        .style("stroke-width", 3);

    gMem = svgMem.selectAll(".arc")
        .data(vizPieMem(mems))
        .enter().append("g")
        .attr("class", "arc")
        .style("stroke-width", 3);

    // Draws and colors
    gCPU.append("path")
      .attr("d", arcCPU)
      .style("fill", function(d, i) { return color(i); });

    // Draws and colors
    gMem.append("path")
      .attr("d", arcMem)
      .style("fill", function(d, i) { return color(i); });

    svgCPU.selectAll('path').each(function(d, i) {
        $(this).attr('id', jsonData[i].id)
        $(this).on('click', createProcessMenu(parseInt($(this).attr('id'), 10), jsonData));
    });

    svgMem.selectAll('path').each(function(d, i) {
        // debugger;
        $(this).attr('id', jsonData[i].id)
        $(this).on('click', createProcessMenu(parseInt($(this).attr('id'), 10), jsonData));
    });

    gCPU.append("text")
      .attr("transform", function(d) { return "translate(" + arcCPU.centroid(d) + ")"; })
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .style("font-size","8px")
      .data(names)
      .text(function(d, i) {return d; });

    gMem.append("text")
      .attr("transform", function(d) { return "translate(" + arcMem.centroid(d) + ")"; })
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .style("font-size","8px")
      .data(names)
      .text(function(d, i) {return d; });

    gCPU.append("text")
        .style("text-anchor", "middle")
        .style("font-size","24px")
        .text("CPU Usage");

    gMem.append("text")
        .style("text-anchor", "middle")
        .style("font-size","24px")
        .text("Memory Usage");

   }

   function getCPUData(jsonData) {
        var cpus = [];
        for (item in jsonData) {
            if(jsonData.hasOwnProperty(item)) {
                cpus.push(jsonData[item].cpu);
            }
        }

        var total = 0;  //Variable to hold your total

        for(var i=0, len=cpus.length; i<len; i++){
            total += cpus[i];  //Iterate over your first array and then grab the second element add the values up
        }
        if (total === 0) {
            return;
        }

        var dummyCPUS = cpus.slice(0);

        maxCPUVals = [];
        for(var i=0;i<4;i++) {
            var maxVal = Math.max.apply(Math, dummyCPUS);
            maxCPUVals.push(maxVal);
            var index = dummyCPUS.indexOf(maxVal);
            if (index > -1) {
                dummyCPUS.splice(index, 1);
            }
        }

        return cpus;

   }

return {
    displayData: displayData,
    setup:  setup
};

})();
