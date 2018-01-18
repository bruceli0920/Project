$(document).ready(function() {
	/*var start = {
		floor: 'F1',
		xCoord:870.59735,
		yCoord:-384.01395,
		nameChinese:'白云国际机场超市'
	};
	var end = {
		floor: 'F1',
		xCoord: 884.95233,
		yCoord: -361.2067,
		nameChinese:'东三食员工餐厅'
	};
	createRoute(start,end);*/
	/*Rtmap.TrackFactory.setStartPoiXY(start.floor, start.x, start.y);
	Rtmap.TrackFactory.setEndPoiXY(end.floor, end.x, end.y, function(res) {
		__onTrack(res);
	});*/
	var arrayLocation=[];
	if(localStorage.locations)
	{
		var array=localStorage.locations.split('&');
		//console.log(array);
		for(var i=0; i<array.length-1; i++)
		{
			var json=JSON.parse(array[i]);
			arrayLocation.push(json);
		}		
		if(arrayLocation.length==3)
		{
			createRoute(arrayLocation[0],arrayLocation[1]);
		}
	}else{
		$('.route-box').hide();
	}
	if(localStorage.point)
	{
		var point=JSON.parse(localStorage.point);
		var icon = L.icon({
			iconUrl: 'public/img/gate_d.png',
			iconRetinaUrl: 'public/img/gate_d.png',
			iconSize: [30, 30],
			iconAnchor: [15, 30],
			shadowSize: [68, 95],
			shadowAnchor: [22, 94]
		});
		//console.log(iconName);
		Rtmap.Scene.createMarker({
			x: point.xCoord,
			y: point.yCoord,
			icon: icon
		});
	}
	$('.C-S').click(function() {
		$('.route-btn div').removeClass('active');
		$(this).addClass('active');
		createRoute(arrayLocation[0],arrayLocation[1]);
	});
	$('.S-B').click(function() {
		$('.route-btn div').removeClass('active');
		$(this).addClass('active');
		createRoute(arrayLocation[1],arrayLocation[2]);
	});
});

function createRoute(start,end)
{
	/* 清除路线和起始点 */
  	Rtmap.TrackFactory.clearPath();
  	Rtmap.TrackFactory.clearAll();
  	//Rtmap.Scene.setAllowPoiClick(true);
  	Rtmap.TrackFactory.clearStartPoi;
  	Rtmap.TrackFactory.clearEndPoi;
	removeDetailPage();
	$('.route_planning_title').remove();
	$('.track_dashboard').remove();
	$('.route_detail').remove();
	Rtmap.TrackFactory.setStartPoiXY(start.floor, start.xCoord, start.yCoord);
	Rtmap.TrackFactory.setEndPoiXY(end.floor, end.xCoord, end.yCoord,function(res){
		__onTrack(res);
	});
	//console.log(start.nameChinese);
	setTimeout(function(){
		//console.log(1);
		$('.route_planning_title div span').eq(0).html('前往'+end.nodeName);
		$('.route_start div span').html(start.nodeName);
		$('.route_end div span').html(end.nodeName);
	},500);
}