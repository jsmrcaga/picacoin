$(function () {
	$('#match-xx-graph').highcharts({
		title:{
			text:'',
		},
		/*xAxis: {
			categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
				'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
		},*/
		yAxis: {
			title: {
				text: 'Points'
			},
			plotLines: [{
				value: 0,
				width: 1,
				color: '#808080'
			}]
		},
		tooltip: {
			valueSuffix: 'points'
		},
		legend: {
			layout: 'vertical',
			align: 'right',
			verticalAlign: 'middle',
			borderWidth: 0
		},
		series: [{
			name: 'Tonio',
			// data: [0,0,2,2,2,2,3,3,2,3,3,3,5,5]
			data: [
				[0,0],
				[2,0],
				[5,3]
			]
		}, {
			name: 'Renan',
			// data: [0,0,0,0,0,2,1,1,1,2,4,4,4,4],
			data: [
				[0,0],
				[2,1],
				[3,2],
				[6,2]
			],
			color: "#B22132"
		}],
		chart:{
			backgroundColor: "transparent",
			// borderWidth: "2px",
			// borderColor: "#B22132"
		}
	});
});