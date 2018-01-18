$(document).ready(function () {
	var interCompany, domCompany;
	var token = sessionStorage.getItem('token');
	var companyJson = {
		url: '<%= apiBase %>flight/getAirLines?token=' + token,
		success: function (data) {
			interCompany = data.国外;
			domCompany = data.国内;
			createList(domCompany, 0);
			createList(interCompany, 1);
		}
	};
	ajaxBase(companyJson, false);
	var companyHotJson = {
		url: '<%= apiBase %>flight/getSearchHotAirline?token=' + token,
		success: function (data) {
			createHotList(data);
		}
	};
	ajaxBase(companyHotJson, false);

	$('.tab li').each(function (index) {
		$(this).on('click', function () {
			$('.tab li').removeClass('active');
			$(this).addClass('active');
			$('.cont').removeClass('active');
			$('.cont').eq(index).addClass('active');
		});
	});
	$('.cont dl').on('click', 'dd', function () {
		setCompany($(this));
	});
	$('.hot').on('click', 'li', function () {
		setCompany($(this));
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
		var json = search(str, domCompany);
		$('.cont').eq(0).find('dl').empty();
		if (!isEmptyObject(json)) {
			createList(json, 0)
		}
		// } else if ($('.tab li.active').hasClass('inter')) {
		var json1 = search(str, interCompany);
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
			var oDd = $('<dd data-code=' + jsonTemp.airlineCode + '>' + jsonTemp.nameCn + '</dd>');
			oDd.appendTo(oCont.find('dl'));
		}
	}
	letter.find('ul').html(list);
}

function setCompany(obj) {
	var city = sessionStorage.getItem('city');
	var cityCode = sessionStorage.getItem('cityCode');
	if (city) {
		setSessionValue('city', city);
		setSessionValue('cityCode', cityCode);
		setSessionValue('company', obj.html());
		setSessionValue('companyCode', obj.attr('data-code'));
	} else {
		setSessionValue('company', obj.html());
		setSessionValue('companyCode', obj.attr('data-code'));
	};
	window.location.href = "portal.html";
	// if (city) {
	// 	window.location.href = 'portal.html?city=' + city + '&cityCode=' + cityCode + '&company=' + obj.html() + '&companyCode=' + obj.attr('data-code');
	// } else {
	// 	window.location.href = 'portal.html?company=' + obj.html() + '&companyCode=' + obj.attr('data-code');
	// }
}