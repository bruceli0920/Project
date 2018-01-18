//var arrdep=getUrlQueryString('arrdep');
$(document).ready(function () {
	var bFlag = true;
	var type = getUrlQueryString('type');
	var arrdep = getUrlQueryString('arrdep');
	var dateStr = getUrlQueryString('dateStr');
	var token = sessionStorage.getItem('token');
	var pageNum = 1;
	var pageCount = 10;
	var flightJson = {};
	var cityJson = {};
	if (type == 'flight') {
		var flightNo = getUrlQueryString('flightNo');
		flightJson = {
			url: '<%= apiBase %>flight/selectByFlightNoAndDate?token=' + token,
			data: {
				"flightNo": flightNo,
				"date": dateStr,
				"arrOrDep": arrdep
			},
			success: function (data) {
				if (data && data.length != 0) {
					bFlag = true;
					createList(data);
				} else {
					$('.msg').hide();
					// $('.msg.none').show();
					$('.cqmsg').show();
				}
			}
		}
		ajaxBase(flightJson, false);
	} else if (type == 'city') {
		var startStation = getUrlQueryString('startStation');
		var endStation = getUrlQueryString('endStation');
		var airLine = getUrlQueryString('airLine');
		cityJson = {
			url: '<%= apiBase %>flight/selectByStationAndDate?token=' + token,
			data: {
				"startStation": startStation,
				"endStation": endStation,
				"date": dateStr,
				"arrOrDep": arrdep,
				"pageNum": pageNum,
				"pageCount": pageCount,
				"airLine": airLine
			},
			success: function (data) {
				if (data && data.length != 0) {
					bFlag = true;
					createList(data.rst);
					if (data.lastPage || data.rst.length == 0) {
						bFlag = false;
						$('.msg').hide();
						// $('.msg.none').show()
						if (data.totalCount == 0){
							$('.cqmsg').show();
						}	
					}
				} else {
					$('.msg').hide();
					// $('.msg.none').show()
					$('.cqmsg').show();
				}
			}
		};
		ajaxBase(cityJson, false);
	}
	$('.list ul').on('click', 'li', function () {
		var fltId = $(this).attr('data-fltId');
		window.location.href = 'detail.html?fltId=' + fltId + '&arrdep=' + arrdep;
	});
	var oList = $('.list');
	var oUl = $('.list ul');
	$(document).scroll(function () {
		var scrollTop = $(document).scrollTop();
		var clientHeight = document.documentElement ? document.documentElement.clientHeight : document.body.clientHeight;
		var top = oList.outerHeight();
		var aBtn = $('.tab li');
		var h = scrollTop + clientHeight;
		if (h + 100 >= top && scrollTop > 100) {
			if (bFlag) {
				bFlag = false;
				if (type == 'city') {
					cityJson.data.pageNum++;
					ajaxBase(cityJson, false);
				}
			}
		}
	});
});

function createList(arr) {
	console.log(arr)
	for (var i = 0; i < arr.length; i++) {
		var json = arr[i];
		var status;
		if (json.releaseStatus1 == undefined) {
			status = '计划';
		} else {
			status = json.releaseStatus1;
		}
		var icon;
		if (json.iata != undefined) {
			icon = json.iata;
		} else if (json.airlineCode != undefined) {
			icon = json.airlineCode;
		}
		var fltiden = json.identification;
		// TODO判断是否到达
		var fltStrarr = fltiden.substring(fltiden.length - 1)
		if (json.flightNoStr.indexOf(",") > 0) {
			var x = json.flightNoStr.indexOf(",");
			json.flightNoStr=json.flightNoStr.slice(x+1)
			var replaceStr = ',';
			json.flightNoStr=json.flightNoStr.replace(new RegExp(replaceStr,'gm'),'&nbsp;&nbsp;&nbsp;')+"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
			// json.flightNoStr=json.flightNoStr.slice(x+1)+"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
			var oLi = $('<li data-fltId=' + json.identification + '>' +
			'<div class="title clearfix">' +
			'<i class="icon fl"></i>' +
			'<p class="fl">' + json.iataCn + icon + json.fltNo + '</p>' +
			'<div class="f2"><span class="sharename">共享航班:</span><span class="shareflt"><span class="sharefltcon">'+json.flightNoStr+'</span></span></div>'+
			'</div>' +
			'<div class="detail clearfix">' +
			'<div class="fl">' +
			'<p class="time">' + json.sdtTime + '</p>' +
			'<p class="city">' + json.startAirportNameCn +'<span class="ter1">'+json.terminal+'</span>'+ '</p>' +
			'</div>' +
			'<p class="status fl">' + status + '</p>' +
			'<div class="fl">' +
			'<p class="time">' + json.destSdtTime + '</p>' +
			'<p class="city">' + json.destAirportNameCn + '<span class="ter2">'+json.terminal+'</span>'+ '</p>' +
			'</div>' +
			'</div>' +
			'<div class="view">查看详情</div>' +
			'</li>');
		} else { 
			var oLi = $('<li data-fltId=' + json.identification + '>' +
			'<div class="title clearfix">' +
			'<i class="icon fl"></i>' +
			'<p class="fl">' + json.iataCn + icon + json.fltNo + '</p>' +
			'</div>' +
			'<div class="detail clearfix">' +
			'<div class="fl">' +
			'<p class="time">' + json.sdtTime + '</p>' +
			'<p class="city">' + json.startAirportNameCn +'<span class="ter1">'+json.terminal+'</span>'+ '</p>' +
			'</div>' +
			'<p class="status fl">' + status + '</p>' +
			'<div class="fl">' +
			'<p class="time">' + json.destSdtTime + '</p>' +
			'<p class="city">' + json.destAirportNameCn + '<span class="ter2">'+json.terminal+'</span>'+ '</p>' +
			'</div>' +
			'</div>' +
			'<div class="view">查看详情</div>' +
			'</li>');
		}
		
		
		oLi.appendTo($('.list ul'));
		var color = getStateColor(status);
		oLi.find('.status').css({
			color: color
		});
		oLi.find('.title .icon').css({
			'background': 'url(images/' + icon + '.gif) no-repeat',
			'backgroundSize': 'contain'
		});
		var boxWS = oLi.find('.shareflt').outerWidth();
		var contWS = oLi.find('.shareflt span').outerWidth();
		// console.log('boxWS==='+boxWS+'contWS===='+contWS);
		if (contWS > boxWS) {
				oLi.find('.shareflt').liMarquee({
					scrollamount: 20,
					hoverstop: false
			});
		}
		if (fltStrarr == "D"){
			$(".ter1").show();
			$(".ter2").hide();
		} else {
			$(".ter1").hide();
			$(".ter2").show();
		}		
	}

}