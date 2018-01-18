$(document).ready(function () {
	dialogA = Dialog.init('alert');
	// var city = getUrlQueryString('city');
	// var cityCode = getUrlQueryString('cityCode');
	// var company = getUrlQueryString('company');
	// var companyCode = getUrlQueryString('companyCode');
	var token = sessionStorage.getItem('token') || getUrlQueryString('token');
	setSessionValue('token', token);
	var reverse = sessionStorage.getItem('reverse') || "false";
	setSessionValue('reverse', reverse);
	var monthIndex = sessionStorage.getItem('month') || '';
	setSessionValue('month', monthIndex);

	// if (city) {
	// 	$('.select').val(city);
	// 	$('.select').attr({
	// 		'data-code': cityCode
	// 	});
	// 	$('.tab li').removeClass('active');
	// 	$('.tab li').eq(1).addClass('active');
	// 	$('.cont').removeClass('active');
	// 	$('.cont').eq(1).addClass('active');

	// }
	// if (company) {
	// 	$('.company input').val(company);
	// 	$('.company input').attr({
	// 		'data-code': companyCode
	// 	});
	// 	$('.company span').show();
	// 	$('.tab li').removeClass('active');
	// 	$('.tab li').eq(1).addClass('active');
	// 	$('.cont').removeClass('active');
	// 	$('.cont').eq(1).addClass('active');
	// }
	if (sessionStorage.getItem('city')) {
		$('.select').val(sessionStorage.getItem('city'));
		$('.select').attr({
			'data-code': sessionStorage.getItem('cityCode')
		});
		$('.tab li').removeClass('active');
		$('.tab li').eq(1).addClass('active');
		$('.cont').removeClass('active');
		$('.cont').eq(1).addClass('active');
	}
	if (sessionStorage.getItem('company')) {
		$('.depart input').val('重庆');
		$('#company').val(sessionStorage.getItem('company'));
		$('#company').attr({
			'data-code': sessionStorage.getItem('companyCode')
		});
		$('.company span').show();
		$('.tab li').removeClass('active');
		$('.tab li').eq(1).addClass('active');
		$('.cont').removeClass('active');
		$('.cont').eq(1).addClass('active');
	}
	if (sessionStorage.getItem('company') == "null") {
		$("#company").val('');
	};
	if (sessionStorage.getItem('reverse') == "true") {
		$('.address .depart input').appendTo($('.address .dest'));
		$('.address .dest input').eq(0).appendTo($('.address .depart'));
	} else {};

	// console.log(
	// 	sessionStorage.getItem('city'),
	// 	sessionStorage.getItem('cityCode'),
	// 	sessionStorage.getItem('company'),
	// 	sessionStorage.getItem('companyCode'),
	// 	sessionStorage.getItem('reverse'));
	//导航页签切换
	$('.tab li').each(function (index) {
		$(this).on('click', function () {
			$(".msg").hide();
			$('.tab li').removeClass('active');
			$(this).addClass('active');
			$('.cont').removeClass('active');
			$('.cont').eq(index).addClass('active');
			if (index == 2) {
				var timeJson = {
					url: '<%= apiBase %>subscribe/getFollowList?token=' + token,
					success: function (data) {
						follow(data);
						console.log(data)
						console.log(data.hasOwnProperty("depList"))
						if ((data.hasOwnProperty("depList")==false)&&(data.hasOwnProperty("arrList")==false)){ 
							$(".msg").show();				
						}		
					}
				};
				ajaxBase(timeJson);
				$('.btn').hide();
			} else {
				$('.btn').show();
			}
		});
	});
	//日期
	var timeJson = {
		url: '<%= apiBase %>flight/getServerTime?token=' + token,
		success: function (data) {
			var time = Math.floor(data.time);
			for (var i = -1; i < 2; i++) {
				var json;
				if (i == 0) {
					json = formatsTime(time, 'active');
					// setSessionValue('month', '0');
				} else if (i == 1) {
					json = formatsTime(time + i * 86400000, 'none');
				} else {
					json = formatsTime(time + i * 86400000, '');
				};
				createDate(json);
			}
		}
	};
	ajaxBase(timeJson, false);
	//出发到达日期切换
	$('.date .arrdep li').on('click', function () {
		$('.date .arrdep li').removeClass('active');
		$(this).addClass('active');
	});
	$('.date .time').on('click', 'li', function () {
		var oParent = $(this).parents('.cont');
		oParent.find('.date .time li').removeClass('active');
		$(this).addClass('active');
		// if ($('.date').parents('.cont').attr('class') == 'cont city active') {
		// 	console.log(1);
		// 	setSessionValue('month', Number($(this).index()) - 1);
		// };
	});
	//切换按钮
	$('.city .address .cut').on('click', function () {
		if (sessionStorage.getItem('reverse') == "false") {
			setSessionValue('reverse', "true");
		} else {
			setSessionValue('reverse', "false");
		};
		$('.address .depart input').appendTo($('.address .dest'));
		$('.address .dest input').eq(0).appendTo($('.address .depart'));
	});
	//查询按钮
	$('.btn').on('click', function () {
		var oCont = $('.cont.active');
		var oDate = new Date();
		var year = oDate.getFullYear();
		var dateStr = year + '-' + oCont.find('.date .time li.active').attr('data-time');
		var arrdep;
		if (oCont.hasClass('flight')) {
			arrdep = $('.arrdep li.active').attr('data-arrdep');
			var flightNo = oCont.find('.flightno input').val();
			var reg = /^(\w{2})?[0-9]{2,4}([a-zA-Z]{1})?$/g;
			if (reg.test(flightNo) && flightNo != "") {
				window.location.href = 'list.html?flightNo=' + flightNo + '&arrdep=' + arrdep + '&dateStr=' + dateStr + '&type=flight';
			} else {
				dialogA.show(); // 显示弹窗
				dialogA.setValue('', '请输入正确的航班号');
				// 请输入正确的航班号
			};
		} else if (oCont.hasClass('city')) {
			if ($('.address .depart input').val() == '重庆') {
				arrdep = 'dep';
			} else {
				arrdep = 'arr';
			}
			var startStation = oCont.find('.depart input').attr('data-code');
			var endStation = oCont.find('.dest input').attr('data-code');
			var airLine = $('.cont .company input').attr('data-code');
			window.location.href = 'list.html?startStation=' + startStation + '&endStation=' + endStation + '&arrdep=' + arrdep + '&dateStr=' + dateStr + '&airLine=' + airLine + '&type=city';
		}
	});
	//城市选择
	$('.select').on('click', function () {
		window.location.href = 'city.html' + window.location.search;
	});
	$('.company input').on('click', function () {
		window.location.href = 'company.html' + window.location.search;
	});
	$('.company span').on('click', function () {
		$('.company input').val('');
		$('.company input').attr({
			'data-code': ''
		});
		sessionStorage.setItem('company', null);
		$('.company span').hide();
	});
	// 点击跳转关注列表
	$(".follow .list").on('click', 'li', function () {
		var fltId = $(this).attr('data-fltid');
		var arrdep = $(this).attr('arrdep');
		window.location.href = 'detail.html?fltId=' + fltId + '&arrdep=' + arrdep;
	});
});

/*
 *创建日期
 *格式化好的一组时间对象
 */
function createDate(json) {
	var oLi = $('<li data-time=' + json.time + ' class=' + json.sClass + '>' +
		'<p class="day">' + json.day + '</p>' +
		'<p class="month">' + json.mon + '</p></li>');
	oLi.appendTo($('.cont .date .time'));
}

function formatsTime(time, sClass) {
	var monArr = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月',
		'九月', '十月', '十一月', '十二月',
	];
	var oDate = new Date();
	oDate.setTime(time);
	var mon = oDate.getMonth();
	var day = oDate.getDate();
	return {
		mon: monArr[mon],
		day: day,
		sClass: sClass,
		time: (mon + 1) + '-' + day
	};
}
// 获取关注列表
function follow(json) {
	var dep = json.depList;
	var arr = json.arrList;
	$('.list ul').html('');
	var list = [];
	var str = "<ul>";
	var arrdep = '';
	if (dep != null) {
		for (var q in dep) {
			list.push(dep[q])
		}
	};
	if (arr != null) {
		for (var k in arr) {
			list.push(arr[k])
		}
	};
	for (var i in list) {
		code = list[i].airlineCode || list[i].iata;
		flt = list[i].fltNo || '';
		var status;
		if (list[i].releaseStatus1 == undefined) {
			status = '计划';
		} else {
			status = list[i].releaseStatus1;
		}
		if (list[i].airlineCode != null) {
			arrdep = 'arr';
		} else {
			arrdep = 'dep';
		};
		var fltiden = list[i].identification;
		// TODO判断是否到达
		var fltStrarr = fltiden.substring(fltiden.length - 1);

		if (fltStrarr == "D") {
			var oLi = $('<li arrdep=' + arrdep + ' data-fltId=' + list[i].identification + '>\
			<div class="title clearfix">\
				<p class="icon fl"></p>\
				<p class="fl name">' + list[i].iataCn + code + flt + '</p>\
			</div>\
			<div class="detail clearfix">\
				<div class="fl">\
					<p class="time">' + list[i].sdtTime + '</p>\
					<p class="city">' + list[i].startAirportNameCn + '<span class="ter1">' + list[i].terminal + '</span>' + '</p>\
				</div>\
				<p class="status fl">' + status + '</p>\
				<div class="fl">\
					<p class="time">' + list[i].destSdtTime + '</p>\
					<p class="city">' + list[i].destAirportNameCn + '</p>\
				</div>\
			</div>\
		</li>');
		} else { 
			var oLi = $('<li arrdep=' + arrdep + ' data-fltId=' + list[i].identification + '>\
			<div class="title clearfix">\
				<p class="icon fl"></p>\
				<p class="fl name">' + list[i].iataCn + code + flt + '</p>\
			</div>\
			<div class="detail clearfix">\
				<div class="fl">\
					<p class="time">' + list[i].sdtTime + '</p>\
					<p class="city">' + list[i].startAirportNameCn + '</p>\
				</div>\
				<p class="status fl">' + status + '</p>\
				<div class="fl">\
					<p class="time">' + list[i].destSdtTime + '</p>\
					<p class="city">' + list[i].destAirportNameCn + '<span class="ter2">' + list[i].terminal + '</span>'+ '</p>\
				</div>\
			</div>\
		</li>');
		}
	
		
		oLi.appendTo($('.list ul'));
		var color = getStateColor(status);
		oLi.find('.status').css({
			color: color
		});
		oLi.find('.title .icon').css({
			'background': 'url(images/' + code + '.gif) no-repeat',
			'backgroundSize': 'contain'
		});	
	};
}