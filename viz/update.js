var update = (function() {

//Width and height
var width = '300';
var height = '300';
var radius = Math.min(width, height) / 2;
var color = d3.scale.category20();
var cpus;
var arc;
var svg;
var g;
var lastData;
var path;
var vizPie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return d; });


function setup() {
    var jsonData = BrowserUtils.getProcesses();
    cpus = [];
    for (item in jsonData) {
        if(jsonData.hasOwnProperty(item)) {
            cpus.push(jsonData[item].cpu);
        }
    }
    console.log(cpus);

    //Create SVG element
    svg = d3.select("#annulusContainer").append("svg")
        //.attr("style", 'width:'+width+";height:"+height+";")
        .attr("height", height)
        .attr("width", width)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")

    arc = d3.svg.arc()
        .innerRadius(radius - 50)
        .outerRadius(radius);

    g = svg.selectAll(".arc")
        .data(vizPie(cpus))
        .enter().append("g")
        .attr("class", "arc");

    g.append("path").attr("d", arc);

    // lastData = cpus;
    
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

function displayData(jsonData) {
    $('#annulusContainer').empty(); // Clear

    // svg = d3.select("#annulusContainer").append("svg")
    //     .attr("width", width)
    //     .attr("height", height)
    //     .append("g")
    //     .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")

    // arc = d3.svg.arc()
    //     .innerRadius(radius - 80)
    //     .outerRadius(radius - 10);

    // g = svg.selectAll(".arc")
    //     .data(vizPie(lastData))
    //     .enter().append("g")
    //     .attr("class", "arc");

    // g.append("path").attr("d", arc);
    
    // Build dataset from JSON object
    cpus = [];
    for (item in jsonData) {
        if(jsonData.hasOwnProperty(item)) {
            cpus.push(jsonData[item].cpu);
        }
    }

    // lastData = cpus;

    names = []
    for (item in jsonData) {
        if(jsonData.hasOwnProperty(item)) {
            // Determine title to display
            if (jsonData[item].info.type == "tab") {

                if (jsonData[item].info.title.length >= 10) {
                    var url = jsonData[item].info.url
                    // console.log(url)
                    title = url.match(/\.{1}\w+\.{1}/g)
                    
                    // console.log("title: " + title)

                    if (title == null) {
                        names.push(jsonData[item].info.title.slice(1,10))
                    }
                    else {
                        
                        finalTitle = title[0].slice(1,-2);
                        // console.log(finalTitle);
                        names.push(finalTitle);
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

    // console.log()

    // Define svg canvas
    svg = d3.select("#annulusContainer").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")


    arc = d3.svg.arc()
        .innerRadius(radius - 50)
        .outerRadius(radius);


    path = svg.datum(cpus).selectAll("path")
                          .data(vizPie)
                          .attr("d", arc)

    // Defines arcs
    g = svg.selectAll(".arc")
        .data(vizPie(cpus))
        .enter().append("g")
        .attr("class", "arc")
        .on('click', function(evt) {
            console.log(this);
        });

    // Draws and colors
    g.append("path")
      .attr("d", arc)
      .style("fill", function(d, i) { return color(i); });

    g.append("text")
      .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .style("font-size","8px")
      .data(names)
      .text(function(d) { return d; });

   }

return {displayData: displayData,
        setup:  setup}

})();
