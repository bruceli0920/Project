function createDetail(t,i){function a(t){var i=t;if("D"==m&&void 0!=i){var a=i[0].buildingId;if(3==i.length)$(".guanzhu").after("<li class='fl guide'>登机引导</li>"),g.find(".guanzhu").addClass("btnstyle"),g.find(".guide").addClass("btnstyle"),g.find(".guide").html("登机引导"),g.find(".guide").on("click",function(){window.location.href="map/index.html?key=k7i23869hd&buildid="+a+"&labelstyle=circle-point"});else if(1==i.length){var e=i.locations[0];localStorage.locations="",localStorage.point=JSON.stringify(e),g.find(".guide").html("登机口位置"),g.find(".guide").on("click",function(){window.location.href="map/index.html?key=k7i23869hd&buildid="+a+"&labelstyle=circle-point&floor="+e.floor+"&center=["+e.xCoord+","+e.yCoord+"]&zoom=19"})}}else g.find(".guide").hide()}var e,l,s,n=t.fltInfo,o=t.subscribeStatus,r=n.identification.split("-"),c=r[2],d=c.substring(0,4)+"-"+c.substring(4,6)+"-"+c.substring(6,8),u={},p={},f=n.identification,m=f.substring(f.length-1);if(console.log(n),s=n.releaseStatus1?n.releaseStatus1:"计划",n.actTime?(u.name="实际起飞",u.value=n.actTime):n.estTime?(u.name="预计起飞",u.value=n.estTime):(u.name="预计起飞",u.value="-"),n.destActTime?(p.name="实际到达",p.value=n.destActTime):n.destEstTime?(p.name="预计到达",p.value=n.destEstTime):(p.name="预计到达",p.value="-"),"arr"==arrdep){e=n.airlineCode,bltDisp=n.bltDisp||"-",bltOt=n.bltOt||"-";var v=[{name:"行李转盘",value:bltDisp},{name:"转盘开放时间",value:bltOt},{name:"出租车等待时长",value:"-"}]}else if("dep"==arrdep){e=n.iata,cntDisp=n.cntDisp||"-",gateDisp=n.gateDisp||"-";try{firstGatOt=n.firstGatOt.slice(11,n.firstGatOt.length).slice(0,5)||"-"}catch(t){firstGatOt="-"}var v=[{name:"登机口开放时间",value:firstGatOt},{name:"登机口",value:gateDisp},{name:"安检排队时长",value:"-"}]}l="Y"==o?"取消关注":"关注航班",console.log(s);var g=$('<div class="top clearfix"><div class="left fl" style="float:none;margin:0 auto;border-right:0;"><div class="date">'+d+'</div><div class="clearfix address"><p class="fl start">'+n.startAirportNameCn+'</p><p class="fl icon"></p><p class="fl dest">'+n.destAirportNameCn+'</p></div></div></div><div class="cont"><div class="title clearfix"><p class="fl icon"></p><p class="fl">'+n.iataCn+e+n.fltNo+'</p></div><div class="time"><ul><li><p>'+u.name+"</p><p>"+u.value+"</p><p>计划："+n.sdtTime+"</p></li><li><p>"+p.name+"</p><p>"+p.value+"</p><p>计划："+n.destSdtTime+'</p></li></ul><p class="status">'+s+'</p></div><div class="tip"><ul><li><p class="value">'+v[0].value+'</p><p class="name">'+v[0].name+'</p></li><li><p class="value">'+v[1].value+'</p><p class="name">'+v[1].name+'</p></li></ul></div></div><div class="bottom"><ul class="clearfix"><li class="guanzhu">'+l+"</li></ul></div>"),h=getStateColor(s);g.find(".status").css({color:h}),g.find(".title .icon").css({background:"url(images/"+e+".gif)",backgroundSize:"contain"}),g.appendTo($(".g-wrap"));var b=n.iata+n.fltNo,S=n.cntTerminalNo;void 0===S&&(S="T2");var y={fltNo:b,cntTerminalNo:S},k={url:"http://airtest.rtmap.com/service-api/flight/getBoardingLead?token="+i,data:y,success:function(t){localStorage.removeItem("locations"),localStorage.locations=JSON.stringify(t);var i="";if(void 0!=t){for(var e=0;e<t.length;e++)i+=JSON.stringify(t[e])+"&";localStorage.removeItem("locations"),localStorage.setItem("locations",i),localStorage.point=""}a(t)}};ajaxBase(k,!1)}var arrdep=getUrlQueryString("arrdep");$(document).ready(function(){var t=getUrlQueryString("fltId"),i=sessionStorage.getItem("token"),a={url:"http://airtest.rtmap.com/service-api/flight/getFltDetial?token="+i,data:{identification:t},success:function(t){console.log(i),createDetail(t,i)}};ajaxBase(a),$(".g-wrap").on("click",".bottom li",function(){if("关注航班"==$(this).html())var a={url:"http://airtest.rtmap.com/service-api/subscribe/followFlight?token="+i,data:{identification:t},success:function(t){location.reload()}};else var a={url:"http://airtest.rtmap.com/service-api/subscribe/unfollowFlight?token="+i,data:{identification:t},success:function(t){location.reload()}};ajaxBase(a)})});
//# sourceMappingURL=maps/detail.js.map
