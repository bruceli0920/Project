window.currentAirport = 'CKG';
window.localer = {};
actionUrl = '<%=domain+log.page%>' || '/aup/api/log/pageAction';
promoUrl = '<%=domain+log.activity %>' || '/aup/api/log/promoLog';
// 页面事件
window.pageLoad = 'pageLoad';
window.pageLocation = 'pageLocation';

// js 兼容 ----------------------------------------
if (!window.location.origin) {
    window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
}
// ------------------------------------------------

/**
 *
 * 存储 userId 到session 中
 * @param {any} userId
 */
function setUserId(userId) {
	sessionStorage.setItem('userId', userId);
}
/**
 *
 * 获取 userId 根据userType 不同而取值不同
 * @returns
 */
function getUserId() {
	var userId = sessionStorage.getItem('userId');
	return (!!userId && userId == 'null') ? null : userId;
}

/**
 *
 * 存储 userType 到session 中
 * @param {any} userType
 */
function setUserType(userType) {
	sessionStorage.setItem('userType', userType);
}
/**
 *
 * 获取 userType
 * @returns
 */
function getUserType() {
	var userType = sessionStorage.getItem('userType');
	return (!!userType && userType == 'null') ? null : userType;
}

/**
 *
 * 存储 areaCode 到session 中
 * @param {any} areaCode
 */
function setAreaCode(areaCode) {
	sessionStorage.setItem('areaCode', areaCode);
}
/**
 *
 * 获取areaCode
 * @returns
 */
function getAreaCode() {
	var areaCode = sessionStorage.getItem('areaCode');
	return (!!areaCode && areaCode == 'null') ? null : areaCode;
}

/**
 *
 * 存储 entrance 到session 中
 * @param {any} entrance
 */
function setPageEntrance(entrance) {
	sessionStorage.setItem('entrance', entrance);
}
/**
 *
 * 获取 entrance
 * @returns
 */
function getPageEntrance() {
	var entrance = sessionStorage.getItem('entrance');
	return (!!entrance && entrance == 'null') ? null : entrance;
}
/**
 * 更新 commonParam的参数值
 */
function updateCommonParam() {
	commonParam.userId = getUserId() || getUrlQueryString('userId');
	commonParam.userType = getUserType() || getUrlQueryString('userType') || 1;
	commonParam.areaCode = getAreaCode() || getUrlQueryString('areaCode');
	commonParam.pageEntrance = getPageEntrance() || getUrlQueryString('entrance') || 200;
}
/**
 * 用于入口页面调用的 公共参数的session设置
 */
function setSession() {
	var _setValue = function(key, value) {
		if (!!value) {
			sessionStorage.setItem(key, value);
		}
	}
	_setValue('userId', getUrlQueryString('userId') || getUrlQueryString('openId') || getUrlQueryString('openid'));
	_setValue('userType', getUrlQueryString('userType'));
	_setValue('areaCode', getUrlQueryString('areaCode'));
	_setValue('entrance', getUrlQueryString('entrance'));

	updateCommonParam();
}

// ajax调用需要传递的公共参数
var commonParam = {
	currentAirport: currentAirport,
	userId: getUserId() || getUrlQueryString('userId'),
	userType: getUserType() || getUrlQueryString('userType') || 1,
	areaCode: getAreaCode() || getUrlQueryString('areaCode'),
	buildingId: '',
	floorNo: '',
	xCoord: '',
	yCoord: '',
	pageEntrance: getPageEntrance() || getUrlQueryString('entrance') || 200
}

/**
 *
 *返回一个n-m的随机数
 * @param {any} n
 * @param {any} m
 * @returns
 */
function rnd(n, m) {
	return Math.random() * (m - n) + n;
}
/**
 *
 * 获取地址栏的?后面的参数
 * @param {any} str
 * @param {any} name
 * @returns
 */
function GetQueryString(str, name) {
	str = decodeURIComponent(str);
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
	var r = str.substr(str.indexOf("?") + 1).match(reg);
	if (r != null) return unescape(r[2]);
	return null;
}
/**
 *
 *获取地址栏里的某一个参数
 * @param {any} name
 * @returns
 */
function getUrlQueryString(name) {
	return GetQueryString(window.location.href, name);
}
/**
 *
 *去除收尾空格的函数
 * @param {any} str
 * @returns
 */
function trim(str) {
	return str.replace(/^\s+|\s+$/g, '');
}

/**
 *
 * 转化 html 字符串 到 dom元素
 * @param {any} str
 * @returns
 */
function parseDom(str) {
	var div = document.createElement('div');
	div.innerHTML = str;
	return div.childNodes[0];
}
/**
 *
 * 封装ajax
 * @param {any} obj
 * @param {any} ignore true 忽略公共参数的添加
 */
function ajaxBase(obj, ignore) {
	var lert = null; // dialog 弹出对象
	var loading = null; // loading 弹层
	var param = '';
	var sign = obj.url;

	// loading初始化
	var _initTool = function() {
		//  obj.noLading = true 时 不显示 loading弹层
		if (ajaxBase.data.loading && !obj.noLoading) { //全局显示 loading 或 单次调用不禁止loading显示时
			loading = Loading.init(); // 加载 loading代码
			ajaxBase.loading = loading; //暴露 loading 给 ajaxBase
		}
		if (!obj.error || !obj.errorCode) { // 不自己处理错误时添加公共的弹出处理
			lert = Dialog.init('alert'); //加载 弹出层代码
			ajaxBase.alert = lert; //暴露 alert 给 ajaxBase
		}
	}
	if (!ignore) {
		// var arr = [];
		// for (var key in commonParam) {
		// 	arr.push(key + '=' + commonParam[key]);
		// }
		// arr.push('requestTime=' + (+new Date()));
		// param = sign + param + arr.join('&');

		_initTool();
	} else { // 忽略公共参数
		param = sign + 'ignoreLog=true'; //忽略参数 控制后台是否解析公共参数
	}
	var _doFunction = function(func) { // 判断并执行方法
		var args = Array.prototype.slice.call(arguments, 1); //截取 第一个参数 后面的参数
		typeof func === 'function' && func.apply(this, args);
	}
	var _showLoading = function() {
		if (loading) {
			// 默认 显示时 展示loading
			loading.show();
		}
	}
	var _hideLoading = function() { //隐藏 loading动画
		if (loading) {
			// obj.hideLoading 不传 true 默认隐藏 ,传递值 true 隐藏 flase 不隐藏
			var hideOneLoading = 'hideLoading' in obj ? (obj.hideLoading ? true : false) : true;
			// 默认显示 且 不自己处理 隐藏loading操作时 隐藏 loading, obj.hideLoading 控制单个 ajax调用的 隐藏loading 方式
			(ajaxBase.data.hideLoading || hideOneLoading) && loading.hide();
		}
	}
	var contentType = obj.contentType == 'default' ? 'application/x-www-form-urlencoded' : obj.contentType;
	var data = JSON.stringify(obj.data || {});
	// application/json 时 才会转化到 json字符串
	if (contentType && contentType.indexOf('application/json') < 0) {
		data = obj.data || {};
	}
	$.ajax({
		type: obj.type || 'post',
		dataType: obj.dataType || 'json',
		contentType: contentType || 'application/json; charset=utf-8',
		beforeSend: function() {
			_showLoading();
			_doFunction(obj.beforeSend);
		},
		cache: obj.cache == 'yes' ? true : false, //默认无缓存
		async: obj.async == 'no' ? false : true, // 默认true异步
		data: data,
		url: obj.url
		//  + param
	}).done(function(json, textStatus, jqXHR) {
		if (json.code == '0') { //请求成功
			_doFunction(obj.success, json.rst, json.code); // 传入code备用
			_hideLoading();
		} else if (json.code == '-1') { // 求情错误
			if (obj.errorCode) { // 自己处理 请求出错 如控制页面跳转
				_hideLoading();
				_doFunction(obj.errorCode, json);
			} else {
				_hideLoading();
				lert && lert.show('请求错误', json.msg);
			}
		}
	}).fail(function(jqXHR, textStatus, errorThrown) {
		_doFunction.fail = true; // 请求成功
		if (obj.error) { // 自己处理错误
			_doFunction(obj.error, errorThrown);
		} else {
			lert && lert.show('请求失败', '服务器异常');
		}
	}).always(function() {
		(_doFunction.fail && loading) && loading.hide();
		_doFunction(obj.complete);
	});
}
ajaxBase.data = {
	loading: true, // 全局设置是否显示 loading 信息 true 显示 false 不显示
	hideLoading: true // 是否直接控制隐藏 true 自动控制隐藏 false 不自动隐藏自己控制
}
ajaxBase.config = function(obj) { // 修改全局
		for (var key in obj) {
			if (key in ajaxBase.data) {
				ajaxBase.data[key] = obj[key];
			}
		}
	}
	/**
	 * ~位运算符 用来转换时间到数字
	 * 窗口跳转到某个链接
	 * @param {any} url
	 * @param {any} type
	 */
function jumpTo(url, type) {
	if (!url) {
		return;
	}
	var v = getUrlQueryString('v');
	var openid = getUrlQueryString('openid') || getUrlQueryString('openId');
	// if (type == 'add-version' && !v) { // 随机添加版本号 可以避免一些缓存
	// 	url = url.lastIndexOf('#') > -1 ? url.substring(0, url.length - 1) : url;
	// 	var q = url.indexOf('?') > -1;
	// 	url = url + (q ? '&v=' : '?v=') + ~~new Date();
	// }
	if (!openid && !!commonParam.userId) { //没有openid 且 userId 有值 添加 openid
		openid = commonParam.userId;
		var sign = url.indexOf('?') > -1 ? '&' : '?';
		url = url + sign + 'openid=' + openid;
	}
	window.location.href = url;
}
/**
 *
 * 添加回退事件
 * @param {any} selector 回退按钮选择器
 * @returns
 */
function backAction(selector) {
	var back = document.querySelector(selector || '.back');
	if (!!back) {
		var ignore = back.getAttribute('ignore');
		if (ignore) {
			return;
		}
		var href = back.getAttribute('href');
		var flag = href.indexOf('#') > -1 || href.indexOf('history') < 0 || trim(href) == '';
		var refresh = back.getAttribute('refresh');

		if (!href || flag) { // 不为空 或 是无效链接
			back.addEventListener('click', function() {
				// if (document.referrer) { // 获取上一个页面的 url: 有时会丢失 导致两个页面循环跳转
				//     window.location.href = document.referrer;
				// }
				if (refresh) { // 返回并刷新
					window.history.go(-1); // 返回 并刷新
				} else {
					window.history.back(); // 返回
				}
			});
		}
	}
}
/**
 *
 * 添加跳转到home页面事件
 * @param {any} selector 回退按钮选择器
 * @returns
 */
function homeAction(selector) {
	var home = document.querySelector(selector || '.home');
	if (!!home) {
		var ignore = home.getAttribute('ignore');
		if (ignore) {
			return;
		}
		var href = home.getAttribute('href');
		var flag = href.indexOf('#') > -1 || href.indexOf('history') < 0 || trim(href) == '';
		var refresh = home.getAttribute('refresh');
		//需要修改的地方
		if ( flag ) { // 不为无效链接
			home.addEventListener('click', function() {
				if( commonParam.userId ) { // sessionStorage 中有 userId ( openId )
					window.top.location.href = '<%=homeUrl%>';
				} else { // 没有 userId (openId) 进行重定向 重新获取
					var urlPrefix = window.location.origin;
					var oauthPrefix = urlPrefix.indexOf('traffic') > -1 ? 'http://traffic.rtmap.com/aup/api/wechat/oauth/snsapiBase?redirect_uri='
									: 'http://airtest.rtmap.com/aup/api/wechat/oauth/snsapiBase?redirect_uri=';

				    window.top.location.href = oauthPrefix + urlPrefix + '<%=homeUrl%>';
				}
			});
		}
	}
}
/**
 * 启动获取位置信息的定时器
 * js 依赖 rtmap.lbspoisdk.1.0.1.js 和 getlocation.js
 */
function runLocationThead(callback) {
	WechatLocate.prepare({
		debug: "false"
	});
	var timer = setInterval(function() {
		var data = WechatLocate.locationData();

		if (data && data.result.error_code == 0) {
			clearInterval(timer);

			commonParam.buildingId = window.localer.buildingId = data.lbsinfo.buildid;
			commonParam.floorNo = window.localer.floorNo = data.lbsinfo.floor;
			commonParam.xCoord = window.localer.xCoord = data.lbsinfo.x;
			commonParam.yCoord = window.localer.yCoord = data.lbsinfo.y;


			typeof callback === 'function' && callback();
		}
	}, 1000);
}
/**
 *
 *记录页面动作日志，包括请求定位日志
 * @param {any} json
 * @param {any} callback
 */
function ajaxActionLog(json, callback) {
	var time = new Date().getTime();
	json.data.currentAirport = currentAirport;
	json.data.requestUrl = window.location.href;
	json.data.requestTime = time;

	json.data.userId = json.data.userId || commonParam.userId;
	json.data.userType = json.data.userType || commonParam.userType;
	json.data.areaCode = json.data.areaCode || commonParam.areaCode;
	json.data.pageEntrance = json.data.pageEntrance || commonParam.pageEntrance;
	json.data.action = json.data.action || pageLoad;


	var ajaxObj = {
			url: actionUrl,
			data: json.data,
			type: json.type,
			contentType: json.contentType || 'application/json; charset=utf-8',
			success: json.success,
			error: function(e) {
				console.log('日志服务调用失败!');
			}
		}
		// 页面初始化 日志记录
	ajaxBase(ajaxObj, true);
	if (json.stopLocation) { // 禁用定位轮询,定位已其它方式获取时使用
		ajaxObj.data.action = pageLocation;

		//暴露 触发位置信息的日志记录 调用流程 ajaxActionLog() 后执行 并传入位置信息 ajaxActionLog.actionLog({});
		// 暴率方法 actionLog 此方法可以访问到 内部变量
		ajaxActionLog.actionLog = function(local) {
			if (local) {
				ajaxObj.data.buildingId = local.buildingId;
				ajaxObj.data.floorNo = local.floorNo;
				ajaxObj.data.xCoord = local.xCoord;
				ajaxObj.data.yCoord = local.yCoord;
				ajaxBase(ajaxObj, true);
			}
		}
	} else { // 默认调用获取位置定时器
		runLocationThead(function() {
			// 赋值位置信息
			json.data.buildingId = localer.buildingId;
			json.data.floorNo = localer.floorNo;
			json.data.xCoord = localer.xCoord;
			json.data.yCoord = localer.yCoord;
			json.data.action = pageLocation;

			ajaxObj.data = json.data;
			ajaxBase(ajaxObj, true);
			typeof callback === 'function' && callback();
		});
	}

}

/**
 *
 * 活动日志
 * @param {any} json
 */
function ajaxPromoLog(json) {
	json.data.currentAirport = currentAirport;
	var ajaxObj = {
		url: promoUrl,
		data: json.data,
		type: json.type,
		contentType: json.contentType || 'application/json; charset=utf-8',
		success: json.success,
		error: function(e) {
			console.log('活动日志服务调用失败!');
		}
	}
	ajaxBase(ajaxObj, true);
}

/**
 * 文档加载完成
 * 
 * @param {any} callback
 */
function docReady(callback) {
    //console.log(document.readyState);
    var readyState = document.readyState;
    var _do = function () {
        // homeAction();
        typeof callback === 'function' && callback();
    }
    if (readyState == 'complete') {
        _do();
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            _do();
        }, false);
    }
}

docReady(function() {
	homeAction();
});

// 合并 其它功能
// @@include('../module/js/loading.js')
// @@include('../module/js/dialog.js')