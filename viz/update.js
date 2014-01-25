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
var path;
var vizPie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return d; });


function setup() {
    cpus = []

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

    g.append("path").attr("d", arc);
    
}

function displayData(jsonData) {
    $('#annulusContainer').empty(); // Clear
    
    // Build dataset from JSON object
    cpus = [];
    for (item in jsonData) {
        if(jsonData.hasOwnProperty(item)) {
            cpus.push(jsonData[item].cpu);
        }
    }

    names = []
    for (item in jsonData) {
        if(jsonData.hasOwnProperty(item)) {
            if (jsonData[item].info.type = "tab") {
                names.push(jsonData[item].info.title);
            }
            else {
                names.push(jsonData[item].info.type);
            }
        }
    }

    console.log()

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
        .attr("class", "arc");

    // Draws and colors
    g.append("path")
      .attr("d", arc)
      .style("fill", function(d, i) { return color(i); });

    g.append("text")
      .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .data(names)
      .text(function(d) { return d; });

   }

return {displayData: displayData,
        setup:  setup}

})();
