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
                .value(function(d) { return d; }),
    vizPieMem = d3.layout.pie()
                .sort(null)
                .value(function(d) { return d; });

var svgCPU,
    svgMem,
    arcCPU,
    arcMem,
    gCPU,
    pathCPU,
    pathMem,
    gMem;


/**
 * Initial setup for d3 elements
 */
function setup(jsonData) {
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
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    svgMem = d3.select("#memContainer").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    console.log("svgMem:", svgMem);
    console.log("svgCPU:", svgCPU);


    arcCPU = d3.svg.arc()
        .innerRadius(radius - 50)
        .outerRadius(radius);

    arcMem = d3.svg.arc()
        .innerRadius(radius - 50)
        .outerRadius(radius);


    pathCPU = svgCPU.selectAll("path")
                .data(vizPieCPU(cpus))
                .enter()
                .append("path")
                .attr("fill", function(d, i) { return color(i); });

    pathMem = svgMem.selectAll("path")
                .data(vizPieMem(mems))
                .enter()
                .append("path")
                .attr("fill", function(d, i) { return color(i); });

    pathCPU.transition()
        .duration(1000)
        .attr("d", arcCPU)
        .each(function(d) { this._current = d; });

    pathMem.transition()
        .duration(1000)
        .attr("d", arcMem)
        .each(function(d) { this._current = d; });    // gCPU = svgCPU.selectAll(".arc")
    //     .data(vizPieCPU(cpus))
    //     .enter().append("path");
    //     // .attr("class", "arc");

    // gMem = svgMem.selectAll(".arc")
    //     .data(vizPieMem(mems))
    //     .enter().append("path")
    //     .attr("class", "arc");

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
            left: left + 'px',
            top: top + 'px',
        });
        container.append(menu);

        if(menu.offset().left + menu.width() > container.width()) {
            menu.css({
                left: left - menu.width() - 10 + 'px'
            });
        }
        if (menu.offset().top + menu.height() > container.height()) {
            menu.css({
                top: top - menu.height() - 10 + 'px'
            })
        }

        process = getArrayEltByProp(processList, 'id', id);
        mem = convertMetric(process.memory);
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
 * Convert to appropriate metric system unit
 * @param input      number to convert
 * @return           formatted string
 */
function convertMetric(input) {
    var units = ['B', 'KB', 'MB', 'GB'],
        reductions = 0;
    while(input > 1024 && reductions < 3) {
        input /= 1024;
        reductions++;
    }
    return input.toFixed(2) + units[reductions];
}

/**
 * Update the d3 elements
 * @param jsonData    an array of processes
 */
function displayData(jsonData) {

    if(!shouldUpdate) {
        return;
    }
    // $('#cpuContainer').empty(); // Clear
    // $('#memContainer').empty(); // Clear

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

    namesCPU = []
    namesMem = []

    var titleThreshold = .07;

    for (item in jsonData) {
        if(jsonData.hasOwnProperty(item)) {
            // Determine title to display
            if ((jsonData[item].memory / totalMem) < titleThreshold) {
                // Not one of the bigger processes w.r.t memory, so set its title to a blank string
                namesMem.push("");
            } else {
                // one of max vals, get real name
                if (jsonData[item].info.type == "tab") {

                    if (jsonData[item].info.title.length >= 10) {
                        var url = jsonData[item].info.url
                        title = url.match(/[^w]\w+\.{1}/g)

                        if (title == null) {
                            namesMem.push(jsonData[item].info.title.slice(1,10))
                        }
                        else {
                            var matchNum = 0;
                            if (title[matchNum].match(/www/g)) {
                                matchNum += 1
                            }
                            if (title[matchNum][0].match(/\w/g)){
                                // first char is alpha, so slice from there
                                finalTitle = title[matchNum].slice(0,-1);
                                namesMem.push(finalTitle);
                            }
                            else {
                                finalTitle = title[matchNum].slice(1,-1);
                                namesMem.push(finalTitle);
                            }

                        }
                    }
                    else {
                        namesMem.push(jsonData[item].info.title);
                    }
                }
                else {
                    namesMem.push(jsonData[item].info.type);
                }
            }
            if ((jsonData[item].cpu / totalCPU) < titleThreshold) {
                // Not one of the bigger processes w.r.t. cpu, so set its title to a blank string
                namesCPU.push("");
                continue;
            } else {
                // one of max vals, get real name
                if (jsonData[item].info.type == "tab") {

                    if (jsonData[item].info.title.length >= 10) {
                        var url = jsonData[item].info.url
                        title = url.match(/[^w]\w+\.{1}/g)

                        if (title == null) {
                            namesCPU.push(jsonData[item].info.title.slice(1,10))
                        }
                        else {
                            var matchNum = 0;
                            if (title[matchNum].match(/www/g)) {
                                matchNum += 1
                            }
                            if (title[matchNum][0].match(/\w/g)){
                                // first char is alpha, so slice from there
                                finalTitle = title[matchNum].slice(0,-1);
                                namesCPU.push(finalTitle);
                            }
                            else {
                                finalTitle = title[matchNum].slice(1,-1);
                                namesCPU.push(finalTitle);
                            }
                        }
                    }
                    else {
                        namesCPU.push(jsonData[item].info.title);
                    }
                }
                else {
                    namesCPU.push(jsonData[item].info.type);
                }
            }
        }
    }
    console.log("---B---");

    pathCPU.data(vizPieCPU(cpus));
    pathCPU.transition().duration(1000).attrTween("d", arcCPUTween);

    pathMem.data(vizPieMem(mems));
    pathMem.transition().duration(1000).attrTween("d", arcMemTween);

    // Define svg canvas
    // svgCPU = d3.select("#cpuContainer").append("svg")
    //     .attr("width", width)
    //     .attr("height", height)
    //     .append("g")
    //     .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")

    // Define svg canvas
    // svgMem = d3.select("#memContainer").append("svg")
    //     .attr("width", width)
    //     .attr("height", height)
    //     .append("g")
    //     .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")


    // arcCPU = d3.svg.arc()
    //     .innerRadius(radius - 50)
    //     .outerRadius(radius);

    // arcMem = d3.svg.arc()
    //     .innerRadius(radius - 50)
    //     .outerRadius(radius);

    // pathCPU = svgCPU.datum(cpus).selectAll("path")
    //                       .data(vizPieCPU)
    //                       .attr("d", arc)
    // pathCPU = svgCPU.selectAll("path")
    //             .data(vizPieCPU(cpus))
    //             .enter()
    //             .append("path")
    //             .attr("d", arc);

    // pathMem = svgMem.datum(mems).selectAll("path")
    //                       .data(vizPieMem)
    //                       .attr("d", arc)

    // Defines arcs
// <<<<<<< Updated upstream
    // gCPU = svgCPU.selectAll(".arc")
    //     .data(vizPieCPU(cpus))
    //     .enter().append("g")
    //     .attr("class", "arc")
    //     .style("stroke-width", 3);

    // gMem = svgMem.selectAll(".arc")
    //     .data(vizPieMem(mems))
    //     .enter().append("g")
    //     .attr("class", "arc")
    //     .style("stroke-width", 3);

    // // Draws and colors
    // gCPU.append("path")
    //   .attr("d", arcCPU)
    //   .style("fill", function(d, i) { return color(i); });

    // // Draws and colors
    // gMem.append("path")
    //   .attr("d", arcMem)
    //   .style("fill", function(d, i) { return color(i); });

    // // svgCPU.selectAll('path').each(function(d, i) {
    // //     $(this).attr('id', jsonData[i].id)
    // //     $(this).on('click', createProcessMenu(parseInt($(this).attr('id'), 10), jsonData));
    // // });

    // // svgMem.selectAll('path').each(function(d, i) {
    // //     // debugger;
    // //     $(this).attr('id', jsonData[i].id)
    // //     $(this).on('click', createProcessMenu(parseInt($(this).attr('id'), 10), jsonData));
    // // });

    // // gCPU.append("text")
    // //   .attr("transform", function(d) { return "translate(" + arcCPU.centroid(d) + ")"; })
    // //   .attr("dy", ".35em")
    // //   .style("text-anchor", "middle")
    // //   .style("font-size","8px")
    // //   .data(names)
    // //   .text(function(d, i) {return d; });

    // gMem.append("text")
    //   .attr("transform", function(d) { return "translate(" + arcMem.centroid(d) + ")"; })
    //   .attr("dy", ".35em")
    //   .style("text-anchor", "middle")
    //   .style("font-size","8px")
    //   .data(names)
    //   .text(function(d, i) {return d; });

    // // gCPU.append("text")
    // //     .style("text-anchor", "middle")
    // //     .style("font-size","24px")
    // //     .text("CPU Usage");

    // gMem.append("text")
    //     .style("text-anchor", "middle")
    //     .style("font-size","24px")
    //     .text("Memory Usage");
// =======
    // gCPU = svgCPU.selectAll(".arc")
    //     .data(vizPieCPU(cpus))
    //     .enter().append("g")
    //     .attr("class", "arc")
    //     .style("stroke-width", 4);

    // gMem = svgMem.selectAll(".arc")
    //     .data(vizPieMem(mems))
    //     .enter().append("g")
    //     .attr("class", "arc")
    //     .style("stroke-width", 4);

    // // Draws and colors
    // gCPU.append("path")
    //   .attr("d", arcCPU)
    //   .attr("class", "dough")
    //   .style("fill", function(d, i) { return color(i); });

    // // Draws and colors
    // gMem.append("path")
    //   .attr("d", arcMem)
    //   .attr("class", "dough")
    //   .style("fill", function(d, i) { return color(i); });

    // svgCPU.selectAll('path').each(function(d, i) {
    //     $(this).attr('id', jsonData[i].id)
    //     $(this).on('click', createProcessMenu(parseInt($(this).attr('id'), 10), jsonData));
    // });

    // svgMem.selectAll('path').each(function(d, i) {
    //     // debugger;
    //     $(this).attr('id', jsonData[i].id)
    //     $(this).on('click', createProcessMenu(parseInt($(this).attr('id'), 10), jsonData));
    // });

    // gCPU.append("text")
    //   .attr("transform", function(d) { return "translate(" + arcCPU.centroid(d) + ")"; })
    //   .attr("dy", ".35em")
    //   .style("text-anchor", "middle")
    //   .style("font-size","8px")
    //   .data(namesCPU)
    //   .text(function(d, i) {return d; });

    // gMem.append("text")
    //   .attr("transform", function(d) { return "translate(" + arcMem.centroid(d) + ")"; })
    //   .attr("dy", ".35em")
    //   .style("text-anchor", "middle")
    //   .style("font-size","8px")
    //   .data(namesMem)
    //   .text(function(d, i) {return d; });

    // gCPU.append("text")
    //     .style("text-anchor", "middle")
    //     .style("filter", "none")
    //     .style("font-size","24px")
    //     .text("CPU Usage");

    // gMem.append("text")
    //     .style("text-anchor", "middle")
    //     .style("font-size","24px")
    //     .style("filter", "none")
    //     .text("Memory Usage");
// >>>>>>> Stashed changes

   }

function arcCPUTween(a) {
  var i = d3.interpolate(this._current, a);
  this._current = i(0);
  return function(t) {
    return arcCPU(i(t));
  };
}

function arcMemTween(a) {
  var i = d3.interpolate(this._current, a);
  this._current = i(0);
  return function(t) {
    return arcMem(i(t));
  };
}

return {
    displayData: displayData,
    setup:  setup
};

})();
