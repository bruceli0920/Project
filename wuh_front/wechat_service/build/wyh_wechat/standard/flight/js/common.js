function formatTime(e){for(var a=[],r=0;r<e;r++){var t=new Date,c=t.getTime();c+=864e5*r,t.setTime(c);var s=t.getFullYear()+"-"+(t.getMonth()+1)+"-"+t.getDate()+" "+formatWeek(t.getDay());a.push(s)}return a}function formatWeek(e){var a="";switch(e){case 1:a="一";break;case 2:a="二";break;case 3:a="三";break;case 4:a="四";break;case 5:a="五";break;case 6:a="六";break;case 0:a="日"}return"星期"+a}function isEmptyObject(e){var a;for(a in e)return!1;return!0}function search(e,a){var r={};for(var t in a)for(var c=a[t],s=0;s<c.length;s++){var n=c[s];for(var o in n){var i=n[o];if("string"==typeof i&&-1!=i.indexOf(e)){r[t]?r[t].push(n):(r[t]=[],r[t].push(n));break}}}return r}function createHotList(e){for(var a=0;a<e.length;a++){var r,t=e[a];void 0!=t.cityCode?r=t.cityCode:void 0!=t.airlineCode&&(r=t.airlineCode);var c=$('<li class="fl" data-code='+r+">"+t.nameCn+"</li>");"D"==t.domint?c.appendTo($(".cont").eq(0).find(".hot ul")):"I"==t.domint&&c.appendTo($(".cont").eq(1).find(".hot ul"))}}function getStateColor(e){var a="";switch(e){case"计划":a="#2a86c7";break;case"备降":case"取消":case"延误":a="#c73a29";break;case"正在登机":case"到达":case"起飞":case"登机口关闭":case"登机结束":case"正在办票":case"办票截止":case"前方起飞":case"到下站":case"返航":case"滑回":a="#1ec41a";break;case"立即登机":case"登机":case"催促登机":case"过站登机":a="#ff6d0d";break;case"补班延误":a="#b911be";break;case"补班取消":a="#999";break;default:a="#666"}return a}function setSessionValue(e,a){var r,t;r=e,(t=a)&&sessionStorage.setItem(r,t)}
//# sourceMappingURL=maps/common.js.map
