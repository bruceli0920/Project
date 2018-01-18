
/* 起始点设置页 */
(function () {
    window.searchTimeTmp = {time: "", signal: {}};
    window.createSetStartPage = function (point) {
        if ($(".set_point_page")) {
            $(".set_point_page").remove();
        }

        /* 大div */
        var $setPointPage = $("<div class='set_point_page'/>");
        $setPointPage.css({
            "min-height": "100%",
            height: "auto",
            position: "absolute",
            top: "0",
            left: "0",
            background: "#F2F0F1",
            "z-index": "99999"
        });

        /* title */
        var $title = $("<div class='title'><span class='fa fa-angle-left closeBtn'/><div class='content'>路线规划</div><input type='button' value='搜索'/></div>");
        $title.css({
            width: "100%",
            height: "45px",
            "border-bottom": "solid 1px #B9B9B9",
            "line-height": "45px",
            background: "white"
        });
        $title.find("span").css({
            position: "relative",
            color: "#918683",
            "margin-left": "5%",
            width: "15%",
            height: "100%",
            "font-size": "30px",
            top: "3px"
        });
        $title.find("div").css({
            height: "100%",
            "text-align": "center",
            display: "inline-block",
            width: "60%",
            color: "#918683"
        });
        $title.find("input").css({
            height:"28px",
            color:"white",
            "font-size": "14px",
            background:"#cc7e60",
            width: "50px",
            "text-shadow": "none"
        });


        /* 地点录入 */
        var $setPoint = $("<div class='set_point'><div class='left'><img src='./public/img/start_end_enter_title.png'width='24px' height='48px'/></div>" +
            "<div class='middle'>" +
            "<div><input class='set_start' type='text'/></div>" +
            "<div><input  class='set_end' type='text'/></div>" +
            "</div>" +
            "<div class='right'><img src='./public/img/start_end_change.png'width='35px' height='70px'/></div></div>");
        $setPoint.css({
            width: "100%",
            height: "100px",
            background: "white",
            "box-shadow": "0 3px 4px #bcb2af "
        });

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
                    break;
            }
        }

        $setPoint.find(".set-start").val();

        $setPoint.find(".left").css({
            position: "relative",
            display: "inline-block",
            top: "-1px",
            width: "50px",
            height: "100px",
            "line-height": "100px",
            "text-align": "center"
        });
        $setPoint.find(".middle").css({
            position: "relative",
            display: "inline-block",
            width: "65%",
            height: "100px"
        });
        $setPoint.find("input").css({
            width: "100%",
            border: 0,
            "border-radius": "0",
            "font-size": "15px",
            color: "#918683"
        });
        $($setPoint.find("input")[0]).css({
            "border-bottom": "solid 1px #CEC4C4",
            "padding-bottom": "9px"
        });
        $($setPoint.find("input")[1]).css({
            "padding-top": "9px"
        });

        $setPoint.find(".middle  div").css({
            "margin-left": "5px"
        });
        $setPoint.find(".right").css({
            position: "relative",
            display: "inline-block",
            top: "12px",
            right: "-12px",
            width: "50px",
            height: "100px",
            "line-height": "100px",
            "text-align": "center"
        });

        /* 搜索结果显示 */
        var $results = $("<div class='search_results'><ul class='poi_content'></ul></div>");
        $results.css({
            width: "100%",
            background: "white",
//            "box-shadow": "0 3px 4px 0 " ,
            "margin-top": "1px"
        });
        $results.find("ul").css({
            width: "90%",
            "margin-left": "5%"
        });
        $results.find("li").css({
            "font-size": "15px"
        });

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
//                switch (nowClass){
//                    case "set_start":
//                        if($(this).val() && $(this).val().indexOf(" ") != 0){
//                            if ($(".set_point_page .set_end").val() && $(".set_point_page .set_end").val().indexOf(" ") != 0){
//                                beginSearch();
//                            }else{
//                                alert("终点不能为空");
//                            }
//                        }else{
//                            alert("起点不能为空");
//                        }
//                        break;
//                    case "set_end":
//                        if($(this).val() && $(this).val().indexOf(" ") != 0){
//                            if ($(".set_point_page .set_start").val() && $(".set_point_page .set_start").val().indexOf(" ") != 0){
//                                beginSearch();
//                            }else{
//                                alert("起点不能为空");
//                            }
//                        }else{
//                            alert("终点不能为空");
//                        }
//                        break;
//                }
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
//                                        beginSearch();
                                    });
                                });
                                /* 结果列表动画 */
                                $(".set_point_page .poi_content").animate({height: "100%"}, 1000);
                            } else {
                                $(".set_point_page ." + nowClass + "").val(data.poilist[0].name + "---" + data.poilist[0].floor);
                                $(".set_point_page ." + nowClass + "").attr({"poi_no": data.poilist[0].poi_no, "floor": data.poilist[0].floor, "x": data.poilist[0].x, "y": data.poilist[0].y});
                                /* 有搜索结果允许点击搜索 */
//                                $title.find("input").removeAttr("disabled");
//                                $title.find("input").css({
//                                    color:"white",
//                                    background:"#cc7e60"
//                                });
                            }
                        }else{
                            alert("未能找到相应结果");
                            $(".set_point_page ." + nowClass + "").val("");
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

//                var start_poi_no = $setPoint.find(".set_start").attr("poi_no");
                var start_poi_x = $setPoint.find(".set_start").attr("x");
                var start_poi_y = $setPoint.find(".set_start").attr("y");
                var start_floor = $setPoint.find(".set_start").attr("floor");
//                var end_poi_no = $setPoint.find(".set_end").attr("poi_no");
                var end_poi_x = $setPoint.find(".set_end").attr("x");
                var end_poi_y = $setPoint.find(".set_end").attr("y");
                var end_floor = $setPoint.find(".set_end").attr("floor");
                if (!start_poi_x || !start_poi_y || !start_floor || !end_poi_x || !end_poi_y || !end_floor){
                    alert("请稍等....");
                    return;
                }
                Rtmap.TrackFactory.setStartPoiXY(start_floor, start_poi_x, start_poi_y);
                $("body").append('<div class="plant_loading" style="position:fixed; width:100%; height:100%;background:gray;opacity:0.8;z-index: 999999"><i class="fa fa-spinner fa-spin" style="position: fixed;top: 40%;left: 45%; font-size: 3em;"></i></div>');
                Rtmap.TrackFactory.setEndPoiXY(end_floor, end_poi_x, end_poi_y,__onTrackSuccess);
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
    window.removeSetStartPage = function () {
        var $div = $(".set_point_page");
        $div.animate({width: "0"}, 300, function () {
            $div.hide();
        });
    }
})();
