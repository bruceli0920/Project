var arrdep = getUrlQueryString('arrdep');
$(document).ready(function () {
	var fltId = getUrlQueryString('fltId');
	var token = sessionStorage.getItem('token');
	var json = {
		url: '<%= apiBase %>flight/getFltDetial?token=' + token,
		data: {
			identification: fltId
		},
		success: function (data) {
			// console.log(token);
			createDetail(data,token);
		}
	};
	ajaxBase(json);

	$('.g-wrap').on('click', ".guanzhu", function () {
		if ($(this).html() == "关注航班") {
			var json = {
				url: '<%= apiBase %>subscribe/followFlight?token=' + token,
				data: {
					identification: fltId
				},
				success: function (data) {
					location.reload();
				}
			};
		} else {
			var json = {
				url: '<%= apiBase %>subscribe/unfollowFlight?token=' + token,
				data: {
					identification: fltId
				},
				success: function (data) {
					location.reload();
					// dialogA = Dialog.init('alert');
					// dialogA.show(); // 显示弹窗
					// dialogA.setValue('您确定取消关注吗？');
					// dialogA.off('confirm');
					// dialogA.on('confirm', function () {
					// });
				}
			};
		};
		ajaxBase(json);
	});
});
function createDetail(json,token) {
	var flt = json.fltInfo;
	var sub = json.subscribeStatus;
	var fltStr = flt.identification.split('-');
	var time = fltStr[2];
	var timeStr = time.substring(0, 4) + '-' + time.substring(4, 6) + '-' + time.substring(6, 8);
	var icon, follow, status;
	var timeStart = {};
	var timeEnd = {};
	var fltiden = flt.identification;
	// TODO判断是否到达
	var fltStrarr = fltiden.substring(fltiden.length - 1)
	// console.log(flt)
	if (flt.releaseStatus1) { 
		status = flt.releaseStatus1;
	} else {
		status = '计划';
	}
	if (flt.actTime) {
		timeStart.name = '实际起飞';
		timeStart.value = flt.actTime;
	} else if (flt.estTime) {
		timeStart.name = '预计起飞';
		timeStart.value = flt.estTime;
	} else {
		timeStart.name = '预计起飞';
		timeStart.value = '-';
	}
	if (flt.destActTime) {
		timeEnd.name = '实际到达';
		timeEnd.value = flt.destActTime;
	} else if (flt.destEstTime) {
		timeEnd.name = '预计到达';
		timeEnd.value = flt.destEstTime;
	} else {
		timeEnd.name = '预计到达';
		timeEnd.value = '-';
	}
	if (arrdep == 'arr') {
		icon = flt.airlineCode;
		bltDisp = flt.bltDisp || '-';
		bltOt = flt.bltOt || '-';
		var arr = [{
				name: '行李转盘',
				value: bltDisp
			},
			{
				name: '转盘开放时间',
				value: bltOt
			},
			{
				name: '出租车等待时长',
				value: '-'
			}
		];
	} else if (arrdep == 'dep') {
		icon = flt.iata;
		cntDisp = flt.cntDisp || '-';
		gateDisp = flt.gateDisp || '-';
		try {
			firstGatOt = flt.firstGatOt.slice(11, flt.firstGatOt.length).slice(0, 5) || '-';
		} catch (error) {
			firstGatOt = '-';
		}
		var arr = [
			// {name:'值机柜台',value:cntDisp},
			{
				name: '登机口开放时间',
				value: firstGatOt
			}, 
			{
				name: '登机口',
				value: gateDisp
			},
			{
				name: '安检排队时长',
				value: '-'
			}
		];
	}
	if (sub == "Y") {
		follow = '取消关注';
	} else {
		follow = '关注航班';
	}
	// console.log(status)
	if (flt.flightNoStr.indexOf(",") > 0) {
		var x = flt.flightNoStr.indexOf(",");
		flt.flightNoStr = flt.flightNoStr.slice(x + 1)
		var replaceStr = ',';
		flt.flightNoStr = flt.flightNoStr.replace(new RegExp(replaceStr, 'gm'), '&nbsp;&nbsp;&nbsp;') + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"

		var obj = $('<div class="top clearfix">' +
			'<div class="left fl" style="float:none;margin:0 auto;border-right:0;">' +
			'<div class="date">' + timeStr + '</div>' +
			'<div class="clearfix address">' +
			'<p class="fl start">' + flt.startAirportNameCn + '<span class="ter1">' + flt.terminal + '</span>' + '</p>' +
			'<p class="fl icon"></p>' +
			'<p class="fl dest">' + flt.destAirportNameCn + '<span class="ter2">' + flt.terminal + '</span>'+ '</p>' +
			'</div>' +
			'</div>' +
			// '<div class="right fl">'+
			// 	'<img src="images/rain.png" alt="">'+
			// 	'<p>特大暴雨</p>'+
			// '</div>'+
			'</div>' +
			'<div class="cont">' +
			'<div class="title clearfix">' +
			'<p class="fl icon"></p>' +
			'<p class="fl">' + flt.iataCn + icon + flt.fltNo + '</p>' +
			'<div class="f2"><span class="sharename">共享航班:</span><span class="shareflt"><span class="sharefltcon">' + flt.flightNoStr + '</span></span></div>' +
			'</div>' +
			'<div class="time">' +
			'<ul>' +
			'<li>' +
			'<p>' + timeStart.name + '</p>' +
			'<p>' + timeStart.value + '</p>' +
			'<p>计划：' + flt.sdtTime + '</p>' +
			'</li>' +
			'<li>' +
			'<p>' + timeEnd.name + '</p>' +
			'<p>' + timeEnd.value + '</p>' +
			'<p>计划：' + flt.destSdtTime + '</p>' +
			'</li>' +
			'</ul>' +
			'<p class="status">' + status + '</p>' +
			'</div>' +
			'<div class="tip">' +
			'<ul>' +
			'<li>' +
			'<p class="value">' + arr[0].value + '</p>' +
			'<p class="name">' + arr[0].name + '</p>' +
			'</li>' +
			'<li>' +
			'<p class="value">' + arr[1].value + '</p>' +
			'<p class="name">' + arr[1].name + '</p>' +
			'</li>' +
			// '<li>'+
			// 	'<p class="value">'+arr[2].value+'</p>'+
			// 	'<p class="name">'+arr[2].name+'</p>'+
			// '</li>'+
			'</ul>' +
			'</div>' +
			'</div>' +
			'<div class="bottom">' +
			'<ul class="clearfix">' +
			'<li class="guanzhu">' + follow + '</li>' +
			// '<li class="fl guide">登机引导</li>'+
			// '<li class="fl">退改签</li>'+
			// '<li class="fl">在线值机</li>'+
			'</ul>' +
			'</div>'
		)
	} else { 
		var obj = $('<div class="top clearfix">' +
			'<div class="left fl" style="float:none;margin:0 auto;border-right:0;">' +
			'<div class="date">' + timeStr + '</div>' +
			'<div class="clearfix address">' +
			'<p class="fl start">' + flt.startAirportNameCn + '<span class="ter1">' + flt.terminal + '</span>' + '</p>' +
			'<p class="fl icon"></p>' +
			'<p class="fl dest">' + flt.destAirportNameCn + '<span class="ter2">' + flt.terminal + '</span>'+ '</p>' +
			'</div>' +
			'</div>' +
			// '<div class="right fl">'+
			// 	'<img src="images/rain.png" alt="">'+
			// 	'<p>特大暴雨</p>'+
			// '</div>'+
			'</div>' +
			'<div class="cont">' +
			'<div class="title clearfix">' +
			'<p class="fl icon"></p>' +
			'<p class="fl">' + flt.iataCn + icon + flt.fltNo + '</p>' +
			'</div>' +
			'<div class="time">' +
			'<ul>' +
			'<li>' +
			'<p>' + timeStart.name + '</p>' +
			'<p>' + timeStart.value + '</p>' +
			'<p>计划：' + flt.sdtTime + '</p>' +
			'</li>' +
			'<li>' +
			'<p>' + timeEnd.name + '</p>' +
			'<p>' + timeEnd.value + '</p>' +
			'<p>计划：' + flt.destSdtTime + '</p>' +
			'</li>' +
			'</ul>' +
			'<p class="status">' + status + '</p>' +
			'</div>' +
			'<div class="tip">' +
			'<ul>' +
			'<li>' +
			'<p class="value">' + arr[0].value + '</p>' +
			'<p class="name">' + arr[0].name + '</p>' +
			'</li>' +
			'<li>' +
			'<p class="value">' + arr[1].value + '</p>' +
			'<p class="name">' + arr[1].name + '</p>' +
			'</li>' +
			// '<li>'+
			// 	'<p class="value">'+arr[2].value+'</p>'+
			// 	'<p class="name">'+arr[2].name+'</p>'+
			// '</li>'+
			'</ul>' +
			'</div>' +
			'</div>' +
			'<div class="bottom">' +
			'<ul class="clearfix">' +
			'<li class="guanzhu">' + follow + '</li>' +
			// '<li class="fl guide">登机引导</li>'+
			// '<li class="fl">退改签</li>'+
			// '<li class="fl">在线值机</li>'+
			'</ul>' +
			'</div>'
		)
	}

	
	var color = getStateColor(status);
	obj.find('.status').css({
		color: color
	});
	obj.find('.title .icon').css({
		background: 'url(images/' + icon + '.gif)',
		backgroundSize: 'contain'
	})
	obj.appendTo($('.g-wrap'));
	var boxWS = $('.shareflt').outerWidth();
	var contWS = $('.shareflt span').outerWidth();
	// console.log('boxWS===' + boxWS + 'contWS====' + contWS);
	if (contWS > boxWS) {
			$('.shareflt').liMarquee({
				scrollamount: 20,
				hoverstop: false
		});
	}
	if (fltStrarr == "D") {
		$(".ter1").show();
		$(".ter2").hide();
		$(".guanzhu").after("<li class='fl guide'>登机引导</li>");
		obj.find('.guanzhu').addClass('btnstyle');
		obj.find('.guide').addClass('btnstyle');
		obj.find('.guide').html('登机引导');
		obj.find('.guide').on('click', function () {
			var flyno = flt.iata + flt.fltNo;
			var cntTerminalNo = flt.cntTerminalNo;
			if (typeof (cntTerminalNo) == "undefined") {
				cntTerminalNo = "T2";
			}

			var djdata = {
				fltNo: flyno,
				cntTerminalNo: cntTerminalNo,
			};
			var djjson = {
				url: '<%= apiBase %>flight/getBoardingLead?token=' + token,
				data: djdata,
				success: function (data) {
					localStorage.removeItem("locations");
					localStorage.locations = JSON.stringify(data);
					var newstr = '';
					if (data != undefined) {
						for (var i = 0; i < data.length; i++) {
							newstr += JSON.stringify(data[i]) + '&';
						}
						//将打点的数据写到缓存
						localStorage.removeItem("locations");
						localStorage.setItem("locations", newstr);
						localStorage.point = '';
					}
					detail(data)
				}
			};
			ajaxBase(djjson, false);


			//登机导引地图模块
	
			function detail(data) {
				var details = data
				if (fltStrarr == "D" && (details != undefined)) {
					var buildId = details[0].buildingId;
					if (details.length == 3) {
						window.location.href = 'map/index.html?key=k7i23869hd&buildid=' + buildId + '&labelstyle=circle-point';
					} else if (details.length == 1) {
						var point = details.locations[0];
						localStorage.locations = '';
						localStorage.point = JSON.stringify(point);
						obj.find('.guide').html('登机口位置');
						window.location.href = 'map/index.html?key=k7i23869hd&buildid=' + buildId + '&labelstyle=circle-point&floor=' +
							point.floor + '&center=[' + point.xCoord + ',' + point.yCoord + ']&zoom=19';
					}
				} else {
					obj.find('.guide').hide();
				}
			}
		});
	} else { 
		$(".ter1").hide();
		$(".ter2").show();
	}
}





