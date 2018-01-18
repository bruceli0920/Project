function formatTime(num) {
	var arr = [];
	for (var i = 0; i < num; i++) {
		var oDate = new Date();
		var time = oDate.getTime();
		time = time + i * 86400000;
		oDate.setTime(time);
		var year = oDate.getFullYear();
		var month = oDate.getMonth() + 1;
		var day = oDate.getDate();
		//console.log(oDate.getDay())
		var week = formatWeek(oDate.getDay());
		var str = year + '-' + month + '-' + day + ' ' + week;
		arr.push(str);
	}
	return arr;
}

function formatWeek(num) {
	var str = '';
	switch (num) {
		case 1:
			str = '一';
			break;
		case 2:
			str = '二';
			break;
		case 3:
			str = '三';
			break;
		case 4:
			str = '四';
			break;
		case 5:
			str = '五';
			break;
		case 6:
			str = '六';
			break;
		case 0:
			str = '日';
			break;
	}
	return '星期' + str;
}

function setSessionValue(key, value) {
	var _doPostBack = function (key, value) {
		if (!!value) {
			sessionStorage.setItem(key, value);
		}
	};
	_doPostBack(key, value);
	//sessionStorage.getItem()
}