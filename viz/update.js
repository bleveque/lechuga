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
    gMem,
    label_group;

    
var cpuTotal = 0;
var memTotal = 0;


/**
 * Initial setup for d3 elements
 */
function setup(jsonData) {
    var jsonData = BrowserUtils.getProcesses();
    cpus = [];
    mems = [];
    for (item in jsonData) {
        if(jsonData.hasOwnProperty(item)) {
            cpuDatum = jsonData[item].cpu;
            memDatum = jsonData[item].memory
            
            cpuTotal += cpuDatum;
            memTotal += memDatum;

            cpus.push(cpuDatum);
            mems.push(memDatum);
        }
    }

    cpuTotal = Math.round(cpuTotal);
    // Convert to Mb from bytes
    memTotal = Math.round(memTotal * 9.53674 * Math.pow(10,-7));

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

    svgCPU.append("text")
        .style("text-anchor", "middle")
        .style("font-size","24px")
        .text("CPU Usage");

    svgCPU.append("text")
        .style("text-anchor", "middle")
        .style("font-size","18px")
        .attr("dy", 30)
        .text("Total: " + cpuTotal + " (%)");

    svgMem.append("text")
        .style("text-anchor", "middle")
        .style("font-size","24px")
        .text("Mem Usage");

    svgMem.append("text")
        .style("text-anchor", "middle")
        .style("font-size","18px")
        .attr("dy", 30)
        .text("Total: " + memTotal + " (Mb)");

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

    $('path').attr({
        stroke: 'rgba(255,255,255,0.5)',
        'stroke-width': '2'
    });

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

    // gCPU = svgCPU.selectAll(".arc")
    //     .data(vizPieCPU(cpus))
    //     .enter().append("path")
    //     .attr("class", "arc");

    gMem = svgMem.selectAll(".arc")
        .data(vizPieMem(mems))
        .enter().append("path")
        .attr("class", "arc");

    var nameLists = determineNames(jsonData);
    var namesCPU = nameLists[0];
    var namesMem = nameLists[1];

    cpu_label_group = d3.select("#cpuContainer svg").append("g")
                    .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");

    cpu_label_text = cpu_label_group.selectAll("text")
        .data(vizPieCPU(cpus))
        .enter()
        .append("text")
        .attr("transform", function(d) {return "translate(" + arcCPU.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .style("font-size", "8px")
        .text(function(d,i) { return namesCPU[i]; });

    cpu_label_text.transition()
        .duration(1000)
        .attr("d", arcCPU)
        .each(function(d) { this._current = d; });


    mem_label_group = d3.select("#memContainer svg").append("g")
                    .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");

    mem_label_text = mem_label_group.selectAll("text")
        .data(vizPieMem(mems))
        .enter()
        .append("text")
        .attr("transform", function(d) {return "translate(" + arcMem.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .style("font-size", "8px")
        .text(function(d,i) { return namesMem[i]; });

    mem_label_text.transition()
        .duration(1000)
        .attr("d", arcCPU)
        .each(function(d) { this._current = d; });


        // .attr("transform", function(d) {return "translate(" + arcCPU.centroid(d) + ")"; })


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
 * Analogous to the function above
 */
function getArrayIndexByProp(array, prop, val) {
    var i;
    for(i=0;i<array.length;i++) {
        if(array[i][prop] === val) {
            return i;
        }
    }
    return -1;
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
            nameDiv = $(document.createElement('div')).attr('id', 'nameDiv'),
            memDiv = $(document.createElement('div')),
            cpuDiv = $(document.createElement('div')),
            removeTabButton,
            removeTabButtonContainer,
            process,
            height,
            name,
            arrInd,
            mem,
            tab = false,
            cpu;
        container = container || $('#lettuceWrap');
        menu.attr('id', 'procMenu');
        menu.css({
            left: left + 'px',
            top: top + 'px',
        });
        container.append(menu);



        process = getArrayEltByProp(processList, 'id', id);
        mem = convertMetric(process.memory);
        cpu = process.cpu.toFixed(2) + "% CPU";
        if(process && process.info && process.info.type === 'tab') {
            removeTabButtonContainer = $(document.createElement('div'));
            removeTabButton = $(document.createElement('button'));
            removeTabButton.attr({
                type: 'button'
            });
            removeTabButton.text('Close Tab');
            removeTabButton.on('click', function(evt) {
                shouldUpdate = true;
                // arrInd = getArrayIndexByProp(processList, 'id', id);
                // (arrInd >= 0) && processList.splice(arrInd, 1);
                closeTab(process.info.tabid)(evt);
            });
            removeTabButtonContainer.append(removeTabButton);
            tab = true;
            name = process.info.title;
            height = menu.height();
            menu.css('height', height + 30 + "px");
        } else {
            name = process.info.type;
        }
        nameDiv.text(name);
        memDiv.text(mem);
        cpuDiv.text(cpu);
        menu.append(nameDiv);
        menu.append(memDiv);
        menu.append(cpuDiv);
        if(tab) {
            menu.append(removeTabButtonContainer);
        }

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
        type = jsonData[i].info.type;
        if(!jsonData[i].memory) {
            debugger;
        }
        if(filter === 'all' || (type === 'tab' &&  filter==='tabsonly') || (type !== 'tab' && filter==='notabs')){

        } else {
            jsonData[i].cpu = 0;
            jsonData[i].memory =0;
        }

    }
    return jsonData;
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

function determineNames(jsonData) {

    

    var totalCPU = 0;
    var totalMem = 0;

    for(var i=0, len=cpus.length; i<len; i++){
        totalCPU += cpus[i];  //Iterate over your first array and then grab the second element add the values up
    }

    if (totalCPU === 0) {
        return;
    }

    for(var i=0, len=mems.length; i<len; i++) {
        totalMem += mems[i];  //Iterate over your first array and then grab the second element add the values up
    }

    if (totalMem === 0) {
        return;
    }

    $('#loading').empty(); // Clear
    $('#filters').css('display','block');

    var namesCPU = [];
    var namesMem = [];

    var titleThreshold = 0.05;
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
                        } else {
                            var matchNum = 0;
                            if (title[matchNum].match(/www/g)) {
                                matchNum += 1
                            }
                            if (title[matchNum][0].match(/\w/g)){
                                // first char is alpha, so slice from there
                                finalTitle = title[matchNum].slice(0,-1);
                                namesMem.push(finalTitle);
                            } else {
                                finalTitle = title[matchNum].slice(1,-1);
                                namesMem.push(finalTitle);
                            }

                        }
                    } else {
                        namesMem.push(jsonData[item].info.title);
                    }
                } else {
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
                    } else {
                        namesCPU.push(jsonData[item].info.title);
                    }
                }
                else {
                    namesCPU.push(jsonData[item].info.type);
                }
            }
        }
    }
    return [namesCPU, namesMem];
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
    cpus.length = 0;
    mems.length = 0;
    for (item in jsonData) {
        if(jsonData.hasOwnProperty(item)) {
            cpuDatum = jsonData[item].cpu;
            memDatum = jsonData[item].memory
            
            cpuTotal += cpuDatum;
            memTotal += memDatum;

            cpus.push(cpuDatum);
            mems.push(memDatum);
        }
    }

    cpuTotal = Math.round(cpuTotal);
    memTotal = Math.round(memTotal * 9.53674 * Math.pow(10,-7));

    console.log("cpu: " + cpuTotal);
    console.log("mem: " + memTotal);

    var nameLists = determineNames(jsonData);
    var namesCPU = nameLists[0];
    var namesMem = nameLists[1];

    pathCPU.data(vizPieCPU(cpus));
    pathCPU.transition().duration(1000).attrTween("d", arcCPUTween);


    pathMem.data(vizPieMem(mems));
    pathMem.transition().duration(1000).attrTween("d", arcMemTween);

    cpu_label_group.selectAll("text")
        .data(vizPieCPU(cpus))
        .transition()
        .duration(1000)
        .attr("transform", function(d) {return "translate(" + arcCPU.centroid(d) + ")"; });

    mem_label_group.selectAll("text")
        .data(vizPieMem(mems))
        .transition()
        .duration(1000)
        .attr("transform", function(d) {return "translate(" + arcMem.centroid(d) + ")"; });

    // label_text.transition().duration(1000).attrTween("d", arcCPUTextTween);

    // textLabels = label_group.selectAll("text")
    //                 .data(vizPieCPU(cpus))
    //                 .attr("dy", function(d){
    //                   if ((d.startAngle+d.endAngle)/2 > Math.PI/2 && (d.startAngle+d.endAngle)/2 < Math.PI*1.5 ) {
    //                     return 17;
    //                   } else {
    //                     return 5;
    //                   }
    //                 })

    //                 // .attr("text-anchor", function(d){
    //                 //   if ((d.startAngle+d.endAngle)/2 < Math.PI ) {
    //                 //     return "beginning";
    //                 //   } else {
    //                 //     return "end";
    //                 //   }})
    //                 .text(function(d,i) { return namesCPU[i]; });
    // textOffset = 14;

    // textLabels.enter().append("text")
    //     .style("font-size","8px")
    //     .attr("transform", function(d) {
    //       return "translate(" + Math.cos(((d.startAngle+d.endAngle - Math.PI)/2)) * (radius+textOffset) + "," + Math.sin((d.startAngle+d.endAngle - Math.PI)/2) * (radius+textOffset) + ")";
    //     })
    //     .attr("text-anchor", "middle")
    //     // .attr("dy", function(d){
    //     //   if ((d.startAngle+d.endAngle)/2 > Math.PI/2 && (d.startAngle+d.endAngle)/2 < Math.PI*1.5 ) {
    //     //     return 17;
    //     //   } else {
    //     //     return 5;
    //     //   }
    //     // })
    //     // .attr("text-anchor", function(d){
    //     //   if ((d.startAngle+d.endAngle)/2 < Math.PI ) {
    //     //     return "beginning";
    //     //   } else {
    //     //     return "end";
    //     //   }
    //     // })
    //     .text(function(d,i){
    //       return namesCPU[i];
    //     });

    // textLabels.transition()
    //     .duration(1000)
    //     .attrTween("transform", arcCPUTextTween);

    // label_group.selectAll("text")
    //     .data(vizPieCPU(cpus))
    //     .enter()
    //     .append("text")
    //     .attr("transform", function(d) {return "translate(" + arcCPU.centroid(d) + ")"; })
    //     .attr("dy", ".35em")
    //     .style("text-anchor", "middle")
    //     .style("font-size", "8px")
    //     .text(function(d,i) { return namesCPU[i]; });

    // click handlers for wedges
    svgCPU.selectAll('path').each(function(d, i) {
        $(this).attr('id', jsonData[i].id)
        $(this).on('click', createProcessMenu(parseInt($(this).attr('id'), 10), jsonData));
    });

    svgMem.selectAll('path').each(function(d, i) {
        $(this).attr('id', jsonData[i].id)
        $(this).on('click', createProcessMenu(parseInt($(this).attr('id'), 10), jsonData));
    });
}

function arcCPUTween(a) {
  var i = d3.interpolate(this._current, a);
  this._current = i(0);
  return function(t) {
    return arcCPU(i(t));
  };
}

function arcCPUTextTween(a) {
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
