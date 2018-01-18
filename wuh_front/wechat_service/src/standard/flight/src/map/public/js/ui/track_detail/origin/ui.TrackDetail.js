(function () {
    window.createDetailPage = function (point) {
        if ($(".route_detail").length != 0) {

            var openList = $(".route_detail .route_info  .info_list .right .fa-angle-up");
            if (openList.length != 0){
                for (var i=0; i<openList.length; i++){
                    $(openList[i]).removeClass("fa-angle-up");
                    $(openList[i]).addClass("fa-angle-down");
                    $(openList[i]).parents("li").find(".list_steps").css({
                        height:0
                    });
                }
            }

            for (var i = 0; i<arguments.length; i++){
                if (arguments[i].hasOwnProperty("index")){
                    $(".route_detail .route_info div[class='bright_attention']").removeClass("bright_attention").addClass("normal_border");
                    $(".route_detail .route_info div[true_index="+arguments[i].index+"]").parent().prev().find(".right").trigger("click");
                    $(".route_detail .route_info div[true_index="+arguments[i].index+"]").removeClass("normal_border").addClass("bright_attention");
                }else{
                    $(".route_detail .route_info div[index='1']").parent().prev().find(".right").trigger("click");
                }
            }
            $(".route_detail").show().animate({top: "0"}, 300);
        } else {

            /*路径规划页控制start*/
            removeSetStartPage();
            removeDetailPage();
            var endName = $(".set_point").find(".set_end").val().substr(0, $(".set_point").find(".set_end").val().indexOf("---"));
            routePlanningPage("前往" + " " + endName,function(){
                var distanceMeter = parseInt(point.distance / 1000);
                $(".route_planning_title .target_distance").html("共"+distanceMeter+ "米");
                $(".route_planning_title .target_time").html("预计:" + parseInt(distanceMeter / 90) + "分"+ parseInt(distanceMeter % 90)+"秒");
            });
            Rtmap.Scene.setAllowPoiClick(false) ;
            /*end*/

            $(".plant_loading").remove();
            var $route_detail = $("<div class='route_detail'></div>");
            $route_detail.css({
                position: "absolute",
                width: "100%",
                "min-height": "100%",
                height: "100%",
                top: "100%",
                left: "0",
                "z-index": "99999",
                display:"none"
            });
            var $pull_down = $("<div class='$pull_down'><img src='./public/img/info_list_pull_down.png' width='100%' height='100%'/></div>");
            $pull_down.css({
                position: "relative",
                top: "0",
                left: "0",
                width: "100%",
                height: "6%",
                "z-index": "9"
            });

            var start = $(".set_point_page .set_start");
            var $route_start = $("<div class='route_start'>" +
                "<div class='left'><img src='./public/img/info_list_start.png' width='25px' height='25px'/><span>" + start.val().substr(0, start.val().indexOf("-")) + "</span></div>" +
                "</div>"); //"<div class='right'></div> + start.attr("floor") + "
            $route_start.css({
                position: "relative",
                top: "-4%",
                left: "0",
                width: "100%",
                height: "8%",
                background: "white",
                "border-bottom": "1px solid #DBD4D4",
                color: "#918683",
                "line-height": "50px",
                "font-size": "25px"
            });
            $route_start.find(".left").css({
                position: "relative",
//                display: "inline-block",
                width: "50%",
                height: "99%",
            });
            $route_start.find(".left img").css({
                "vertical-align": "middle",
                "margin-left": "8%"
            });
            $route_start.find(".left span").css({
                "vertical-align": "middle",
                "font-size": "15px",
                color:"#918683",
                "margin-left":"3%"
            });
            $route_start.find(".right").css({
                position: "relative",
                display: "inline-block",
                width: "50%",
                height: "99%",
                "text-align": "center",
                "font-size": "15px"
            });
            $route_start.find(".right span").css({
                "vertical-align": "middle"
            });
            var $route_info = $("<div class='route_info'></div>");
            $route_info.css({
                position: "relative",
                top: "-4%",
                width: "100%",
                height: "82%",
                background: "#F2F0F1",
                "overflow-y": "scroll",
                "padding-top": "5px",
                "text-align": "center"

            });

            var end = $(".set_point_page .set_end");
            var $route_end = $("<div class='route_end'><div class='left'><img src='./public/img/info_list_end.png' width='25px' height='25px'/><span>" + end.val().substr(0, end.val().indexOf("-")) + "</span></div>" +
                "</div>");//" <div class='right'><span></span></div>+ end.attr("floor") + "
            $route_end.css({
                position: "relative",
                left: "0",
                top: "-4%",
                width: "100%",
                height: "8%",
                background: "white",
                "border-top": "1px solid #DBD4D4",
                "line-height": "50px",
                "font-size": "25px"
            });
            $route_end.find(".left").css({
                position: "relative",
//                display: "inline-block",
                width: "50%",
                height: "99%"
            });
            $route_end.find(".left img").css({
                "vertical-align": "middle",
                "margin-left": "8%"
            });
            $route_end.find(".left span").css({
                "vertical-align": "middle",
                "font-size": "15px",
                color:"#918683",
                "margin-left": "3%"
            });

            $route_end.find(".right").css({
                position: "relative",
                display: "inline-block",
                width: "50%",
                height: "99%",
                "text-align": "center",
                "font-size": "15px"
            });
            $route_end.find(".right span").css({
                "vertical-align": "middle"
            });
            drawRequest(point);
            /* 处理发送数据 */
            function drawRequest(data) {
                var indexOfImportant = [];
                var poiList = data.pointlist;
                if (data.result.error_code != 0) {
                    alert(data.message);
                    return;
                }
                /* 详细信息 */
                var $ul = $("<ul></ul>");
                $ul.css({
                    "text-align":"left"
                });
                var $li = [];
                for (var i = 0; i < poiList.length; i++) {
                    if (i == 0 || poiList[i].floor.indexOf(poiList[i - 1].floor) == -1) {
                        /* 存储important为true的index */
                        if (poiList[i].important == "true") {
                            indexOfImportant.push(i);
                        }

                        /* 创建一个扶梯提示 */
                        if (i != 0 && (poiList[i - 1].action == "8" || poiList[i - 1].action == "9" || poiList[i - 1].action == "10" || poiList[i - 1].action == "11")) {
                            var $transFor = $("<li><div class='info_list'>" +
                                "<div class='left'>" +
                                "<div class='icon'></div>" +
                                "</div><div class='right'><span class='content'>" + poiList[i].desc + "</span></div></div></li>");
                            $transFor.find(".info_list").css({
                                position: "relative",
                                display: "inline-block",
                                height: "50px"
                            });
                            $transFor.find(".info_list .left").css({
                                position:"relative",
                                top:"1px",
                                right:"-6px",
                                display: "inline-block",
                                width: "50px",
                                height: "100%",
                                "font-size": "30px",
                                "border-radius": "25px",
                                "text-align": "center",
                                color: "#cc7e60"
                            });
                            $transFor.find(".info_list .left .icon").css({
                                width: "35px",
                                height: "35px",
                                "background-image": "url(" + hashDirection[poiList[i - 1].action][0] + ")",
                                "background-size": "100%",
                                "background-repeat": "no-repeat",
                                "margin-top": "7.5px",
                                "margin-left": "7.5px"
                            });
                            $transFor.find(".info_list .right").css({
                                position: "relative",
                                display: "inline-block",
//                                background: "white",
//                                "border-radius": "30px",
                                "background-image": "url(./public/img/elevator_info.png)",
                                "background-size": "100% 100%",
                                height: "70%",
                                "line-height": "210%",
                                width: "180px",
                                top: "-19px",
                                left:"10px",
                                "text-align": "center"
                            });
                            $transFor.find(".info_list .right .content").css({
                                "font-size": "12px",
                                color:"#918683"
                            });
                            $ul.append($transFor);
                        }

                        $li = $("<li><div class='info_list'>" +
                            "<div class='left'>" + poiList[i].floor.toUpperCase() + "</div>" +
                            "<div class='right'><i class='content'>" +  "<span></span></br>" +
                            "<span></span></i><i class='fa fa-angle-down'></i></div></div>" +
                            "<div class='list_steps'>" +
                            "</div></li>");

                        $li.find(".info_list").css({
                            position: "relative",
                            display: "inline-block",
                            height: "50px",
                            width:"100%"
                        });
                        $li.find(".info_list .left").css({
                            position:"relative",
                            top:"-13px",
                            right:"-6px",
                            display: "inline-block",
                            width: "50px",
                            height: "50px",
                            "line-height": "50px",
                            "background-image": "url(./public/img/info_list_left.png)",
                            "background-size": "100%",
                            "font-size": "20px",
                            "text-align": "center",
                            color: "#cc7e60",
                            "vertical-align": "middle"
                        });
                        $li.find(".info_list .right").css({
                            position: "relative",
                            display: "inline-block",
                            "background-image": "url(./public/img/info_list_right.png)",
                            "background-size": "100% 100%",
                            height: "50px",
//                            "line-height": "50px",
                            width: "80%",
                            //top: "-7px",
                            "text-align": "center"
                        });
                        $li.find(".info_list .right i").css({
                            display:"inline-block",
                            "font-style":"normal",
                            color: "#cc7e60",
                            "font-size": "12px",
                            "line-height":"25px"
                        });
                        $li.find(".info_list .right i span").css({
                            color: "#cc7e60"
                        });
                        $li.find(".info_list .fa").css({
                            position: "absolute",
                            right: "10px",
                            top: "12px",
                            "font-size": "25px"
                        });

                        $li.find(".info_list .right").click(function () {
                            if ($(this).find(".fa").attr("class").indexOf("down") != -1) {
                                var stepDom = $(this).parent().next();
                                var height = stepDom.find("div").length * 40 + "px";
                                stepDom.animate({height: height }, 300, function () {
                                    $(this).prev().find(".fa").removeClass("fa-angle-down").addClass("fa-angle-up");
                                });
                            } else {
                                $(this).parent().next().animate({height: 0}, 300, function () {
                                    $(this).prev().find(".fa").removeClass("fa-angle-up").addClass("fa-angle-down");
                                });
                            }
                        });

                    } else if (poiList[i].important == "true") {
                        /* 存储important为true的index */
                        if (poiList[i].important == "true") {
                            indexOfImportant.push(i);
                        }

                        /* 当此poi点为切换楼层最后一点时更改这组step的content */
                        if (!poiList[i + 1] || poiList[i].floor.indexOf(poiList[i + 1].floor) == -1) {
//                            $li.find(".info_list .right .content").html(poiList[i].desc);
                            var $iDom = $li.find(".info_list .right .content span");
                            $iDom[0].innerText = poiList[i].desc.substr(0,poiList[i].desc.indexOf("米")+1);
                            $iDom[1].innerText = poiList[i].desc.substr(poiList[i].desc.indexOf("米")+1);
                        }

                        var distance = Math.round(parseInt(poiList[i].distance) / 1000);
                        $li.find(".list_steps").append("<div class='normal_border' index=" + i + " true_index="+indexOfImportant.indexOf(i)+">" +
                            "<img src='" + window.hashDirection[poiList[i].action][0] + "' width='30px' height='30px'/>" +
                            "<i style=''><span>步行" + distance + "米后</span></br><span>在"+poiList[i].poi_name+"处"+hashDirection[poiList[i].action][1]+"</span></i></div>");

                        $li.find(".list_steps").css({
                            position: "relative",
                            height: 0,
                            overflow: "hidden",
                            color: "#918683",
                            top:"-1px"
                        });

                        $li.find(".list_steps img").css({
                            "margin-left":"15px",
                            "margin-top":"3px"
                        });

                        $li.find(".list_steps i").css({
                            display: "inline-block",
                            "font-size":"12px",
                            "font-style":"normal",
                            color:"#918683",
                            "margin-left":"5px"
                        });
                        $li.find(".list_steps div").css({
                            background: "white",
                            height: "40px",
                            width: "70%",
                            "margin-left": "18%",
                        });
                        $li.find(".list_steps div").unbind("click");
                        $li.find(".list_steps div").click(function () {
                            /* opt_navidetail_line 埋点 */
                            accessLogAppender("opt_navidetail_line",Page.URL.getParameter("key"));

//                            var index = parseInt($(this).attr("index"));
//                            var floor = $(this).parent().prev().find(".left").text();
//                            if (indexOfImportant.indexOf(index) == 0) {
//                                Rtmap.TrackFactory.drawCTrackLine(poiList[0], poiList[index], floor);
//                            } else {
//                                var frontEle = indexOfImportant.indexOf(index);
//                                if($(this).prev().length == 0){
//                                    Rtmap.TrackFactory.drawCTrackLine(poiList[indexOfImportant[frontEle - 1]+1], poiList[index], floor);
//                                } else {
//                                    Rtmap.TrackFactory.drawCTrackLine(poiList[indexOfImportant[frontEle - 1]], poiList[index], floor);
//                                }
//                            }

                            var index = parseInt($(this).attr("true_index"));

                            $route_detail.animate({top: "100%"}, 300, function () {
                                $route_detail.hide();
                                Page.TrackDashboard.render(index);
                            });

                            $route_detail.animate({top: "100%"}, 300, function () {
                                $route_detail.hide();
                            });
                        });
                    }
                    $ul.append($li);
                }

                /* 把最后一条变成到达 */
                var lastStep = $ul.last().find("div").last().find("span")[1];
                $(lastStep).html("到达");

                $route_info.append($ul);
            }

            /* 绑定事件 */
            $pull_down.find("img").click(function () {
                /* opt_navidetail_top 埋点 */
                accessLogAppender("opt_navidetail_top",Page.URL.getParameter("key"));

                $route_detail.animate({top: "100%"}, 300, function () {
                    $route_detail.hide();
                });
            });
            $route_start.click(function (event) {
                event.stopPropagation();
                event.preventDefault();
            });
            /* 插入DOM */
            $("body").append($route_detail);
            $route_detail.append($pull_down);
            $route_detail.append($route_start);
            $route_detail.append($route_info);
            $route_detail.append($route_end);
        }
    };

    window.removeDetailPage = function () {
        $(".route_detail").remove();
    };
})();