WechatLocate=function(){var a=[],t=[],e=[],n=[],i=null;return-1!=navigator.userAgent.indexOf("iPhone")?window.DeviceMotionEvent&&window.DeviceOrientationEvent?(window.addEventListener("devicemotion",function(t){var e={},n=t.accelerationIncludingGravity;t.acceleration;e.GravityX=n.x,e.GravityY=n.y,e.GravityZ=n.z,a.timestamp=(new Date).getTime(),a.push(e),a.shift()},!1),window.addEventListener("deviceorientation",function(a){var e={};e.alpha=a.alpha,e.beta=a.beta,e.gamma=a.gamma,e.heading=a.webkitCompassHeading,e.accuracy=a.webkitCompassAccuracy,t.timestamp=(new Date).getTime(),t.push(e),t.shift()},!0)):alert("浏览器不支持"):-1!=navigator.userAgent.indexOf("Android")&&(window.DeviceMotionEvent&&window.DeviceOrientationEvent?(window.addEventListener("devicemotion",function(a){var t={},n=a.accelerationIncludingGravity;t.GravityX=n.x,t.GravityY=n.y,t.GravityZ=n.z,e.timestamp=(new Date).getTime(),e.push(t),e.shift()},!1),window.addEventListener("deviceorientation",function(a){var t={};t.alpha=a.alpha,t.beta=a.beta,t.gamma=a.gamma,t.heading=a.webkitCompassHeading,t.accuracy=a.webkitCompassAccuracy,n.timestamp=(new Date).getTime(),n.push(t),n.shift()},!0)):alert("浏览器不支持")),{prepare:function(o){window.wechat.onScanSearch=function(i,o){var r={beacons:[]};navigator.geolocation&&navigator.geolocation.getCurrentPosition(function(i){if(i)if(window.wechat.param.locate_data.gps={longitude:i.coords.longitude,latitude:i.coords.latitude,accuracy:i.coords.accuracy},-1!=navigator.userAgent.indexOf("iPhone")){var o=window.countStep(a),r=window.moveStatus(a);window.wechat.param.locate_data.pdr={move_status:r,step:o+r};var s=window.compassStandard(t);window.wechat.param.locate_data.compass={standard:parseInt(s),average:parseInt(t[t.length-1].heading)},$("#show .step").html("<p>记步："+(o+r).toString()+"动静："+r.toString()+"</p>")}else if(-1!=navigator.userAgent.indexOf("Android")){o=window.countStep(e),r=window.moveStatus(e),window.wechat.param.locate_data.pdr={move_status:r,step:o+r};var c=360-parseFloat(n[n.length-1].alpha);s=window.compassStandard(n),window.wechat.param.locate_data.compass={standard:parseInt(s),average:parseInt(c)},$("#show .step").html("<p>记步："+(o+r).toString()+"动静："+r.toString()+"</p>")}});for(var s=0;s<i.beacons.length;s++)0!=i.beacons[s].rssi&&r.beacons.push(i.beacons[s]);if(0!=r.beacons.length){for(s=0;s<r.beacons.length-1;s++)for(var c=0;c<r.beacons.length-1;c++)if(parseInt(r.beacons[c].rssi)<parseInt(r.beacons[c+1].rssi)){var d=r.beacons[c];r.beacons[c]=r.beacons[c+1],r.beacons[c+1]=d}window.wechat.param.timestamp=(new Date).getTime(),o(r)}},window.wechat.onPost=function(a){a.timestamp&&parseInt(a.timestamp)<parseInt(window.timeTmp)||(window.timeTmp=a.timestamp,i=a)},window.wechat.init()},locationData:function(){return i}}}();
//# sourceMappingURL=maps/getLocation.js.map