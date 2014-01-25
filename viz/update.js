var update = (function() {

//Width and height
var width = 500;
var height = 1000;
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
    cpus = [1,2,3];
    // d3.select("#lettuceWrap").selectAll("p")
    //         .data(cpus)
    //         .enter()
    //         .append("p")
    //         .attr("class", "bar")
    //         .attr("x", function(d, i) {
    //             return i * (width / dataset.length);
    //         })
    //         .style("height", function(d) {
    //             var barHeight = d + 10;
    //             return barHeight + "px";
    //         });

    //Create SVG element
    svg = d3.select("#lettuceWrap").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")


    arc = d3.svg.arc()
        .innerRadius(radius - 80)
        .outerRadius(radius - 10);

    console.log(vizPie(cpus));

    g = svg.selectAll(".arc")
        .data(vizPie(cpus))
        .enter().append("g")
        .attr("class", "arc");

    g.append("path")
      .attr("d", arc)
      .style("fill", function(d) { return color(d); });

    path = svg.datum(cpus).selectAll("path")
              .data(vizPie)
              .attr("d", arc)
              .each(function(d) { this._current = d; }); // store the initial angles
    
}

function displayData(jsonData) {
    $('#lettuceWrap').empty();
    
    cpus = [];
    // debugger;

    for (item in jsonData) {
        if(jsonData.hasOwnProperty(item)) {
            cpus.push(jsonData[item].cpu);
        }
    }

    svg = d3.select("#lettuceWrap").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")


    arc = d3.svg.arc()
        .innerRadius(radius - 80)
        .outerRadius(radius - 10);

    console.log(vizPie(cpus));

    g = svg.selectAll(".arc")
        .data(vizPie(cpus))
        .enter().append("g")
        .attr("class", "arc");

    g.append("path")
      .attr("d", arc)
      .style("fill", function(d) { return color(d); });

    path = svg.datum(cpus).selectAll("path")
              .data(vizPie)
              .attr("d", arc)
              .each(function(d) { this._current = d; }); // store the initial angles

    // d3.select("#lettuceWrap").selectAll("p")
    //     .data(cpus)
    //     .attr("class", "bar")
    //     .transition()
    //     .duration(1000)
    //     .style("height", function(d) {
    //         var barHeight = d * 10;
    //         return barHeight + "px";
    //     });

    // Creates new arcs based on new data
    // vizPie = d3.layout.pie()
    //            .sort(null)
    //            .value(function(d) { return d; });

    // g.data(vizPie(cpus))
    //  .attr("class", "arc")
    //  .transition()
    //  .duration(1000);

    // g.selectAll("path")
    //   .attr("d", arc)
    //   .style("fill", function(d) { return color(d); });
    /**
    path = svg.selectAll("path")
                          .attr("d", arc)
                          .data(vizPie)
    //                       .attr("fill", function(d, i) { return color(i); });
    **/

    // path = path.data(vizPie);
    // path.attr("d", arc)
    // console.log("vizPie data?" + vizPie)
    /**
    path.transition().duration(750).attrTween("d", arcTween); // redraw the arcs
    **/

   }
// During the transition, _current is updated in-place by d3.interpolate.
function arcTween(a) {
  var i = d3.interpolate(this._current, a);
  this._current = i(0);

  return function(t) {
    return arc(i(t));
  };
}


return {displayData: displayData,
        setup:  setup}

})();
