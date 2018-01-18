
/* 起始点设置页 */
(function () {
    window.searchTimeTmp = {time: "", signal: {}};
    window.createSetStartPage = function (point) {
        if ($(".set_point_page")) {
            $(".set_point_page").remove();
        }

        /* 大div */
        var $setPointPage = $("<div class='set_point_page'/>");

        /* title */
        var $title = $("<div class='title'><span class='fa fa-angle-left closeBtn'/><div class='content' style='font-weight: bold;'>路线规划</div><input type='button' value='搜索'/></div>");


        /* 地点录入 */
        var $setPoint = $("<div class='set_point'><div class='left'><img src='./public/img/start_end_enter_title.png'width='24px' height='48px'/></div>" +
            "<div class='middle'>" +
            "<div><input class='set_start' type='text'/></div>" +
            "<div><input  class='set_end' type='text'/></div>" +
            "</div>" +
            "<div class='right'><img src='./public/img/start_end_change.png'width='35px' height='70px'/></div></div>");

        /* 如果有point值在此优先赋值给起点终点 */
        if (point && point.hasOwnProperty("type")) {
            switch (point.type) {
                case "start":
                    $setPoint.find(".set_start").val(point.poi_name + " --- " + point.floor.toUpperCase());
                    $setPoint.find(".set_start").attr({
                        floor: point.floor.toUpperCase(),
                        poi_no: point.poi_no,
                        x: point.x,
                        y: point.y
                    });
                    break;
                case "end":
                    $setPoint.find(".set_end").val(point.poi_name + " --- " + point.floor.toUpperCase());
                    $setPoint.find(".set_end").attr({
                        floor: point.floor.toUpperCase(),
                        poi_no: point.poi_no,
                        x: point.x,
                        y: point.y
                    });
                    // 设置我的位置
                    var myLocation = Page.wechat.getLocaler();
                    if (!!myLocation) {
                        $setPoint.find(".set_start").val('我的位置');
                        $setPoint.find(".set_start").attr({
                            floor: myLocation.floor.toUpperCase(),
                            poi_no: '',
                            x: myLocation.x,
                            y: myLocation.y
                        });
                    }

                    break;
            }
        }

        $setPoint.find(".set-start").val();

        $($setPoint.find("input")[0]).css({
            "border-bottom": "solid 1px #CEC4C4",
            "padding-bottom": "9px"
        });
        $($setPoint.find("input")[1]).css({
            "padding-top": "9px"
        });

        /* 搜索结果显示 */
        var $results = $("<div class='search_results'><ul class='poi_content'></ul></div>");

        /* 事件绑定 */
        $title.find("span").click(function () {
            /* opt_navi_setting_close 埋点 */
            accessLogAppender("opt_navi_setting_close",Page.URL.getParameter("key"));

            window.removeSetStartPage();
            $(".rtmap_search_box").show();
            $(".floor_change_box").show();

            /* 清除路线和起始点 */
            Rtmap.TrackFactory.clearPath();
            Rtmap.TrackFactory.clearAll();
        });
        $title.find("input").click(function(){
            if ($setPoint.find(".set_start").val() && $setPoint.find(".set_end").val()){
                beginSearch();
            }else{
                if (!$setPoint.find(".set_start").val()){
                    alert("起点不能为空");
                }else{
                    alert("终点不能为空");
                }
            }
        });
        $setPoint.find(".right").click(function () {
            var start = $setPoint.find(".set_start").val();
            var start_poi = $setPoint.find(".set_start").attr("poi_no");
            var start_floor = $setPoint.find(".set_start").attr("floor");
            var start_x = $setPoint.find(".set_start").attr("x");
            var start_y = $setPoint.find(".set_start").attr("y");
            var end = $setPoint.find(".set_end").val();
            var end_poi = $setPoint.find(".set_end").attr("poi_no");
            var end_floor = $setPoint.find(".set_end").attr("floor");
            var end_x = $setPoint.find(".set_end").attr("x");
            var end_y = $setPoint.find(".set_end").attr("y");
            $setPoint.find(".set_start").val(end);
            $setPoint.find(".set_end").val(start);
            $setPoint.find(".set_start").attr("poi_no", end_poi);
            $setPoint.find(".set_end").attr("poi_no", start_poi);
            $setPoint.find(".set_start").attr("floor", end_floor);
            $setPoint.find(".set_end").attr("floor", start_floor);
            $setPoint.find(".set_start").attr("x", end_x);
            $setPoint.find(".set_end").attr("x", start_x);
            $setPoint.find(".set_start").attr("y", end_y);
            $setPoint.find(".set_end").attr("y", start_y);
        });
        $setPoint.find("input").keyup(function (event) {
            $(this).attr({"x":"","y":"","floor":""});
            /* 当前点击的是起还是终 */
            var nowClass = $(this).attr("class");

            /* 判断是不是回车事件 */
            if (event.keyCode == 13) {
                return;
            }

            if (!$(this).val() || $(this).val().indexOf(" ") == 0){
                $results.find(".poi_content").html("");
                return;
            } else {
                if (window.searchTimeTmp.time) {
                    var nowTime = new Date().getTime();
                    if ((nowTime - window.searchTimeTmp.time) < 1000) {
                        clearTimeout(window.searchTimeTmp.signal);
                    }
                }
                window.searchTimeTmp.time = new Date().getTime();
                /* 请求的参数 */
                var key = Page.URL.getParameter("key");
                var buildId = Page.URL.getParameter("buildid");
                var $val = $(this).val();
                /* 结果部分初期化 */
                $(".set_point_page .poi_content").html("").css({height: "0"});
                window.searchTimeTmp.signal = setTimeout(function () {
                    $.post("http://lbsapi.rtmap.com/rtmap_lbs_api/v1/rtmap/associationsearch", JSON.stringify({key: key, keywords: $val, buildid: buildId}), function (data) {
                        /* navi_search 埋点 */
                        accessLogAppender("navi_search",Page.URL.getParameter("key"));

                        if (data.result["error_code"] == "0" && data.hasOwnProperty("poilist")) {
                            if (data.poilist.length != "1") {
                                $(data.poilist).each(function () {
                                    var $li = $("<li/>");
                                    $li.css({
                                        "text-align": "left",
                                        "font-size": "15px",
                                        "border-bottom": "1px solid #cec4c4",
                                        padding: "8px"
                                    });
                                    /* 搜索的字高亮 */
//                                    var name = this.name.toLowerCase().replace($val.toLowerCase(), "<span style='color:red'>" + $val.toLowerCase() + "</span> ")
                                    $li.append("<span class='poi_name' " +
                                        "poi_no='" + this.poi_no + "' style='color:#B9B9B9'>" + this.name + "</span>&nbsp;<span class='poi_floor' x='" + this.x +
                                        "' y='" + this.y + "' style='color:#B9B9B9'>" + this.floor + "</span>");
                                    $(".set_point_page .poi_content").append($li);
                                    /* 绑定每个条目click事件 */
                                    $li.click(function () {
                                        $(".set_point_page ." + nowClass + "").val($(this).find(".poi_name").text() + " --- " + $(this).find(".poi_floor").text());
                                        $(".set_point_page ." + nowClass + "").attr({
                                            "poi_no": $(this).find(".poi_name").attr("poi_no"),
                                            "floor": $(this).find(".poi_floor").text(),
                                            "x": $(this).find(".poi_floor").attr("x"),
                                            "y": $(this).find(".poi_floor").attr("y")
                                        });
                                        $(".set_point_page .poi_content").html("").css({height: "0"});
                                    });
                                });
                                /* 结果列表动画 */
                                $(".set_point_page .poi_content").animate({height: "100%"}, 1000);
                            } else {
                                $(".set_point_page ." + nowClass + "").val(data.poilist[0].name + "---" + data.poilist[0].floor);
                                $(".set_point_page ." + nowClass + "").attr({"poi_no": data.poilist[0].poi_no, "floor": data.poilist[0].floor, "x": data.poilist[0].x, "y": data.poilist[0].y});
                            }
                        }else{
                            var strVar="";
                            strVar += "<li style=\"text-align: left; font-size: 15px; border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: rgb(206, 196, 196); padding: 8px; background-color: white \"><span>未能找到相应结果<\/span><\/li>";
                            $results.find('ul').append(strVar);
//                            $(".set_point_page ." + nowClass + "").val("");
                        }
                    });
                }, 500);
            }
        });

        /* 搜索方法 */
        function beginSearch() {
            if ($setPoint.find(".set_start").val() && $setPoint.find(".set_end").val()) {
                $(".route_detail").remove();
                /* navi_req 埋点 */
                accessLogAppender("navi_req",Page.URL.getParameter("key"));

                var start_poi_x = $setPoint.find(".set_start").attr("x");
                var start_poi_y = $setPoint.find(".set_start").attr("y");
                var start_floor = $setPoint.find(".set_start").attr("floor");
                var end_poi_x = $setPoint.find(".set_end").attr("x");
                var end_poi_y = $setPoint.find(".set_end").attr("y");
                var end_floor = $setPoint.find(".set_end").attr("floor");
                if (!start_poi_x || !start_poi_y || !start_floor){
                    alert("请输入正确的起点信息");
                    return;
                }
                if (!end_poi_x || !end_poi_y || !end_floor){
                    alert("请输入正确的终点信息");
                    return;
                }
                try {
                    window.Page.loading.show();
                    Rtmap.TrackFactory.setStartPoiXY(start_floor, start_poi_x, start_poi_y);
                    Rtmap.TrackFactory.setEndPoiXY(end_floor, end_poi_x, end_poi_y,__onTrack);
                } catch (e) {}

            }
        }

        /* 插入dom */
        $("body").append($setPointPage);

        $setPointPage.animate({width: "100%"}, 300, function () {
            $($setPointPage).append($title);
            $($setPointPage).append($setPoint);
            $($setPointPage).append($results);
        });
    };

    window.__onTrack = function (res) {
        window.Page.loading.hide();
        if(res.hasOwnProperty("statusText") || res.result.error_code != "0"){
            /* 路径规划失败 埋点 */
            accessLogAppender("navi_fail",Page.URL.getParameter("key"));
            alert("路径规划失败");
            return false
        }
        /* 路径规划成功 埋点 */
        accessLogAppender("navi_success",Page.URL.getParameter("key"));

        window.__onTrackSuccess(res);
    }

    window.removeSetStartPage = function () {
        var $div = $(".set_point_page");
        $div.animate({width: "0"}, 300, function () {
            $div.hide();
        });
    }
})();