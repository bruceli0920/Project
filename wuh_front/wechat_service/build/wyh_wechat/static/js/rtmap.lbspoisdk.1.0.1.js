!function(){var e={version:"rtmap.lbspoisdk.1.0.1.js",scantype:"default",status:"ready",scanStart:(new Date).getTime(),scanTimeout:3e3,postTimeout:5e3,scanMin:5,scanMax:20,loadStart:(new Date).getTime(),loadTimeout:1e4,rssiMax:0,rssiMin:-100,period:3e3,beacons:[],wxsdk:"http://res.wx.qq.com/open/js/jweixin-1.1.0.js",signurl:"http://weix.rtmap.com/weixinapi/wxb5e69065eb3d67ce/jsapi_sign?url="+encodeURIComponent(window.location.href),pidurl:"http://weix.rtmap.com/mp/wxb5e69065eb3d67ce/token/ticket?ticket=",lbsurl:"http://lbsapi.rtmap.com/rtmap_lbs_api/v1/rtmap/lbs_locateinfo",param:{user_id:"",user_id_desc:"lbs_webmap openid",brand:"",imei:"",key:"0KwOHEy7BQ",latitude:"",longitude:"",apinfo:[],beaconinfo:[],locate_data:{},need_poi:!1,timestamp:""},logs:[],onSign:function(){},onGetOpenid:function(){},onGetLocation:function(){},onScanStart:function(){},onScanSearch:function(){},onScanStop:function(){},beforePost:function(){},onPost:function(){},onOverTime:function(){}};e.log=function(e){var t=new Date,n="["+t.getHours()+":"+t.getMinutes()+":"+t.getSeconds()+"]  ";this.logs.push(n+e)},e.getParam=function(e){var t=new RegExp("(^|&)"+e+"=([^&]*)(&|$)"),n=window.location.search.substr(1).replace(/\?/g,"&").match(t);return null!=n?unescape(n[2]):null},e.load=function(e,t,n){var a=document.createElement("script");a.charset="utf-8","function"==typeof t&&(a.readyState?a.onreadystatechange=function(){"loaded"!==a.readyState&&"complete"!==a.readyState||(a.onreadystatechange=null,"function"==typeof t&&t())}:a.onload=function(){"function"==typeof t&&t()}),a.src=e;var o=document.getElementsByTagName("script")[0];o.parentNode.insertBefore(a,o)},e.post=function(e,t,n,a){var o=function(){var e;if(window.ActiveXObject)try{e=new ActiveXObject("Msxml2.XMLHTTP")}catch(t){try{e=new ActiveXObject("Microsoft.XMLHTTP")}catch(t){e=!1}}else window.XMLHttpRequest&&(e=new XMLHttpRequest);return e}();o.open(a||"POST",e,!0),o.setRequestHeader("Accept","*/*"),o.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8"),o.onreadystatechange=function(){4==o.readyState&&200==o.status&&n(JSON.parse(o.responseText))},o.send(JSON.stringify(t)||null)},e.getOpenid=function(){var e=this,t=e.getParam("openid");t=(t=t||e.getParam("openId"))||(e.getParam("op")?e.getParam("op").split(",")[0]:null);try{t=t||commonParam.userId}catch(e){}if(t)e.param.user_id=t,e.onGetOpenid(e.param.user_id);else{var n=e.getParam("ticket"),a="rtmaplbs_"+(new Date).getTime()+(9999*Math.random()>>0);window[a]=function(t){t.obj&&(e.param.user_id=t.obj.openId,e.onGetOpenid(e.param.user_id))},e.load(e.pidurl+n+"&callback="+a)}},e.getSign=function(){var e=this,t=this.signurl,n="rtmaplbs_"+(new Date).getTime()+(9999*Math.random()>>0);window[n]=function(t){wx.config({beta:!0,debug:!1,appId:t.obj.appid,timestamp:t.obj.timestamp,nonceStr:t.obj.nonceStr,signature:t.obj.signature,jsApiList:["startSearchBeacons","stopSearchBeacons","onSearchBeacons","startMonitoringBeacons","stopMonitoringBeacons","onBeaconsInRange","checkJsApi","onMenuShareTimeline","onMenuShareAppMessage","onMenuShareQQ","onMenuShareWeibo","hideMenuItems","showMenuItems","hideAllNonBaseMenuItem","showAllNonBaseMenuItem","translateVoice","startRecord","stopRecord","onRecordEnd","playVoice","pauseVoice","stopVoice","uploadVoice","downloadVoice","chooseImage","previewImage","uploadImage","downloadImage","getNetworkType","openLocation","getLocation","hideOptionMenu","showOptionMenu","closeWindow","scanQRCode","chooseWXPay","openProductSpecificView","addCard","chooseCard","openCard"]}),wx.ready(function(){e.signTicket=t.obj.jsapi_ticket,e.getBeacons(),e.onSign(t)})},this.load(t+"&callback="+n)},e.getLocation=function(e){var t=this;wx.getLocation({type:"wgs84",success:function(e){t.param.latitude=e.latitude,t.param.longitude=e.longitude,t.onGetLocation(e)}})},e.getBeacons=function(){var e=this;wx.startSearchBeacons({ticket:e.signTicket,complete:function(t){e.status="ready",e.scanStart=(new Date).getTime(),e.onScanStart(e.scanStart),wx.onSearchBeacons({complete:function(t){e.onScanSearch(t,function(t){if(t.beacons){for(var n=0,a=(new Date).getTime(),o=0;o<t.beacons.length;o++){if((n=Number(t.beacons[o].rssi))>-100&&n<0&&(t.beacons[o].add_time=a,e.beacons.push(t.beacons[o]),e.beacons.length>e.scanMax)){e.beacons.shift();break}}"ready"==e.status&&(e.beacons.length>=e.scanMin||(new Date).getTime()-e.scanStart>=e.scanTimeout)?(e.param.beaconinfo=e.beacons,e.postBeacons()):"sending"==e.status&&(new Date).getTime()-e.scanStart>=e.postTimeout&&(e.status="ready"),!e.beacons.length&&(new Date).getTime()-e.loadStart>=e.loadTimeout&&e.onOverTime()}})}})}})},e.filterBeacons=function(){if(this.period===1/0)return!0;if("number"==typeof this.period){var e=(new Date).getTime();this.beacons=$.grep(this.beacons,function(t,n){return e-t.add_time<this.period})}},e.stopBeacons=function(){var e=this;wx.stopSearchBeacons({complete:function(t){e.status="stop",e.onScanStop(t)}})},e.postBeacons=function(){var e=this;e.filterBeacons(),e.status="sending",e.scanStart=(new Date).getTime(),e.param.timestamp=(new Date).getTime(),e.beforePost(e.lbsurl,e.param),e.post(e.lbsurl,e.param,function(t){e.status="ready",e.onPost(t)})},e.getAttrInit=function(){for(var e=["namespace","scanTimeout","loadTimeout","postTimeout","scanMax","scanMin","rssiMax","rssiMin","period"],t={},n=window.document.getElementsByTagName("script"),a=0;a<n.length;a++)for(var o=n[a].attributes,i=0;i<o.length;i++)new RegExp(this.version).test(o[i].nodeValue)&&(t=o);for(var s=0;s<t.length;s++){var c=t[s].nodeName,r=t[s].nodeValue;e.toString().indexOf(c)>=0&&(this[c]=Number(r)==r?Number(r):r)}},e.init=function(){var e=this;e.getAttrInit(),e.getOpenid(),window.wx&&window.wx.startSearchBeacons?e.getSign():e.load(e.wxsdk,function(){e.getSign()})},e.getAttrInit(),e.namespace&&(window[e.namespace]=e)}();
//# sourceMappingURL=maps/rtmap.lbspoisdk.1.0.1.js.map