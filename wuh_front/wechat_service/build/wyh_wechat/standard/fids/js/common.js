function formatTime(e){for(var a=[],t=0;t<e;t++){var r=new Date,s=r.getTime();s+=864e5*t,r.setTime(s);var n=r.getFullYear()+"-"+(r.getMonth()+1)+"-"+r.getDate()+" "+formatWeek(r.getDay());a.push(n)}return a}function formatWeek(e){var a="";switch(e){case 1:a="一";break;case 2:a="二";break;case 3:a="三";break;case 4:a="四";break;case 5:a="五";break;case 6:a="六";break;case 0:a="日"}return"星期"+a}function setSessionValue(e,a){var t,r;t=e,(r=a)&&sessionStorage.setItem(t,r)}
//# sourceMappingURL=maps/common.js.map
