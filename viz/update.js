var update = (function() {

//Width and height
var width = 300;
var height = 300;
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
    cpus = BrowserUtils.getProcesses();
    cpus = [];
    //Create SVG element
    svg = d3.select("#annulusContainer").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")

    arc = d3.svg.arc()
        .innerRadius(radius - 50)
        .outerRadius(radius);

    g = svg.selectAll(".arc")
        .data(vizPie(cpus))
        .enter().append("g")
        .attr("class", "arc");

    g.append("text")
        .style("text-anchor", "middle")
        .style("font-size","24px")
        .text("Loading...");

}
function updateData(jsonData) {
    // Build dataset from JSON object
    jsonData = BrowserUtils.getProcesses();
    cpus = [];
    for (item in jsonData) {
        if(jsonData.hasOwnProperty(item)) {
            cpus.push(jsonData[item].cpu);
        }
    }
    console.log("cpus!!!!!!!!" + cpus)

}
function displayData(jsonData) {

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
    cpus = [];
    for (item in jsonData) {
        if(jsonData.hasOwnProperty(item)) {
            cpus.push(jsonData[item].cpu);
        }
    }

    var total = 0;  //Variable to hold your total

    for(var i=0, len=cpus.length; i<len; i++){
        total += cpus[i];  //Iterate over your first array and then grab the second element add the values up
    }
    if (total == 0) {
        return;
    }

    $('#annulusContainer').empty(); // Clear
    $('#loading').empty(); // Clear


    console.log("cpus" + cpus)


    // For finding maxes
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

    // lastData = cpus;

    names = []
    for (item in jsonData) {
        if(jsonData.hasOwnProperty(item)) {
            // Determine title to display
            if (maxCPUVals.indexOf(jsonData[item].cpu) === -1) {
                // Not one of the bigger processes, so set its title to a blank string
                console.log("one: " + jsonData[item].cpu);
                names.push("");
            }
            else{
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
        .style("stroke-width", 3);

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
      .text(function(d, i) {return d; });

    g.append("text")
        .style("text-anchor", "middle")
        .style("font-size","24px")
        .text("CPU Usage");

   }

return {displayData: displayData,
        setup:  setup,
        updateData: updateData}

})();
