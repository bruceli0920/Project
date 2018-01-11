function newDate(data) {
	/*
	 *默认常规活动
	 * 特殊活动的 中秋活动
	 * 默认欢迎页
	 */
	var debugs = getUrlQueryString('debug') || false;
	var type = getUrlQueryString('type') || ''; // type = scan;
	var routine = data.routine + "?type=" + type;
	var theme = data.routine + "?type=" + type;
	var welcome = "welcome/welcome.html?type=" + type;
	! function () {
		var msPerDay = 24 * 60 * 60 * 1000; //时间格式化
		var endDay = data.endDay; //活动结束时间 
		var BirthDay = data.birthDay; //活动开始时间
		var today = new Date(); //当前时间
		var timeold = (BirthDay.getTime() - today.getTime()); //距离活动开始还有多少时间
		var timeold2 = (endDay.getTime() - today.getTime()); //距离活动结束还有多少时间
		var e_daysold = timeold / msPerDay; //距离活动开始还有多少时间
		var e_daysold2 = timeold2 / msPerDay; //距离活动结束还有多少时间
		if (e_daysold2 == 0 || e_daysold2 < 0) {
			// 如果活动结束，跳转到常规页面
			$("#iframe").attr("src", routine);
			return false;
		} else {
			if (e_daysold <= 0 || debugs == "true") {
				// debug 或者 时间在活动内 跳转活动页面
				$("#iframe").attr("src", theme);
				return false;
			} else if (e_daysold > 0 || debugs == false) {
				// 如果活动未开启，或者debug为false
				$("#iframe").attr("src", welcome);
				return false;
			};
		};
	} ();
}