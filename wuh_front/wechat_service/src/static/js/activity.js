//调用自定义的shake摇一摇函数
(function (global, factory) {
	if (typeof define === "function" && define.amd) {
		define(function () {
			return factory(global, global.document)
		})
	} else {
		if (typeof module !== "undefined" && module.exports) {
			module.exports = factory(global, global.document)
		} else {
			global.Shake = factory(global, global.document)
		}
	}
}(typeof window !== "undefined" ? window : this, function (window, document) {
	function Shake(options) {
		this.hasDeviceMotion = "ondevicemotion" in window;
		this.options = {
			threshold: 15,
			timeout: 1000
		};
		if (typeof options === "object") {
			for (var i in options) {
				if (options.hasOwnProperty(i)) {
					this.options[i] = options[i]
				}
			}
		}
		this.lastTime = new Date();
		this.lastX = null;
		this.lastY = null;
		this.lastZ = null;
		if (typeof document.CustomEvent === "function") {
			this.event = new document.CustomEvent("shake", {
				bubbles: true,
				cancelable: true
			})
		} else {
			if (typeof document.createEvent === "function") {
				this.event = document.createEvent("Event");
				this.event.initEvent("shake", true, true)
			} else {
				return false
			}
		}
	}
	Shake.prototype.reset = function () {
		this.lastTime = new Date();
		this.lastX = null;
		this.lastY = null;
		this.lastZ = null
	};
	Shake.prototype.start = function () {
		this.reset();
		if (this.hasDeviceMotion) {
			window.addEventListener("devicemotion", this, false)
		}
	};
	Shake.prototype.stop = function () {
		if (this.hasDeviceMotion) {
			window.removeEventListener("devicemotion", this, false)
		}
		this.reset()
	};
	Shake.prototype.devicemotion = function (e) {
		var current = e.accelerationIncludingGravity;
		var currentTime;
		var timeDifference;
		var deltaX = 0;
		var deltaY = 0;
		var deltaZ = 0;
		if ((this.lastX === null) && (this.lastY === null) && (this.lastZ === null)) {
			this.lastX = current.x;
			this.lastY = current.y;
			this.lastZ = current.z;
			return
		}
		deltaX = Math.abs(this.lastX - current.x);
		deltaY = Math.abs(this.lastY - current.y);
		deltaZ = Math.abs(this.lastZ - current.z);
		if (((deltaX > this.options.threshold) && (deltaY > this.options.threshold)) || ((deltaX > this.options.threshold) && (deltaZ > this.options.threshold)) || ((deltaY > this.options.threshold) && (deltaZ > this.options.threshold))) {
			currentTime = new Date();
			timeDifference = currentTime.getTime() - this.lastTime.getTime();
			if (timeDifference > this.options.timeout) {
				window.dispatchEvent(this.event);
				this.lastTime = new Date()
			}
		}
		this.lastX = current.x;
		this.lastY = current.y;
		this.lastZ = current.z
	};
	Shake.prototype.handleEvent = function (e) {
		if (typeof (this[e.type]) === "function") {
			return this[e.type](e)
		}
	};
	return Shake
}));

//获取desc里的字段
function getDescQueryString(str, name) {
	var reg = new RegExp("(^||)" + name + ":([^|]*)(||$)");
	var r = str.match(reg);
	if (r != null) return unescape(r[2]);
	return null;
}
// 随机函数 0,5 返回 0-5;
function Mathrandom(min, max) {
	var randomNum = max - min + 1;
	return Math.floor(Math.random() * randomNum + min);
};
// 保存卡券投放记录
function saveAddCardRecord(res) {
	window.isBusy = false;
	ajaxBase({
		url: "/aup/api/wechat/card/addCard",
		data: cardList
	});
}
// 未中奖红包 广告页面 || 二维码页面
function advertising() {
	var rate = typeof getUrlQueryString("rate") === "string" ? getUrlQueryString("rate") : "0";
	var adcount = getUrlQueryString("adcount") || 1;
	var random = Mathrandom(1, 10) / 10;
	var sing_iframe = "";
	if ($('#sing_iframe').attr('src') != undefined) {
		$('#sing_iframe').remove();
	};
	$("#sing").css({
		"display": "none"
	});
	if (random >= rate) {
		if($('#iframe', parent.document).siblings('#sing').css('display')){
			$('#iframe', parent.document).siblings('#sing').css({
				'display': 'none'
			});
		};
		logdata_num = Mathrandom(1, adcount);
		var theme = "advertising/sing_" + logdata_num + ".html";
		sing_iframe = '<iframe id="sing_iframe" src="' + theme + '"></iframe>';
		$("#sing").append(sing_iframe);
		$("#sing").css({
			"display": "block"
		});
	} else {
		// var theme = "lose.html"
		// sing_iframe = '<iframe id="sing_iframe" src="' + theme + '"></iframe>';
		// $("#sing").append(sing_iframe);
		$('#iframe', parent.document).siblings('#sing').css({
			'display': 'block'
		});
	};
}

// type:true 中奖（微信卡券、虚拟卡券）；false 不中奖（广告券、二维码关注公众号）
// data：营销平台定义的卡券信息
function showTicket(type, data) {
	logdata_num = -1;
	_st = setTimeout(function () {
		window.isBusy = type;
	}, 100);
	if (!type) {
		advertising();
		//  录取logdata 数据
		logdata.promoStatus = 40;
		logdata.giftType = 4;
		logdata.giftDetail = logdata_num || '';
	} else {
		if (data) {
			if (data.desc) {
				if (data.desc.indexOf("http") >= 0 && data.desc.indexOf("http") < 10) {
					window.location.href = data.desc;
					return;
				} else {
					//调用微信卡包
					clearTimeout(_st);
					window.isBusy = false;
					// card数据
					cardList.cardId = getDescQueryString(data.desc, 'cardid');
					cardList.cardCode = data.qr; // 自定义卡券非预导入模式时，配置在营销平台上
					cardList.flag = getDescQueryString(data.desc, 'flag'); // Y:自定义编号卡券 N:非自定义编号卡券
					cardList.sourceid = getDescQueryString(data.desc, 'sourceid'); // 卡券来源：1:CIP 2:商贸、
					if (cardList.flag == 'Y') {
						wxaddCard({
							cardId: cardList.cardId,
							code: cardList.cardCode,
							ready: saveAddCardRecord
						})
					} else {
						wxaddCard({
							cardId: cardList.cardId,
							code: '',
							ready: saveAddCardRecord
						});
					};
					//  录取logdata 数据
					logdata.giftType = _giftType; //奖品类型
					logdata.promoStatus = 30; //单次参与活动的状态
					logdata.cardId = cardList.cardId;
					logdata.cardCode = cardList.cardCode;
				}
			}
		}
	}
	window.parent.promoLog(logdata);
}
// 加载之后立即执行
function box() {
	// 传入参数  userId  promoId  code  giftType
	// 微信卡券 
	var _param = getUrlQueryString("op"),
		_openId = _param ? _param.split(",")[0] : (getUrlQueryString("userid") || getUrlQueryString("userId") || getUrlQueryString("o")),
		promoId = _param ? _param.split(",")[1] : (getUrlQueryString("promoid") || getUrlQueryString("promoId") || getUrlQueryString("p")),
		_promoId = promoId || 15232,
		_type = getUrlQueryString("type"),
		_type = _type ? ((_type != "luck") ? "coupon" : "luck") : "luck",
		airportCode = getUrlQueryString('code') || getUrlQueryString('airportCode') || "PEK",
		_url = String((_type == "luck") ? "http://182.92.31.114/" : "http://101.201.176.54/") + "rest/act/" + _promoId + "/" + String(_openId) + "?" + window.location.href.split("?")[1];

	_giftType = getUrlQueryString("giftType") || 4, //奖品类型
		logdata = { //  录取logdata 数据
			"promoId": _promoId,
			// "promoName": "shopping",
			"promoType": 1,
			"promoStatus": 0,
			"giftType": _giftType,
			"cardId": '',
			"cardCode": '',
			"giftDetail": ''
		},
		// 卡卷保存数据 
		cardList = {
			openId: _openId,
			cardId: "",
			cardCode: "",
			flag: "",
			sourceid: "",
			airportCode: airportCode
		};
	wxInit({
		apiList: 'addCard'
	});
	//没中红包的函数
	function shakePrize() {
		JSONP({
			url: _url,
			success: function (e) {
				showTicket(!Boolean(Number(e.code)), e);
			},
			error: function (e) {
				showTicket(false);
			}
		})
	}
	var shakeEvent = new Shake({
		threshold: 8
	});
	window.isBusy = false;
	shakeEvent.start();
	window.addEventListener('shake', function () {
		// alert('aaa' + isBusy);
		if (isBusy) return;
		window.isBusy = true;
		shakePrize();
	}, false);
}