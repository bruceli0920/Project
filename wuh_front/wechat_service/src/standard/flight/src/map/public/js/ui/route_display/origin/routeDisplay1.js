/* 路线规划成功页 */
(function () {
    window.routePlanningPage = function (title_text,callback) {
        /* 搜索栏和切换楼层功能隐藏 */
        $(".rtmap_search_box").hide();
        $(".floor_change_box").addClass("disable_click");
        $(".rtmap_floor_btn").css({ "color": "#8A939C" });
        $(".top_right_bar").hide();

        /* 路线规划成功页title */
        var $createTitle = $("<div class='route_planning_title'>" +
            "<span class='fa fa-angle-left backBtn'/>" +
            "<div><span style='font-size:15px;color:#918683'>" + title_text + "</span></br>" +
            "<span class='target_distance' style='color:#cc7e60;font-size:13px'></span>&nbsp;&nbsp;&nbsp<span class='target_time' style='color:#cc7e60;font-size:13px'></span></div>" +
            "<span class='fa closeBtn'>×</span>" +
            "</div>");
        $createTitle.css({
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "45px",
            "background": "white",
            "z-index": "99999",
            "border-bottom": "solid 1px #B9B9B9"
        });
        $createTitle.find(".backBtn").css({
            position: "absolute",
            top: "6px",
            left: "5%",
            color: "#918683",
            width: "15%",
            height: "100%",
            "font-size": "30px"
        });
        $createTitle.find(".closeBtn").css({
            position: "absolute",
            top: "8px",
            right: "0",
            width: "10%",
            height: "100%",
            "font-size": "25px",
            color: "#918683"
        });
        $createTitle.find("div").css({
            height: "100%",
            width: "70%",
            "text-align": "center",
            "margin-left": "15%",
            display: "inline-block"
        });

        /* 绑定事件 */
        $createTitle.find(".backBtn").click(function () {
            /* opt_navi_back 埋点 */
            accessLogAppender("opt_navi_back",Page.URL.getParameter("key"));

            $(".set_point_page").show().animate({width: "100%"}, 300, function () {
                $createTitle.remove();
                $(".track_dashboard").remove();
                $(".floor_change_box").removeClass("disable_click");
                $(".rtmap_floor_btn").css({ "color": "#0080ff" });
                Rtmap.Scene.setAllowPoiClick(true);
                Rtmap.TrackFactory.clearStartPoi;
                Rtmap.TrackFactory.clearEndPoi
//                $createBottom.remove();
            });
        });
        $createTitle.find(".closeBtn").click(function () {
            /* opt_navi_close 埋点*/
            accessLogAppender("opt_navi_close",Page.URL.getParameter("key"));

            removeSetStartPage();
            $(".rtmap_search_box").show();
            $(".floor_change_box").show();
            $(".route_planning_title").remove();
            $(".route_planning_bottom").remove();
            $(".track_dashboard").remove();
            $(".floor_change_box").removeClass("disable_click");
            $(".rtmap_floor_btn").css({ "color": "#0080ff" });

            /* 清除路线和起始点 */
            Rtmap.TrackFactory.clearPath();
            Rtmap.TrackFactory.clearAll();
            Rtmap.Scene.setAllowPoiClick(true);
            Rtmap.TrackFactory.clearStartPoi;
            Rtmap.TrackFactory.clearEndPoi;
        });

        /* 插入DOM */
        $("body").append($createTitle);
//        $("body").append($createBottom);

        //绘制距离和时间
        callback();
    }
})();