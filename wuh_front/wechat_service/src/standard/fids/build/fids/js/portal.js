function createList(t,e,a){1==a&&$(".cont .list ul").empty();for(var i=0;i<t.length;i++){var o,r,s,n,c,d=t[i],l=[],u=!1;"arr"==e?(o=d.startAirportNameCn,c=d.airlineCode+d.fltNo):"dep"==e&&(o=d.destAirportNameCn,c=d.iata+d.fltNo),r=void 0!=d.sdtTime?d.sdtTime:"-",void 0!=d.actTime?s=d.actTime:void 0!=d.estTime?(s=d.estTime,u=!0):s="-",n=void 0!=d.releaseStatus1?d.releaseStatus1:"计划",void 0!=d.route1AirportNameCn&&l.push(d.route1AirportNameCn),void 0!=d.route2AirportNameCn&&l.push(d.route2AirportNameCn),void 0!=d.route3AirportNameCn&&l.push(d.route3AirportNameCn),void 0!=d.route4AirportNameCn&&l.push(d.route4AirportNameCn),void 0!=d.route5AirportNameCn&&l.push(d.route5AirportNameCn),void 0!=d.route6AirportNameCn&&l.push(d.route6AirportNameCn),0==l.length&&l.push("-"),console.log(d);var m=$("<li data-fltId="+d.identification+"><div>"+c+'</div><div class="place"><p>'+(o||"-")+'</p></div><div class="routeName"><p>'+l.join(", ")+"</p></div><div>"+r+'</div><div class="acttime"><p class="tip">预</p>'+s+'</div><div class="status"><p>'+n+"</p></div></li>");"dep"==e?m.appendTo($(".g-wrap .cont").eq(0).find(".list ul")):"arr"==e&&m.appendTo($(".g-wrap .cont").eq(1).find(".list ul"));var p=getStateColor(d.releaseStatus1);m.find(".status").css({color:p}),u&&m.find(".acttime .tip").show();var h=m.find(".status").outerWidth();m.find(".status p").outerWidth()>h&&m.find(".status").liMarquee({scrollamount:20});var v=m.find(".place").outerWidth();m.find(".place p").outerWidth()>v&&m.find(".place").liMarquee({scrollamount:20});var f=m.find(".routeName").outerWidth();m.find(".routeName p").outerWidth()>f&&m.find(".routeName").liMarquee({scrollamount:20})}var g=$(document).outerHeight();$(".layer").css({height:g})}function getStateColor(t){var e="";switch(t){case"备降":case"取消":case"延误":e="#c73a29";break;case"正在登机":case"到达":case"起飞":case"登机口关闭":case"登机结束":case"正在办票":case"办票截止":case"前方起飞":e="#1ec41a";break;case"立即登机":case"登机":case"催促登机":case"过站登机":e="#ff6d0d";break;case"补班延误":e="#b911be";break;case"补班取消":e="#999";break;case void 0:e="#2a86c7";break;default:e="#666"}return e}$(document).ready(function(){var t=sessionStorage.getItem("token")||getUrlQueryString("token");setSessionValue("token",t);var e=!0,a=!1,i="dep",o={url:"http://airtest.rtmap.com/service-api/flight/selectAllFlight?token="+t,data:{arrOrDep:i,pageNum:1,pageCount:15},success:function(t){console.log(t),t?(e=!0,createList(t.rst,i,o.data.pageNum),(t.lastPage||0==t.rst.length)&&(e=!1,$(".msg").hide(),$(".msg.none").show())):($(".msg").hide(),$(".msg.none").show())}};ajaxBase(o,!1);var r={url:"http://airtest.rtmap.com/service-api/flight/selectFlightByCondition?token="+t,data:{arrOrDep:i,pageNum:1,pageCount:15,status:"",domint:""},success:function(t){t?(a=!0,createList(t.rst,i,r.data.pageNum),(t.lastPage||0==t.rst.length)&&(a=!1,$(".msg").hide(),$(".msg.none").show())):($(".msg").hide(),$(".msg.no-match").show())}};$(".tab li").each(function(t){e=!0,a=!1,$(this).on("click",function(){$(".cont").eq(t).find(".option li").removeClass("active"),$(".cont").eq(t).find(".option").eq(0).find("li").eq(0).addClass("active"),$(".cont").eq(t).find(".option").eq(1).find("li").eq(0).addClass("active"),o.data.pageNum=1,i=$(this).attr("data-arrOrDep"),$(".tab li").removeClass("active"),$(".tab li").eq(t).addClass("active"),$(".cont").removeClass("active"),$(".cont").eq(t).addClass("active"),o.data.arrOrDep=i,ajaxBase(o,!1)})}),$(".btn").on("click",function(){$(".cont .m-filter").hide(),$(".cont.active").find(".m-filter").show(),$(".g-box .cont.active .list .layer").show()}),$(".m-filter .option .item li").on("click",function(){a=!0,e=!1,$(this).parents(".option").find("li").removeClass("active"),$(this).addClass("active");var t=$(".cont.active .m-filter"),i=t.find(".state li.active").attr("data-state"),o=t.find(".domint li.active").attr("data-domint"),s=$(".tab li.active").attr("data-arrOrDep");r.data.arrOrDep=s,r.data.pageNum=1,r.data.status=i,r.data.domint=o}),$(".cont .m-filter .shadow,.cont .m-filter .cancel").on("click",function(){$(".cont .m-filter").hide(),$(".g-box .cont.active .list .layer").hide()}),$(".m-filter .button .on").on("click",function(){$(".cont .m-filter").hide(),$(".g-box .cont.active .list .layer").hide(),ajaxBase(r,!1)}),$(".cont .list").on("click","li",function(){var t=$(".m-header li.active").attr("data-arrordep"),e=$(this).attr("data-fltid");window.location.href="http://airtest.rtmap.com/ckgWechat//standard/official/flight/detail.html?fltId="+e+"&arrdep="+t});var s=$(".g-box");$("g-box .cont.active .list");$(document).scroll(function(){var t=$(document).scrollTop(),i=document.documentElement?document.documentElement.clientHeight:document.body.clientHeight,n=s.outerHeight();$(".tab li");t+i+100>=n&&t>100&&(e?($(".msg").hide(),$(".msg.drop-down").show(),e=!1,o.data.pageNum++,ajaxBase(o,!1)):a&&($(".msg").hide(),$(".msg.drop-down").show(),a=!1,r.data.pageNum++,ajaxBase(r,!1)))})});
//# sourceMappingURL=maps/portal.js.map