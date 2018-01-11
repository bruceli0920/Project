/**
 * 微信js-sdk接口封装
 * 引用此js文件需要先引入common.js
 */
var WXMANAGER = {
	appId: "wx50f0ad85669612b7",
	// api 默认全部
	jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo', 'startRecord',
		'stopRecord', 'onVoiceRecordEnd', 'playVoice', 'pauseVoice', 'stopVoice', 'onVoicePlayEnd', 'uploadVoice', 'downloadVoice',
		'chooseImage', 'previewImage', 'uploadImage', 'downloadImage', 'translateVoice', 'getNetworkType', 'openLocation', 'getLocation',
		'hideOptionMenu', 'hideMenuItems', 'showOptionMenu', 'showMenuItems', 'hideAllNonBaseMenuItem', 'showAllNonBaseMenuItem', 'closeWindow',
		'scanQRCode', 'chooseWXPay', 'openProductSpecificView', 'addCard', 'chooseCard', 'openCard'],
	card: { // 管理卡卷相关内容
		cardId: null // 卡卷id
	}
}
/**
 * 微信提示框
 */
function wxFail(){
	var lert = Dialog.init('alert');
	lert.show('微信','微信配置出错');
}


/**
 * 拍照或从手机相册中选图  
 */
function wxchooseImage(choose) {
	var sizeType = typeof choose.sizeType === "string" ? choose.sizeType.split(','):choose.sizeType ||['original','compressed'];
	var sourceType = typeof choose.sourceType ==="string" ? choose.sourceType.split(','):choose.sourceType || ['album','camera']; 
	wx.chooseImage({
		count: choose.count || 9,
		sizeType: sizeType,
		sourceType: sourceType,
		success: choose.success,
		fail: wxFail
	});
}
/** 
 * 上传图片
 */
function wxuploadImage( upload ) {
	wx.uploadImage({
		localId: upload.localId,
		isShowProgressTips: 1,
		success:upload.success,
		fail:wxFail
	});
}
/** 
 * 下载图片
 */
function wxdownloadImage( down ) {
	wx.downloadImage({
		serverId: down.serverId,
		isShowProgressTips: 1,
		success:down.success,
		fail:wxFail
	});
}

/**
 * 投放卡券
 */
function wxaddCard(json) {
	//1.设置处理卡券结果的处理函数
	WXMANAGER.card.cardId = json.cardId;
	WXMANAGER.card.code = json.code;

	// 卡卷配置
	var _cardConfig = function(cardExt){
		wx.addCard({
			cardList: [{
				cardId: WXMANAGER.card.cardId,
				cardExt: cardExt
			}],
			success: function (res) {
				typeof json.ready === 'function' && json.ready(res); // 卡卷配置成功执行函数
			}
		});
	}
	// 2.获取卡券扩展字段
	var obj = {
		noLoading: true, // 不显示loading层
		url: '<%=domain+cardext%>' || '/aup/api/wechat/card/cardExt',
		contentType: 'default',//表单方式提交
		data: {
			cardId: WXMANAGER.card.cardId,
			code: WXMANAGER.card.code
		},
		success:_cardConfig 

	}
	ajaxBase(obj, true);
}

/**
 * 
 * 微信配置初始化
 * @param {any} obj
 */
function wxInit(obj) {
	//1.获取签名
	//2. 微信配置初始化
	//3.配置完成后执行方法

	// 微信配置初始化
	var apiList = typeof obj.apiList ==='string' ? obj.apiList.split(','):obj.apiList; // '','' / ['','']
	var _doConfig = function( jsSdkSignature ){
		wx.config({
			debug: false,
			appId: WXMANAGER.appId,
			timestamp: jsSdkSignature.timestamp,
			nonceStr: jsSdkSignature.nonceStr,
			signature: jsSdkSignature.sign,
			jsApiList: apiList || WXMANAGER.jsApiList // api自己传入 或者 使用默认(全部api)
		});

		wx.ready(function () {
			typeof obj.ready === 'function' && obj.ready(); // 微信配置成功使用方法
		});
		wx.error(function (res) {
			alert(res);
		});	
	}
	
	// 开始获取签名
	var ajaxobj = {
		url: '<%=signature%>' || '/aup/api/wechat/jssdk/signature',
		contentType: 'default',//表单方式提交
		data: {
			url: window.location.href
		},
		success: _doConfig, //获取签名成功执行微信配置方法
		noLoading: true // 不显示loading层
	};
	ajaxBase(ajaxobj, true); // true 不添加公共参数

}
