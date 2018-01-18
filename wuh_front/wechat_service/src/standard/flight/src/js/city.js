$(document).ready(function () {
	var interCity, domCity;
	var token = sessionStorage.getItem('token');
	var cityJson = {
		url: '<%= apiBase %>flight/getCities?token=' + token,
		success: function (data) {
			interCity = data.国外;
			domCity = data.国内;
			createList(domCity, 0);
			createList(interCity, 1);
		}
	};
	ajaxBase(cityJson, false);
	var cityHotJson = {
		url: '<%= apiBase %>flight/getSearchHotCity?token=' + token,
		success: function (data) {
			createHotList(data);
		}
	};
	ajaxBase(cityHotJson, false);
	$('.tab li').each(function (index) {
		$(this).on('click', function () {
			$('.tab li').removeClass('active');
			$(this).addClass('active');
			$('.cont').removeClass('active');
			$('.cont').eq(index).addClass('active');
		});
	});
	//点击列表
	$('.cont dl').on('click', 'dd', function () {
		setCity($(this));
	});
	$('.hot').on('click', 'li', function () {
		setCity($(this));
	});
	var header_height = $(".m-header").height();
	$(".letter").each(function (index) {
		$(this).on('click', 'li', function () {
			var list_index = $(this).index();
			$('html,body').stop().animate({
				scrollTop: $(".list").eq(index).find('dt').eq(list_index).offset().top - header_height
			}, 800);
		})
	});
	$('.search input').on('input', function () {
		var str = $(this).val().toUpperCase();
		if (str) {
			$('.letter').hide();
		} else {
			$('.letter').show();
		}
		// if ($('.tab li.active').hasClass('dom')) {
		var json = search(str, domCity);
		$('.cont').eq(0).find('dl').empty();
		if (!isEmptyObject(json)) {
			createList(json, 0)
		}
		// } else if ($('.tab li.active').hasClass('inter')) {
		var json1 = search(str, interCity);
		$('.cont').eq(1).find('dl').empty();
		if (!isEmptyObject(json1)) {
			createList(json1, 1);
		}
		// }

	});
});

function createList(json, num) {
	var oCont;
	var letter;
	var list = '';
	if (num == 0) {
		oCont = $('.cont').eq(0);
		letter = $('.letter').eq(0);
	} else if (num == 1) {
		oCont = $('.cont').eq(1);
		letter = $('.letter').eq(1);
	}
	for (var name in json) {
		var arr = json[name];
		var oDt = $('<dt id=' + name + '>' + name + '</dt>');
		list += '<li id=' + name + '>' + name + '</li>';
		oDt.appendTo(oCont.find('dl'));
		for (var i = 0; i < arr.length; i++) {
			var jsonTemp = arr[i];
			var oDd = $('<dd data-code=' + jsonTemp.cityCode + '>' + jsonTemp.nameCn + '</dd>');
			oDd.appendTo(oCont.find('dl'));
		}
	}
	letter.find('ul').html(list);
}

function setCity(obj) {
	var company = sessionStorage.getItem('company');
	var companyCode = sessionStorage.getItem('companyCode');
	if (company) {
		setSessionValue('company', company);
		setSessionValue('companyCode', companyCode);
		setSessionValue('city', obj.html());
		setSessionValue('cityCode', obj.attr('data-code'));
	} else {
		setSessionValue('city', obj.html());
		setSessionValue('cityCode', obj.attr('data-code'));
	};
	window.location.href = "portal.html";
	// if (company) {
	// 	window.location.href = 'portal.html?company=' + company + '&companyCode=' + companyCode + '&city=' + obj.html() + '&cityCode=' + obj.attr('data-code');
	// } else {
	// 	window.location.href = 'portal.html?city=' + obj.html() + '&cityCode=' + obj.attr('data-code');
	// }
}