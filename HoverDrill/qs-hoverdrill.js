//requirejs(["d3.min"]);

define(["jquery", "text!./hoverdrill.css","./d3.min"], function($, cssContent) {'use strict';
	$("<style>").html(cssContent).appendTo("head");
	return {
		initialProperties : {
			version: 1.0,
			qHyperCubeDef : {
				qDimensions : [],
				qMeasures : [],
				qInitialDataFetch : [{
					qWidth : 3,
					qHeight : 500
				}]
			}
		},
		definition : {
			type : "items",
			component : "accordion",
			items : {
				dimensions : {
					uses : "dimensions",
					min : 2,
					max:2
				},
				measures : {
					uses : "measures",
					min : 1,
					max: 1
				},
				sorting : {
					uses : "sorting"
				},
				settings : {
					uses : "settings"
				}
			}
		},
		snapshot : {
			canTakeSnapshot : true
		},
		paint : function($element,layout) {
			 var qData = layout.qHyperCube.qDataPages[0];
			 var qMatrix = qData.qMatrix;
			 
			 var data = qMatrix.map(function(d) {
			 	return {
			 		"Dim1":d[0].qText,
			 		"Dim2":d[1].qText,
			 		"Metric":d[2].qNum
			 	}
			 });

			var nested_data = d3.nest()
				.key(function(d) {return d.Dim1;})
				.entries(data);

			var i = 0;
			nested_data.forEach(function(d) {
				d.sum = d3.sum(d.values,function(e) {return e.Metric;})
				d.index = i;
				i++;
				d.values.sort(function(a,b) {
					return Number(a.Metric)<Number(b.Metric);
				})
			});

			nested_data.sort(function(a,b){return Number(a.sum)<Number(b.sum)});
			
			var i = 0;
			nested_data.forEach(function(d) {
				d.index = i;
				i++;
			});

			var distinctDim2 = distinctValues(data,"Dim2");

			viz(nested_data,distinctDim2,$element,layout);

			 
			 
			    
			
			
		/* */
		}
		
	};
});

function viz(data,distinctDim,$element,layout) {

	var id = "container_"+ layout.qInfo.qId;

	 if (document.getElementById(id)) {
	 	$("#" + id).empty();
	 }
	 else {
	 	$element.append($('<div />').attr("id", id).width($element.width()).height($element.height()));
	 }
	 

	var width = $element.width()-10;
	var height = $element.height()-10;

	var chart_div = d3.select("#" + id);

	var bar_count = data.length;

	var chart_margin = {
		"top":0,
		"bottom":0,
		"left":10,
		"right":10
	}
	
	var bar_margin = {
		"top":5,
		"bottom":5,
		"left":0,
		"right":0
	};


	var bar_space = 40;// hardcoded; can make dynamic like so: height/bar_count;
	var bar_height = bar_space - bar_margin.top - bar_margin.bottom;
	var height = Math.max(bar_space*bar_count,height);

	var format = d3.format("0,000");


	var svg = chart_div.append("svg")
		.attr("width",width)
		.attr("height",height);
	var g = svg.append("g")
		.attr("id","g")
		.attr("transform","translate(" + chart_margin.left + "," + chart_margin.top + ")");

	 bar_g = g.selectAll(".bar_group")
		.data(data)
		.enter()
		.append("g")
		.attr("class","bar_group")
		.attr("id",function(d) {return "bar_group_" + d.index});

	 dim_label = bar_g.selectAll(".dim_label")
		.data(function(d) {return [d]})
		.enter()
		.append("text")
		.attr("class","dim_label")
		.text(function(d){return d.key;});

	var dim_sub_label = bar_g.selectAll(".dim_sub_label")
		.data(distinctDim)
		.enter()
		.append("text")
		.attr("class","dim_sub_label")
		.text(function(d) {return d});

	var bar_label = bar_g.selectAll(".bar_label")
		.data(function(d) {return [d]})
		.enter()
		.append("text")
		.attr("class","bar_label")
		.text(function(d) {return format(d.sum)});

	var dim_label_size = d3.max(dim_label,function(d) {return d[0].clientWidth});
	var dim_sub_label_size = d3.max(dim_sub_label[0],function(d) {return d.clientWidth});
	var bar_label_size = d3.max(bar_label[0],function(d) {return d.clientWidth});

	dim_sub_label.remove();

	bar_margin.left += Math.max(dim_label_size,dim_sub_label_size);
	bar_margin.right +=bar_label_size;

	bar_width = width-bar_margin.left-bar_margin.right-chart_margin.left-chart_margin.right;

	var x_scale = d3.scale.linear()
		.domain([0,d3.max(data,function(d){return d.sum})])
		.range([0,bar_width]);

	dim_label
		.attr("x",-5)
		.attr("y",function(d,i) {return (.5)*bar_height;})
		.attr("dy",".3em");

	bar_label
		.attr("x",function(d) {return x_scale(d.sum)})
		.attr("y",function(d,i) {return (.5)*bar_height;})
		.attr("dy",".3em")
		.attr("transform","translate(" + ( 5) + ",0)");

	

	 bar_g
		.attr("transform",function(d,i) {return "translate(" + bar_margin.left + "," + (bar_margin.top +i*bar_space)+ ")"})

	 rect = bar_g.selectAll(".bar")
		.data(function(d) {return [d];})
		.enter()
		.append("rect")
		.attr("class","bar")
		.attr("height",bar_height)
		.attr("width",function(d) {return x_scale(d.sum)})
		.attr("x",0)
		.attr("y",0);
		

	var sub_bar_height = 10;

	 sub_g = bar_g.selectAll(".sub_g")
	 	.data(function(d) {return [d]})
	 	.enter()
	 	.append("g")
	 	.attr("id",function(d) {return "sub_g_" + d.index})
		.attr("class","sub_g")
		.selectAll(".sub_bar")
		.data(function(d){return d.values})
		.enter()
		.append("rect")
		.attr("class","sub_bar")
		.attr("height",sub_bar_height)
		.attr("width",function(d) {return x_scale(d.Metric)})
		.attr("x",0)
		.attr("y",function(d,i) {return i*(sub_bar_height+5)})
		;
	
	 bounds = bar_g[0].map(function(d) {
	 	var temp_arr = d.getBoundingClientRect();
		return {
			"top":temp_arr.top,
			"bottom":temp_arr.bottom + 30,
			"height":temp_arr.height + 30
		};
	});

	bar_g.selectAll(".sub_g").attr("display","none");

	var hover_rect = svg.selectAll(".hover_bar")
		.data(data)
		.enter()
		.append("rect")
		.attr("class","hover_bar")
		.attr("height",bar_space)
		.attr("width",chart_margin.left + bar_margin.left)
		.attr("x",0)
		.attr("y",function(d,i) {return i*bar_space;});

	hover_rect.on("mouseover",function(d){
		d3.select("#sub_g_" + d.index)
			.attr("display",null);

		var dim_sub_label = d3.select("#sub_g_" + d.index).selectAll(".dim_sub_label")
			.data(d.values)
			.enter()
			.append("text")
			.attr("class","dim_sub_label")
			.attr("dy",".1em")
			.attr("x",0)
			.attr("y",function(d,i) {return (i+.5)*(sub_bar_height+5)})
			.text(function(d) {return d.Dim2});

		var bar_sub_label = d3.select("#sub_g_" + d.index).selectAll(".bar_sub_label")
			.data(d.values)
			.enter()
			.append("text")
			.attr("class","bar_sub_label")
			.attr("dy",".1em")
			.attr("x",function(d) {return x_scale(d.Metric)})
			.attr("y",function(d,i) {return (i+.5)*(sub_bar_height+5)})
			.text(function(d) {return format(d.Metric)});


		rect.filter(function(e) {return d.key===e.key})
			.attr("height",sub_bar_height)
			.attr("y",function() {return .5*bar_height - .5*(sub_bar_height)});

		var sub_g_y = d3.selectAll(".dim_label").filter(function(e) {return d.key===e.key})[0][0].offsetTop + d3.selectAll(".dim_label").filter(function(e) {return d.key===e.key})[0][0].offsetHeight+5;
		
		sub_g
			.attr("transform","translate(" + (0) + "," + sub_g_y + ")");
		dim_sub_label			
			.attr("transform","translate(" + (-5) + "," + sub_g_y + ")");
		bar_sub_label
			.attr("transform","translate(" + ( 5) + "," + sub_g_y + ")");

		 curr_Box = bounds[d.index];
		 	if (bounds[d.index+1]) {
		 	next_Box = bounds[d.index+1];
		 }
		 else {
		 	next_Box = {"top": height};

		 }

		 var box_margin = 20;

		 if(next_Box.top-curr_Box.bottom <box_margin) {

		 	bar_g.filter(function(e) {return e.index>d.index})
		 		.transition()
				.duration(500)
		 		.attr("transform",function(f,i) {return "translate(" + bar_margin.left + "," + (bar_margin.top +(i+d.index+1)*bar_space + box_margin-next_Box.top+curr_Box.bottom)+ ")"});
		 
		 	if(curr_Box.bottom>height) {


		 		var dist_to_move = curr_Box.height > (height-chart_margin.top) ? (curr_Box.top-chart_margin.top) : (curr_Box.bottom - height);
		 		g
		 			.transition()
					.duration(500)
		 			.attr("transform","translate(" + chart_margin.left + "," + (chart_margin.top-dist_to_move) + ")");
		 	}
		 }

	});

	hover_rect.on("mouseout",function(d) {
		d3.selectAll(".sub_g").attr("display","none");
		d3.selectAll(".dim_sub_label").remove();
		d3.selectAll(".bar_sub_label").remove();
		rect
			.attr("height",bar_height)
			.attr("y",0);
		bar_g
			.transition()
			.duration(500)
			.attr("transform",function(d,i) {return "translate(" + bar_margin.left + "," + (bar_margin.top +i*bar_space)+ ")"});
		g
			.transition()
			.duration(500)
			.attr("transform","translate(" + chart_margin.left + "," + chart_margin.top + ")");
		
	})



}

function distinctValues(array,field) {
	var unique = {};
	var distinct = [];
	array.forEach(function (x) {
  	if (!unique[x[field]]) {
    		distinct.push(x[field]);
    		unique[x[field]] = true;
  		}
	});

	return distinct;
}