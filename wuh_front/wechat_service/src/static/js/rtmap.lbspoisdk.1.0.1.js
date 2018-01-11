/*
 rtmap.lbspoisdk, a JavaScript library for scan beacon to ask position in indoor maps. http://www.rtmap.com
 (c) 2015-2016, ludeliang[ip007@126.com]
 (v) 1.0.1
*/
(function() {
    var RTB = {
        version: "rtmap.lbspoisdk.1.0.1.js",
        scantype: "default",                // 扫描方式
        status: "ready",                  // 当前状态
        scanStart: (new Date()).getTime(),   // 扫描开始时间
        scanTimeout: 1000 * 3,                   // 扫描超时，默认3秒
        postTimeout: 1000 * 5,                   // 请求定位接口超时
        scanMin: 5,                        // 最少beacon数
        scanMax: 20,                       // 最多beacon数
        loadStart: (new Date()).getTime(),   // 加载开始时间
        loadTimeout: 1000 * 10,                  // 加载超时
        rssiMax: 0,                        // 信号强度范围小于0
        rssiMin: -100,                     // 信号强度范围大于-100
        period: 3000,                 // beacon 有效期
        beacons: [],
        wxsdk: "http://res.wx.qq.com/open/js/jweixin-1.1.0.js",  // 微信接口
        signurl: "http://weix.rtmap.com/weixinapi/wxb5e69065eb3d67ce/jsapi_sign?url=" + encodeURIComponent(window.location.href),    // 微信签名接口
        pidurl: "http://weix.rtmap.com/mp/wxb5e69065eb3d67ce/token/ticket?ticket=",   // 微信ticket换取openid接口
        lbsurl: "http://lbsapi.rtmap.com/rtmap_lbs_api/v1/rtmap/lbs_locateinfo",// lbs定位接口 "http://lbsapitest2.rtmap.com:8080/rtmap_lbs_api/v1/rtmap/lbs_locateinfo"
        param: {                         // 提交给lbs的参数
            "user_id": "",
            // "user_id_desc": window.navigator.userAgent, 
            "user_id_desc": "lbs_webmap openid",
            "brand": "",
            "imei": "",
            "key": "0KwOHEy7BQ",
            "latitude": "",
            "longitude": "",
            "apinfo": [],
            "beaconinfo": [],
            //不需要的时候不写
            "locate_data": {
                /*
                 "gps":{
                 "longitude":"",
                 "latitude":"",
                 "accuracy":""
                 },
                 "pdr":{
                 "move_status":"",
                 "step":""
                 },
                 "compass":{
                 "standard":"",
                 "average":""
                 },
                 "pressure":"",
                 "locate_result":{
                 "timestamp":"",
                 "build_id":"",
                 "floor_id":"",
                 "x_before":"",
                 "y_before":""
                 }
                 */
            },
            "need_poi": false,
            "timestamp": ""
        },
        logs: [],
        onSign: function () { },   // 签名成功回调
        onGetOpenid: function () { },   // 获取openid回调
        onGetLocation: function () { },   // 获取GPS定位信息回调s
        onScanStart: function () { },   // 开始扫描beacon的回调
        onScanSearch: function () { },   // 扫描beacon心跳回调
        onScanStop: function () { },   // 结束扫描beacon时回调
        beforePost: function () { },   // 开始提交beacon信息时回调
        onPost: function () { },    // 提交beacon成功回调
        onOverTime: function () { }    // 扫描超时情况下回调
    };

    RTB.log = function( l ){
        var t = new Date();
        var tt = "[" + t.getHours() + ":" + t.getMinutes() + ":" + t.getSeconds() + "]  ";
        this.logs.push( tt + l);
    };
    /**
     * 
     * 获取链接上参数的值 
     * @param {any} name
     * @returns
     */
    RTB.getParam =function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).replace(/\?/g,"&").match(reg);
        if (r != null){
            return unescape(r[2]);
        }
        return null;
    };
    /**
     * 
     * 1.创建 script标签 引入js
     * 2.在 js 引入成功后执行回调函数
     * 3. 此方法仍可用来进行跨域请求处理的
     * @param {any} src
     * @param {any} callback
     * @param {any} load 未使用
     */
    RTB.load = function(src, callback, load) {
        var sfile = document.createElement("script");
        sfile.charset = "utf-8";
        
        if(typeof callback == "function"){
            if(sfile.readyState){
                sfile.onreadystatechange = function() {
                    if ("loaded" === sfile.readyState || "complete" === sfile.readyState){
                        sfile.onreadystatechange = null;
                        typeof(callback)=="function" && callback();
                    }
                }
            }else{
                sfile.onload = function() {
                    typeof(callback)=="function" && callback();
                } 
            }
        }
        sfile.src = src;
        var snode = document.getElementsByTagName("script")[0];
        snode.parentNode.insertBefore(sfile, snode)
    };
    // post Beacon 信息
    RTB.post = function( url, info, callback, type ){
        // 创建 XMLHttpRequest 对象
        function CreateXMLHttpRequest(){
            var xmlobj;
            if(window.ActiveXObject){
                try{
                    xmlobj = new ActiveXObject("Msxml2.XMLHTTP");
                }catch(e){
                    try{
                        xmlobj = new ActiveXObject("Microsoft.XMLHTTP");
                    }catch(E){
                        xmlobj = false;
                    }
                }
            } else if (window.XMLHttpRequest) {
                xmlobj = new XMLHttpRequest();
            }
            return xmlobj;
        }
        var req = CreateXMLHttpRequest();
        req.open(type||"POST", url, true);  
        req.setRequestHeader("Accept","*/*");
        req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8"); //设置请求头信息  
        // req.onload = callback( req );
        req.onreadystatechange = function(){
            if(req.readyState == 4 && req.status == 200){
                callback( JSON.parse( req.responseText ) );
            }
        }
        req.send( JSON.stringify(info) || null );                                                //设置为发送给服务器数据  
    };
    // 获取 openId 作为 user_id
    RTB.getOpenid = function(){
        var _this = this;
        var openid = _this.getParam("openid");
            openid = openid ? openid : _this.getParam("openId");
            openid = openid ? openid : ( _this.getParam("op") ? _this.getParam("op").split(",")[0] : null );
            try {
                openid = openid ? openid : commonParam.userId;
            } catch (error) {
                
            }
        if( openid ){
            _this.param.user_id = openid;
            _this.onGetOpenid( _this.param.user_id );
        }else{
            var ticket = _this.getParam("ticket");
            var timeKey = 'rtmaplbs_' + (new Date()).getTime() + (Math.random()*9999>>0);
            window[ timeKey ] = function(aData){
                if(aData.obj){
                    _this.param.user_id = aData.obj.openId;
                    _this.onGetOpenid( _this.param.user_id );
                }
            };
            _this.load(_this.pidurl + ticket + '&callback=' + timeKey);
        }
    };
    // 获取签名信息
    RTB.getSign = function(){
        var _this = this;
        var url = this.signurl;
        var timeKey = 'rtmaplbs_' + (new Date()).getTime() + (Math.random()*9999>>0);
        window[ timeKey ] = function(data){
            
            wx.config({
                beta:true,
                debug: false,
                appId:  data.obj.appid,
                timestamp: data.obj.timestamp,
                nonceStr: data.obj.nonceStr,
                signature: data.obj.signature,
                jsApiList: [
                    'startSearchBeacons', 
                    'stopSearchBeacons', 
                    'onSearchBeacons', 
                    'startMonitoringBeacons', 
                    'stopMonitoringBeacons', 
                    'onBeaconsInRange', 

                    'checkJsApi',
                    'onMenuShareTimeline',
                    'onMenuShareAppMessage',
                    'onMenuShareQQ',
                    'onMenuShareWeibo',
                    'hideMenuItems',
                    'showMenuItems',
                    'hideAllNonBaseMenuItem',
                    'showAllNonBaseMenuItem',
                    'translateVoice',
                    'startRecord',
                    'stopRecord',
                    'onRecordEnd',
                    'playVoice',
                    'pauseVoice',
                    'stopVoice',
                    'uploadVoice',
                    'downloadVoice',
                    'chooseImage',
                    'previewImage',
                    'uploadImage',
                    'downloadImage',
                    'getNetworkType',
                    'openLocation',
                    'getLocation',
                    'hideOptionMenu',
                    'showOptionMenu',
                    'closeWindow',
                    'scanQRCode',
                    'chooseWXPay',
                    'openProductSpecificView',
                    'addCard',
                    'chooseCard',
                    'openCard']
            });
            wx.ready(function(){
                // wx.hideOptionMenu();
                _this.signTicket = data.obj.jsapi_ticket;
                // _this.getLocation();    // 获取经纬度
                _this.getBeacons();     // 获取beacons
                _this.onSign( data );
            });
        }
        this.load( url + '&callback=' + timeKey );
    };
    // 获取经纬度信息
    RTB.getLocation = function( ticket ){
        var _this = this;
        wx.getLocation({
            type: 'wgs84',
            success: function (res) {
                _this.param.latitude = res.latitude;
                _this.param.longitude = res.longitude;
                _this.onGetLocation( res );
            }
        });
    };
    // 获取beacon信息
    RTB.getBeacons = function(){
            var _this = this;
            // 开启beacon扫描
            wx.startSearchBeacons({
                ticket : _this.signTicket,
                complete:function(argv){
                    // 监听扫beacon事件
                    _this.status = "ready";
                    _this.scanStart = (new Date()).getTime();
                    _this.onScanStart( _this.scanStart );
                    wx.onSearchBeacons({
                    complete: function (jsonData) {
                        //将原处理变为回调函数执行，可以对微信返回数据做处理，做修改再执行
                        _this.onScanSearch(jsonData, function (argv){ // argv onScanSearch 处理后过滤出来的数据
                            if(argv.beacons){
                                var _rssi = 0, add_time = (new Date()).getTime();
                                for(var i = 0; i < argv.beacons.length; i++){
                                    var _rssi = Number(argv.beacons[i].rssi);
                                    if(_rssi > -100 && _rssi < 0){
                                        argv.beacons[i]["add_time"] = add_time;
                                        _this.beacons.push(argv.beacons[i]);
                                        // 假如beacon数量超出一定范围
                                        if( _this.beacons.length > _this.scanMax ){
                                            _this.beacons.shift();
                                            break;
                                        }
                                    }
                                }
                                // 判断是否满足提交条件
                                if( _this.status=="ready" && 
                                    ((_this.beacons.length >= _this.scanMin) ||
                                    ((new Date()).getTime()-_this.scanStart >= _this.scanTimeout)) ){
                                        _this.param.beaconinfo = _this.beacons;
                                        _this.postBeacons();
                                }else if( _this.status=="sending" && ((new Date()).getTime()-_this.scanStart >= _this.postTimeout) ){
                                    _this.status = "ready";
                                }
                                // 超时扫描不到beacon
                                if(!_this.beacons.length && ((new Date()).getTime()-_this.loadStart >= _this.loadTimeout)){//
                                    _this.onOverTime();
                                }

                            }
                        });
                        }
                    });

                }
            });
            
    };
    // 过滤不在有效期内的 beacons
    RTB.filterBeacons = function(){
        if( this.period === Infinity){
            return true;
        }else if( typeof(this.period)==="number" ){
            var now_time = (new Date()).getTime();
            this.beacons = $.grep(this.beacons, function(n,i){
                return (now_time - n.add_time) < this.period;
            });
        }
    };
    // 停止扫描获取beacons
    RTB.stopBeacons = function(){
        var _this = this;
        wx.stopSearchBeacons({
            complete:function(res){
                _this.status = "stop";
                _this.onScanStop( res );
            }
        });
    };
    // 发送beacon信息
    RTB.postBeacons = function(){
        var _this = this;
        _this.filterBeacons();
        _this.status = "sending";
        _this.scanStart = (new Date()).getTime();
        _this.param.timestamp=(new Date()).getTime();
        _this.beforePost( _this.lbsurl, _this.param );
        _this.post( _this.lbsurl, _this.param, function(aData){
            _this.status = "ready";
            _this.onPost( aData );
            // ...
        });
    };
    /**
     * 获取script上的参数
     */
    RTB.getAttrInit = function(){
        var _this = this; // this = RTB
        var acceptAttr = ["namespace", "scanTimeout", "loadTimeout", "postTimeout", "scanMax", "scanMin", "rssiMax", "rssiMin", "period"];
        var attr = {};
        var js = window.document.getElementsByTagName("script");
        for( var i=0; i<js.length; i++ ){
            var atts = js[i]["attributes"];
            for( var j=0; j<atts.length; j++ ){
                // if( atts[j]["nodeValue"]==_this.version ){
                if( (new RegExp( _this.version )).test( atts[j]["nodeValue"] ) ){
                    attr = atts;
                }
            }
        };
        for( var index=0; index<attr.length; index++ ){
            var key = attr[index]["nodeName"], val = attr[index]["nodeValue"]
            if( acceptAttr.toString().indexOf( key ) >=0 ){
                _this[key] = Number(val)==val ? Number(val) : val; //RTB[namespace....] = '';
            }
        }
    };

    // 初始化
    RTB.init = function(){
        var _this = this;
        _this.getAttrInit();  // 获取参数配置
        _this.getOpenid();    // 获取openId
        // 获取微信签名
        if( window['wx'] && window['wx']['startSearchBeacons'] ){
            _this.getSign();
        }else{ //没有微信依赖 则创建 微信依赖的script标签引入后 再获取签名
            _this.load(_this.wxsdk, function(){ _this.getSign(); });
        }
    }

    RTB.getAttrInit(); // 获取标签上的属性参数 用于将 RTB 暴露出去

    if( RTB["namespace"] ){
        window[ RTB.namespace ] = RTB; 
    }
})(); 