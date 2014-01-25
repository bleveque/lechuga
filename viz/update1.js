var update1 = (function() {

function displayData(data) {
	var data = data.slice();
	console.log(data);
	
	d3.selectAll("svg").remove();
	
	var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;
	
	var x = d3.scale.linear()
    .range([0, width]);
	
	var y = d3.scale.linear()
    .range([height, 0]);
	
	var color = d3.scale.category20();
	
	var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");
	
	var svg = d3.select("#procName").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	  .append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	
  
}

return {displayData: displayData}

})();
