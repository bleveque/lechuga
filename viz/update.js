var update = (function() {
var width = 1000,
    height = 600,
    radius = Math.min(width, height) / 2;

var color = d3.scale.category20();

var pie = d3.layout.pie()
    .sort(null)

var arc = d3.svg.arc()
    .innerRadius(radius - 80)
    .outerRadius(radius - 10);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")

var g = svg.selectAll(".arc")


g.append("text")
    .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
    .attr("dy", ".35em")
    .style("text-anchor", "middle")
    .text(function(d) { return d.data.past; });

function displayData(data) {
  var data = data.slice();
  console.log(data);
  //d3.select("#lettuceWrap #procName").text("CPU: " + data[0].info.name);
  g.
    pie.value(function(d) { 
        d = data;
        return data.cpu; }); // change the value function
    // path = path.data(pie); // compute the new angles
    // path.transition().duration(750).attrTween("d", arcTween); // redraw the arcs
    
    // g.append("text")
    //   .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
    //   .attr("dy", ".35em")
    //   .style("text-anchor", "middle")
    //   .text(function(d) { return d.data.present; });
  }

// function type(d) {
//   d.past = +d.past;
//   d.present = +d.present;
//   return d;
// }

// // Store the displayed angles in _current.
// // Then, interpolate from _current to the new angles.
// // During the transition, _current is updated in-place by d3.interpolate.
// function arcTween(a) {
//   var i = d3.interpolate(this._current, a);
//   this._current = i(0);
//   return function(t) {
//     return arc(i(t));
//   };
// }

return {displayData: displayData}

})();
