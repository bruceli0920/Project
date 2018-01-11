WechatLocate = (function() {
	//iphone DeviceMotionEvent and  DeviceOrientationEvent
	var iphoneMotionDataArr = [];
	var iphoneOrientationDataArr = [];
	//Android DeviceMotionEvent
	var androidMotionDataArr = [];
	var androidOrientationDataArr = [];
	var _locationData = null; //获取的位置数据

	if (navigator.userAgent.indexOf("iPhone") != -1) {
		if (window.DeviceMotionEvent && window.DeviceOrientationEvent) {
			window.addEventListener("devicemotion", function(eventData) {
				var iphoneData = {};
				var accelerationGravity = eventData.accelerationIncludingGravity;
				var acceleration = eventData.acceleration;
				iphoneData.GravityX = accelerationGravity.x;
				iphoneData.GravityY = accelerationGravity.y;
				iphoneData.GravityZ = accelerationGravity.z;
				iphoneMotionDataArr.timestamp = new Date().getTime();
				iphoneMotionDataArr.push(iphoneData);
				iphoneMotionDataArr.shift();
			}, false);
			window.addEventListener("deviceorientation", function(eventData) {
				var iphoneData = {};
				iphoneData.alpha = eventData.alpha;
				iphoneData.beta = eventData.beta;
				iphoneData.gamma = eventData.gamma;
				//这里的heading是指北针的角度
				iphoneData.heading = eventData.webkitCompassHeading;
				iphoneData.accuracy = eventData.webkitCompassAccuracy;
				iphoneOrientationDataArr.timestamp = new Date().getTime();
				iphoneOrientationDataArr.push(iphoneData);
				iphoneOrientationDataArr.shift();
			}, true);
		} else {
			alert("浏览器不支持");
		}
	} else if (navigator.userAgent.indexOf("Android") != -1) {
		if (window.DeviceMotionEvent && window.DeviceOrientationEvent) {
			window.addEventListener("devicemotion", function(eventData) {
				var androidData = {};
				var accelerationGravity = eventData.accelerationIncludingGravity;
				androidData.GravityX = accelerationGravity.x;
				androidData.GravityY = accelerationGravity.y;
				androidData.GravityZ = accelerationGravity.z;
				androidMotionDataArr.timestamp = new Date().getTime();
				androidMotionDataArr.push(androidData);
				androidMotionDataArr.shift();
			}, false);
			window.addEventListener("deviceorientation", function(eventData) {
				var androidData = {};
				androidData.alpha = eventData.alpha;
				androidData.beta = eventData.beta;
				androidData.gamma = eventData.gamma;
				//这里的heading是指北针的角度
				androidData.heading = eventData.webkitCompassHeading;
				androidData.accuracy = eventData.webkitCompassAccuracy;
				androidOrientationDataArr.timestamp = new Date().getTime();
				androidOrientationDataArr.push(androidData);
				androidOrientationDataArr.shift();
			}, true);
		} else {
			alert("浏览器不支持");
		}
	}

	function _prepare(data) {

		/**
		 * 
		 * 微信onSearchBeacons 监听周围 beacons成功时 实行的回调 
		 * @param {any} data 监听周围beacons获取的 beacons数据
		 * @param {any} callback 传入此方法的回调
		 * @returns
		 */
		window.wechat.onScanSearch = function(data, callback) {
			var filterAndSort = {
				beacons:[] // 存储过滤后的 beacons
			};
			//GPS
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(function(position) {
					if (position) {
						window.wechat.param.locate_data.gps = {
							"longitude": position.coords.longitude,
							"latitude": position.coords.latitude,
							"accuracy": position.coords.accuracy
						}

						//筛选设备然后做数据处理
						if (navigator.userAgent.indexOf("iPhone") != -1) {
							var step = window.countStep(iphoneMotionDataArr);
							var moveStatus = window.moveStatus(iphoneMotionDataArr);
							window.wechat.param.locate_data.pdr = {
								move_status: moveStatus,
								step: (step + moveStatus)
							};
							var standard = window.compassStandard(iphoneOrientationDataArr);
							window.wechat.param.locate_data.compass = {
								"standard": parseInt(standard),
								"average": parseInt(iphoneOrientationDataArr[iphoneOrientationDataArr.length - 1].heading)
							};
							$("#show .step").html("<p>" + "记步：" + (step + moveStatus).toString() + "动静：" + moveStatus.toString() + "</p>");
						} else if (navigator.userAgent.indexOf("Android") != -1) {
							var step = window.countStep(androidMotionDataArr);
							var moveStatus = window.moveStatus(androidMotionDataArr);
							window.wechat.param.locate_data.pdr = {
								move_status: moveStatus,
								step: (step + moveStatus)
							};
							var heading = (360 - parseFloat(androidOrientationDataArr[androidOrientationDataArr.length - 1].alpha))
							var standard = window.compassStandard(androidOrientationDataArr);
							window.wechat.param.locate_data.compass = {
								"standard": parseInt(standard),
								"average": parseInt(heading)
							};
							$("#show .step").html("<p>" + "记步：" + (step + moveStatus).toString() + "动静：" + moveStatus.toString() + "</p>");
						}
					}
					// alert(JSON.stringify(window.wechat.param));
				});
			}

			for (var i = 0; i < data.beacons.length; i++) {
				if (data.beacons[i].rssi != 0) { // rssi 应该是信号强度
					filterAndSort.beacons.push(data.beacons[i]);
				}
			}

			if (filterAndSort.beacons.length == 0) {
				return;
			} else {
				//从大到小排序
				for (var i = 0; i < filterAndSort.beacons.length - 1; i++) {
					for (var j = 0; j < filterAndSort.beacons.length - 1; j++) {
						if (parseInt(filterAndSort.beacons[j].rssi) < parseInt(filterAndSort.beacons[j + 1].rssi)) {
							var tmp = filterAndSort.beacons[j];
							filterAndSort.beacons[j] = filterAndSort.beacons[j + 1];
							filterAndSort.beacons[j + 1] = tmp;
						}
					}
				}
				window.wechat.param.timestamp = new Date().getTime();

				callback(filterAndSort); //过滤出来的数据 传入回调函数中
			}
		};
		/**
		 * 
		 * 请求定位接口成功后调用的函数
		 * @param {any} data 获取的位置数据
		 * @returns
		 */
		window.wechat.onPost = function(data) {
			if (data.timestamp && parseInt(data.timestamp) < parseInt(window.timeTmp)) {
				return;
			}
			window.timeTmp = data.timestamp;
			_locationData = data;
		};
		// 开启签名获取-> 扫描beacon->获取位置处理
		window.wechat.init();
	}

	return {
		prepare: _prepare, // 开启位置获取
		locationData: function(){ // 返回位置数据
			return _locationData;
		}
	};
})();