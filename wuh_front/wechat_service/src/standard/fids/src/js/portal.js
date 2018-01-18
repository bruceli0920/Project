$(document).ready(function () {
	var token = sessionStorage.getItem('token') || getUrlQueryString('token');
	setSessionValue('token', token);
	var bFlag = true;
	var filterFlag = false;
	var pageNum = 1;
	var pageSize = 15;
	var str = 'dep';
	var term = "T2";
	// var json = {
	// 	url: '<%= apiBase%>/flight/selectAllFlight?token=' + token,
	// 	data: {
	// 		"arrOrDep": str,
	// 		"pageNum": pageNum,
	// 		"pageCount": pageSize,
	// 		"term": term
	// 		// "date":"2017-05-11"
	// 	},
	// 	success: function (data) {
	// 		console.log(data);
	// 		if (data) {
	// 			bFlag = true;
	// 			createList(data.rst, str, json.data.pageNum);
	// 			//console.log(data.rst.lastPage);
	// 			if (data.lastPage || data.rst.length == 0) {
	// 				bFlag = false;
	// 				$('.msg').hide();
	// 				$('.msg.none').show()
	// 			}
	// 		} else {
	// 			$('.msg').hide();
	// 			$('.msg.none').show()
	// 		}
	// 	}
	// };
	// ajaxBase(json, false);

	var filterJson = {
		url: '<%= apiBase%>/flight/selectFlightByCondition?token=' + token,
		data: {
			"arrOrDep": str,
			"pageNum": pageNum,
			"pageCount": pageSize,
			"status": "",
			"domint": "",
			"term": term
		},
		success: function (data) {
			// console.log(data);
			if (data) {
				filterFlag = true;
				createList(data.rst, str, filterJson.data.pageNum);
				//console.log(data.rst.lastPage);
				if (data.lastPage || data.rst.length == 0) {
					filterFlag = false;
					$('.msg').hide();
					$('.msg.none').show()
				}
			} else {
				$('.msg').hide();
				$('.msg.no-match').show()
			}
			if (data.totalCount.length == 0) {
				$('.msg1').show();
			} else {
				$('.msg1').hide();
			};
		}
	}
	ajaxBase(filterJson, false);

	$('.tab li').each(function (index) {
		bFlag = true;
		filterFlag = false;
		$(this).on('click', function () {
			$('.cont').eq(index).find('.option li').removeClass('active');
			$('.cont').eq(index).find('.option').eq(0).find('li').eq(0).addClass('active');
			$('.cont').eq(index).find('.option').eq(1).find('li').eq(0).addClass('active');
			// json.data.pageNum = 1;
			filterJson.data.pageNum = 1;
			str = $(this).attr('data-arrOrDep');
			$('.tab li').removeClass('active');
			$('.tab li').eq(index).addClass('active');
			$('.cont').removeClass('active');
			$('.cont').eq(index).addClass('active');
			// json.data.arrOrDep = str;
			filterJson.data.arrOrDep = str;
			// ajaxBase(json, false);
			// console.log(filterJson);
			ajaxBase(filterJson, false);
		});
	});
	$(".tabs li").on('click', function () {
		$(this).addClass("active").siblings().removeClass("active");
		var airport = $(this).attr("data-airport");
		term = airport;
		filterJson.data.term = term;
		pageNum = 1;
		filterJson.data.pageNum = pageNum;
		if (str == "dep") {
			$('.list').eq(0).show().find('ul').html('');
		} else {
			$('.list').eq(1).show().find('ul').html('');
		};
		ajaxBase(filterJson, false);
	});
	//筛选按钮
	$('.btn').on('click', function () {
		$('.cont .m-filter').hide();
		$('.cont.active').find('.m-filter').show();
		$('.g-box .cont.active .list .layer').show();
	});


	//点击筛选详情按钮
	$('.m-filter .option .item li').on('click', function () {
		filterFlag = true;
		bFlag = false;
		var parent = $(this).parents('.option');
		parent.find('li').removeClass('active');
		$(this).addClass('active');
		var oCont = $('.cont.active .m-filter');
		var status = oCont.find('.state li.active').attr('data-state');
		var domint = oCont.find('.domint li.active').attr('data-domint');
		var filterStr = $(".m-header .tab li.active").attr('data-arrordep');
		filterJson.data.arrOrDep = filterStr;
		filterJson.data.pageNum = 1;
		filterJson.data.status = status;
		filterJson.data.domint = domint;
		// ajaxBase(filterJson, false);
	});
	//点击遮罩层
	$('.cont .m-filter .shadow,.cont .m-filter .cancel').on('click', function () {
		$('.cont .m-filter').hide();
		$('.g-box .cont.active .list .layer').hide();
	});
	// 点击确定按钮
	$('.m-filter .button .on').on('click', function () {
		$('.cont .m-filter').hide();
		$('.g-box .cont.active .list .layer').hide();
		ajaxBase(filterJson, false);
	});

	// 跳转页面
	$(".cont .list").on('click', 'li', function () {
		var arrdpr = $(".m-header .tab li.active").attr('data-arrordep');
		var data = $(this).attr('data-fltid');
		window.location.href = "<%=common%>standard/flight/detail.html?fltId=" + data + "&arrdep=" + arrdpr;
	});

	//页面滚动
	var oBox = $('.g-box');
	var oList = $('g-box .cont.active .list');
	$(document).scroll(function () {
		var scrollTop = $(document).scrollTop();
		var clientHeight = document.documentElement ? document.documentElement.clientHeight : document.body.clientHeight;
		var top = oBox.outerHeight();
		var aBtn = $('.tab li');
		var h = scrollTop + clientHeight;
		if (h + 100 >= top && scrollTop > 100) {
			if (bFlag) {
				$('.msg').hide();
				bFlag = false;
				// json.data.pageNum++;
				// ajaxBase(json, false);
				filterJson.data.pageNum++;
				ajaxBase(filterJson, false);
			} else if (filterFlag) {
				$('.msg').hide();
				filterFlag = false;
				filterJson.data.pageNum++;
				ajaxBase(filterJson, false);
			}
		}
	});
});

function createList(arr, arrdep, num) {
	// console.log(arr, arrdep, num);
	if (num == 1) {
		//console.log(1);
		$('.cont .list ul').empty();
	}
	for (var i = 0; i < arr.length; i++) {
		var json = arr[i];
		var place, sdtTime, actTime, status, fltNo;
		var flightNoStr = json.flightNoStr;
		var routeName = [];
		var bFlag = false;
		if (arrdep == 'arr') {
			place = json.startAirportNameCn;
			fltNo = json.airlineCode + json.fltNo;
			sdtTime = json.destSdtTime || '-';
			if (json.destActTime != undefined) {
				actTime = json.destActTime;
			} else if (json.destEstTime != undefined) {
				actTime = json.destEstTime;
				bFlag = true;
			} else {
				actTime = '-';
			}
		} else if (arrdep == 'dep') {
			place = json.destAirportNameCn;
			fltNo = json.iata + json.fltNo;
			sdtTime = json.sdtTime || '-';
			if (json.actTime != undefined) {
				actTime = json.actTime;
			} else if (json.estTime != undefined) {
				actTime = json.estTime;
				bFlag = true;
			} else {
				actTime = '-';
			}
		}

		// if (json.sdtTime != undefined) {
		// 	sdtTime = json.sdtTime;
		// } else {
		// 	sdtTime = '-';
		// }

		if (json.releaseStatus1 != undefined) {
			status = json.releaseStatus1;
		} else {
			status = '计划';
		}

		if (json.route1AirportNameCn != undefined) {
			routeName.push(json.route1AirportNameCn);
		}
		if (json.route2AirportNameCn != undefined) {
			routeName.push(json.route2AirportNameCn);
		}
		if (json.route3AirportNameCn != undefined) {
			routeName.push(json.route3AirportNameCn);
		}
		if (json.route4AirportNameCn != undefined) {
			routeName.push(json.route4AirportNameCn);
		}
		if (json.route5AirportNameCn != undefined) {
			routeName.push(json.route5AirportNameCn);
		}
		if (json.route6AirportNameCn != undefined) {
			routeName.push(json.route6AirportNameCn);
		}
		//console.log(oruteName)
		if (routeName.length == 0) {
			routeName.push('-');
		}
		// console.log(json);
		var oLi = $('<li data-fltId=' + json.depfId + '>' +
			'<div class="flightNoStr"><p>' + flightNoStr + '</p></div>' +
			'<div class="place"><p>' + (place || '-') + '</p></div>' +
			'<div class="routeName"><p>' + routeName.join(', ') + '</p></div>' +
			'<div>' + sdtTime + '</div>' +
			'<div class="acttime"><p class="tip">预</p>' + actTime + '</div>' +
			// '<div class="terminalNo">' + json.terminal + '</div>' +
			'<div class="status">' + status + '</div>' +
			'</li>');
		if (arrdep == 'dep') {
			oLi.appendTo($('.g-wrap .cont').eq(0).find('.list ul'));
			$('.list').eq(0).show();
		} else if (arrdep == 'arr') {
			oLi.appendTo($('.g-wrap .cont').eq(1).find('.list ul'));
			$('.list').eq(1).show();
		};
		var color = getStateColor(json.releaseStatus1);
		oLi.find('.status').css({
			'color': color
		});

		if (bFlag) {
			oLi.find('.acttime .tip').show();
		}
		oLi.find('.str_origin').liMarquee({
			scrollamount: 20,
			runshort: false,
			hoverstop: false
		});
		var boxWS = oLi.find('.status').outerWidth();
		var contWS = oLi.find('.status p').outerWidth();
		//console.log('boxWS==='+boxWS+'contWS===='+contWS);
		if (contWS > boxWS) {

			oLi.find('.status').liMarquee({
				scrollamount: 20,
				hoverstop: false
			});
		}
		var boxWP = oLi.find('.flightNoStr').outerWidth();
		var contWP = oLi.find('.flightNoStr p').outerWidth();
		if (contWP > boxWP) {
			oLi.find('.flightNoStr').liMarquee({
				scrollamount: 20,
				hoverstop: false
			});
		}
		var boxWP = oLi.find('.place').outerWidth();
		var contWP = oLi.find('.place p').outerWidth();
		if (contWP > boxWP) {
			oLi.find('.place').liMarquee({
				scrollamount: 20,
				hoverstop: false
			});
		}
		var boxWR = oLi.find('.routeName').outerWidth();
		var contWR = oLi.find('.routeName p').outerWidth();
		if (contWR > boxWR) {
			oLi.find('.routeName').liMarquee({
				scrollamount: 20,
				hoverstop: false
			});
		}
	}

	var oH = $(document).outerHeight();
	$('.layer').css({
		'height': oH
	});
}

/*航班颜色：
备降、取消、延误：c73a29
正在登记、到达、起飞：1ec41a
立即登机：ff6d0d
补班延误：b911be
补班取消：999999*/
function getStateColor(str) {
	var colorName = '';
	switch (str) {
		case '备降':
		case '取消':
		case '延误':
			colorName = '#c73a29';
			break;
		case '正在登机':
		case '到达':
		case '起飞':
		case '登机口关闭':
		case '登机结束':
		case '正在办票':
		case '到下站':
		case '返航':
		case '滑回':
		case '办票截止':
		case '前方起飞':
			colorName = '#1ec41a';
			break;
		case '立即登机':
		case '登机':
		case '催促登机':
		case '过站登机':
			colorName = '#ff6d0d';
			break;
		case '补班延误':
			colorName = '#b911be';
			break;
		case '补班取消':
			colorName = '#999';
			break;
		case undefined:
		case '计划':
			colorName = '#2a86c7';
			break;
		default:
			colorName = '#666';
			break;
	}
	return colorName;
}