function setUserId(e){sessionStorage.setItem("userId",e)}function getUserId(){var e=sessionStorage.getItem("userId");return e&&"null"==e?null:e}function setUserType(e){sessionStorage.setItem("userType",e)}function getUserType(){var e=sessionStorage.getItem("userType");return e&&"null"==e?null:e}function setAreaCode(e){sessionStorage.setItem("areaCode",e)}function getAreaCode(){var e=sessionStorage.getItem("areaCode");return e&&"null"==e?null:e}function setPageEntrance(e){sessionStorage.setItem("entrance",e)}function getPageEntrance(){var e=sessionStorage.getItem("entrance");return e&&"null"==e?null:e}function updateCommonParam(){commonParam.userId=getUserId()||getUrlQueryString("userId"),commonParam.userType=getUserType()||getUrlQueryString("userType")||1,commonParam.areaCode=getAreaCode()||getUrlQueryString("areaCode"),commonParam.pageEntrance=getPageEntrance()||getUrlQueryString("entrance")||200}function setSession(){var e=function(e,a){a&&sessionStorage.setItem(e,a)};e("userId",getUrlQueryString("userId")||getUrlQueryString("openId")||getUrlQueryString("openid")),e("userType",getUrlQueryString("userType")),e("areaCode",getUrlQueryString("areaCode")),e("entrance",getUrlQueryString("entrance")),updateCommonParam()}window.currentAirport="CKG",window.localer={},actionUrl="http://weixin.bcia.com.cn/aup/api/log/pageAction",promoUrl="http://weixin.bcia.com.cn/aup/api/log/promoLog",window.pageLoad="pageLoad",window.pageLocation="pageLocation",window.location.origin||(window.location.origin=window.location.protocol+"//"+window.location.hostname+(window.location.port?":"+window.location.port:""));var commonParam={currentAirport:currentAirport,userId:getUserId()||getUrlQueryString("userId"),userType:getUserType()||getUrlQueryString("userType")||1,areaCode:getAreaCode()||getUrlQueryString("areaCode"),buildingId:"",floorNo:"",xCoord:"",yCoord:"",pageEntrance:getPageEntrance()||getUrlQueryString("entrance")||200};function rnd(e,a){return Math.random()*(a-e)+e}function GetQueryString(e,a){e=decodeURIComponent(e);var o=new RegExp("(^|&)"+a+"=([^&]*)(&|$)"),t=e.substr(e.indexOf("?")+1).match(o);return null!=t?unescape(t[2]):null}function getUrlQueryString(e){return GetQueryString(window.location.href,e)}function trim(e){return e.replace(/^\s+|\s+$/g,"")}function parseDom(e){var a=document.createElement("div");return a.innerHTML=e,a.childNodes[0]}function ajaxBase(e,a){var o=null,t=null,n=e.url;a||(ajaxBase.data.loading&&!e.noLoading&&(t=Loading.init(),ajaxBase.loading=t),e.error&&e.errorCode||(o=Dialog.init("alert"),ajaxBase.alert=o));var r=function(e){var a=Array.prototype.slice.call(arguments,1);"function"==typeof e&&e.apply(this,a)},i=function(){if(t){var a=!("hideLoading"in e)||!!e.hideLoading;(ajaxBase.data.hideLoading||a)&&t.hide()}},d="default"==e.contentType?"application/x-www-form-urlencoded":e.contentType,c=JSON.stringify(e.data||{});d&&d.indexOf("application/json")<0&&(c=e.data||{}),$.ajax({type:e.type||"post",dataType:e.dataType||"json",contentType:d||"application/json; charset=utf-8",beforeSend:function(){t&&t.show(),r(e.beforeSend)},cache:"yes"==e.cache,async:"no"!=e.async,data:c,url:e.url}).done(function(a,t,n){"0"==a.code?(r(e.success,a.rst,a.code),i()):"-1"==a.code&&(e.errorCode?(i(),r(e.errorCode,a)):(i(),o&&o.show("请求错误",a.msg)))}).fail(function(a,t,n){r.fail=!0,e.error?r(e.error,n):o&&o.show("请求失败","服务器异常")}).always(function(){r.fail&&t&&t.hide(),r(e.complete)})}function jumpTo(e,a){if(e){getUrlQueryString("v");var o=getUrlQueryString("openid")||getUrlQueryString("openId");if(!o&&commonParam.userId)o=commonParam.userId,e=e+(e.indexOf("?")>-1?"&":"?")+"openid="+o;window.location.href=e}}function backAction(e){var a=document.querySelector(e||".back");if(a){if(a.getAttribute("ignore"))return;var o=a.getAttribute("href"),t=o.indexOf("#")>-1||o.indexOf("history")<0||""==trim(o),n=a.getAttribute("refresh");o&&!t||a.addEventListener("click",function(){n?window.history.go(-1):window.history.back()})}}function homeAction(e){var a=document.querySelector(e||".home");if(a){if(a.getAttribute("ignore"))return;var o=a.getAttribute("href"),t=o.indexOf("#")>-1||o.indexOf("history")<0||""==trim(o);a.getAttribute("refresh");t&&a.addEventListener("click",function(){if(commonParam.userId)window.top.location.href="/standard/entrance/portal.html";else{var e=window.location.origin,a=e.indexOf("traffic")>-1?"http://traffic.rtmap.com/aup/api/wechat/oauth/snsapiBase?redirect_uri=":"http://airtest.rtmap.com/aup/api/wechat/oauth/snsapiBase?redirect_uri=";window.top.location.href=a+e+"/standard/entrance/portal.html"}})}}function runLocationThead(e){WechatLocate.prepare({debug:"false"});var a=setInterval(function(){var o=WechatLocate.locationData();o&&0==o.result.error_code&&(clearInterval(a),commonParam.buildingId=window.localer.buildingId=o.lbsinfo.buildid,commonParam.floorNo=window.localer.floorNo=o.lbsinfo.floor,commonParam.xCoord=window.localer.xCoord=o.lbsinfo.x,commonParam.yCoord=window.localer.yCoord=o.lbsinfo.y,"function"==typeof e&&e())},1e3)}function ajaxActionLog(e,a){var o=(new Date).getTime();e.data.currentAirport=currentAirport,e.data.requestUrl=window.location.href,e.data.requestTime=o,e.data.userId=e.data.userId||commonParam.userId,e.data.userType=e.data.userType||commonParam.userType,e.data.areaCode=e.data.areaCode||commonParam.areaCode,e.data.pageEntrance=e.data.pageEntrance||commonParam.pageEntrance,e.data.action=e.data.action||pageLoad;var t={url:actionUrl,data:e.data,type:e.type,contentType:e.contentType||"application/json; charset=utf-8",success:e.success,error:function(e){console.log("日志服务调用失败!")}};ajaxBase(t,!0),e.stopLocation?(t.data.action=pageLocation,ajaxActionLog.actionLog=function(e){e&&(t.data.buildingId=e.buildingId,t.data.floorNo=e.floorNo,t.data.xCoord=e.xCoord,t.data.yCoord=e.yCoord,ajaxBase(t,!0))}):runLocationThead(function(){e.data.buildingId=localer.buildingId,e.data.floorNo=localer.floorNo,e.data.xCoord=localer.xCoord,e.data.yCoord=localer.yCoord,e.data.action=pageLocation,t.data=e.data,ajaxBase(t,!0),"function"==typeof a&&a()})}function ajaxPromoLog(e){e.data.currentAirport=currentAirport,ajaxBase({url:promoUrl,data:e.data,type:e.type,contentType:e.contentType||"application/json; charset=utf-8",success:e.success,error:function(e){console.log("活动日志服务调用失败!")}},!0)}function docReady(e){var a=function(){"function"==typeof e&&e()};"complete"==document.readyState?a():document.addEventListener("DOMContentLoaded",function(){a()},!1)}ajaxBase.data={loading:!0,hideLoading:!0},ajaxBase.config=function(e){for(var a in e)a in ajaxBase.data&&(ajaxBase.data[a]=e[a])},docReady(function(){homeAction()});var Loading=function(){var e='<div class="loading_toast hidden"><div class="mask_transparent"></div><div class="toast"><div class="loading"><div class="loading_leaf loading_leaf_0"></div><div class="loading_leaf loading_leaf_1"></div><div class="loading_leaf loading_leaf_2"></div><div class="loading_leaf loading_leaf_3"></div><div class="loading_leaf loading_leaf_4"></div><div class="loading_leaf loading_leaf_5"></div><div class="loading_leaf loading_leaf_6"></div><div class="loading_leaf loading_leaf_7"></div><div class="loading_leaf loading_leaf_8"></div><div class="loading_leaf loading_leaf_9"></div><div class="loading_leaf loading_leaf_10"></div><div class="loading_leaf loading_leaf_11"></div></div><p class="toast_content">数据加载中</p></div></div>',a=null,o="数据加载中";return{init:function(){return a||(a=new function(){var a=this;return this.code=null,this.setMsg=function(e){return e&&(o=e),a.code.querySelector(".toast_content").innerText=o,a},this.init=function(){a.code=parseDom(e),document.body.appendChild(a.code)},this.show=function(e){return a.code.classList.remove("hidden"),a.setMsg(e),a},this.hide=function(){return a.code.classList.add("hidden"),a},this.init()})}}}(),Dialog=function(){var e={cancel:[],confirm:[],show:[],shown:[],hide:[],hidden:[]},a=function(e){return parseDom('<div class="'+("alert"==e?"dialog_alert":"dialog_confirm")+' hidden"><div class="mask"></div><div class="dialog"><div class="dialog_hd"><strong class="dialog_title"></strong></div><div class="dialog_bd"></div><div class="dialog_ft">'+("alert"!=e?'<a href="javascript:;" class="btn_dialog default">取消</a>':"")+'<a href="javascript:;" class="btn_dialog primary">确定</a></div></div></div>')},o=function(a){for(var o=e[a],t=0,n=o.length;t<n;t++)o[t].apply(this,[])},t=function(e){document.body.appendChild(e)},n=function(e,a,o){if(e)for(var t=a.split(","),n=0,r=t.length;n<r;n++)e.addEventListener(t[n],o,!0)},r={alert:null,confirm:null};return{init:function(i){if(!i in r)throw"只支持 alert 和 confirm类型";return r[i]?r[i].off():r[i]=new function(r){var i=this;return this.code=null,this.btnClick=function(){var e=i.code.querySelector(".primary"),a=i.code.querySelector(".default");n(e,"click,touchstart",function(e){o("confirm"),i.hide(),e&&e.preventDefault()}),n(e,"touchmove,touchend",function(e){e&&e.stopPropagation()}),n(a,"click,touchstart",function(e){o("cancel"),i.hide(),e&&e.preventDefault()}),n(a,"touchmove,touchend",function(e){e&&e.stopPropagation()})},this.init=function(e){i.code=a(e),t(i.code),i.btnClick()},this.on=function(a,o){return a in e&&e[a].push(o),i},this.off=function(a){return a?(a in e&&(e[a]=[]),i):(e={cancel:[],confirm:[],show:[],shown:[],hide:[],hidden:[]},i)},this.setValue=function(e,a){return this.code.querySelector(".dialog_title").innerText=e||"",this.code.querySelector(".dialog_bd").innerText=a||"",i},this.show=function(e,a){return o("show"),(e||a)&&i.setValue(e,a),i.code.classList.remove("hidden"),o("shown"),i},this.hide=function(){return o("hide"),i.code.classList.add("hidden"),o("hidden"),i},this.init(r)}(i),r[i]}}}();
//# sourceMappingURL=maps/common.js.map