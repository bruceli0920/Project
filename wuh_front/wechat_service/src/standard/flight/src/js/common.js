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



function isEmptyObject(e) {
	var t;
	for (t in e)
		return !1;
	return !0
}

function search(str, json) {
	var dataJson = {};
	for (var name in json) {
		var arrTemp = json[name];
		for (var i = 0; i < arrTemp.length; i++) {
			var jsonTemp = arrTemp[i];
			for (var key in jsonTemp) {
				var value = jsonTemp[key];
				if (typeof value == 'string') {
					if (value.indexOf(str) != -1) {
						if (dataJson[name]) {
							dataJson[name].push(jsonTemp);
						} else {
							dataJson[name] = [];
							dataJson[name].push(jsonTemp);
						}
						break;
					}
				}
			}
		}
	}
	return dataJson;
}

function createHotList(arr) {
	for (var i = 0; i < arr.length; i++) {
		var json = arr[i];
		var code;
		if (json.cityCode != undefined) {
			code = json.cityCode;
		} else if (json.airlineCode != undefined) {
			code = json.airlineCode;
		}
		var oLi = $('<li class="fl" data-code=' + code + '>' + json.nameCn + '</li>');
		if (json.domint == 'D') {
			oLi.appendTo($('.cont').eq(0).find('.hot ul'));
		} else if (json.domint == 'I') {
			oLi.appendTo($('.cont').eq(1).find('.hot ul'));
		}
	}
}

/*航班状态颜色：
备降、取消、延误：c73a29
正在登记、到达、起飞：1ec41a
立即登机：ff6d0d
补班延误：b911be
补班取消：999999
2a86c7 */
function getStateColor(str) {
	var colorName = '';
	switch (str) {
		case '计划':
			colorName = '#2a86c7';
			break;
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
		case '办票截止':
		case '前方起飞':
		case '到下站':
		case '返航':	
		case '滑回':
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
		default:
			colorName = '#666';
			break;
	}
	return colorName;
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