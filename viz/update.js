var update = (function() {


//Width and height
var w = 500;
var h = 1000;
var barPadding = 1;

//Create SVG element
var svg = d3.select("#lettuceWrap")
            .append("svg")
            .attr("width", w)
            .attr("height", h);


function setup() {
    var cpus = [1,1,1];
    d3.select("#lettuceWrap").selectAll("p")
            .data(cpus)
            .enter()
            .append("p")
            .attr("class", "bar")
            .style("height", function(d) {
                var barHeight = d + 10;
                return barHeight + "px";
            });
}

function displayData(jsonData) {
    
    // === WORKING ====
    var cpus = [];

    for (item in jsonData) {
      cpus.push(jsonData[item].cpu);
    }

    d3.select("#lettuceWrap").selectAll("p")
        .data(cpus)
        .attr("class", "bar")
        .transition()
        .duration(1000)
        .style("height", function(d) {
            var barHeight = d * 10;
            return barHeight + "px";
        });
   }


return {displayData: displayData,
        setup:  setup}

})();
