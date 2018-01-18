$(function(){var e=sessionStorage.getItem("token");ajaxBase({url:"http://10.10.11.21:8989/api/msg/getAllValidMsg?token="+e,data:{msgModule:"FLIGHT"},success:function(e){console.log(e)}},!1)});
//# sourceMappingURL=maps/message.js.map
