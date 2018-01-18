/*
 *TrackDashboard UI
 */
(function (_page) {
    var pointList;
    var indexArray = [];
    var currentPointInfo;
    var trackInstructionInfoInit = false;
    var html = '' +
        '<div class="track_dashboard">' +
        '<img class="pull_up_info_list" src="./public/img/info_list_pull_down.png" style="position:relative;bottom:-4px;transform:rotate(180deg); width:100%"/>' +
        '<div style="background: white">' +
        '<li class="numberofinstruction">1/1</li>' +
        '<li class="leftinstruction "><i id = "track_leftarrow" class=" fa fa-angle-left"></i></li>' +
        '<ul class="dashboardList">' +
        '</ul>' +
        '<li class="rightinstruction "><i id = "track_rightarrow" class="fa fa-angle-right"></i></li>' +
        '</div></div>';
    var jqueryDOM = $(html);
    //提前缓存jquery Element
    var track_dashboard = jqueryDOM.find('.track_dashboard')
    var leftinstruction = jqueryDOM.find('.leftinstruction');
    var rightinstruction = jqueryDOM.find('.rightinstruction');
    var dashboardList = jqueryDOM.find('.dashboardList');
    var numberofinstruction = jqueryDOM.find('.numberofinstruction');

    function _createDashboard(distance) {
        var html = '<li class="item">' +
            '<label class="distance"></label>' +
            '<label class="nextBtn"></label>' +
            '</li>';
        var count = 0;
        indexArray = [];
        currentPointInfo = null;
        for (var point in pointList) {
            if (!currentPointInfo) {
                currentPointInfo = pointList[point];
            }
            indexArray.push(point);
        }
        //修改导航信息提示
        if (indexArray.length == 1) {
            $(".numberofinstruction").css("display", "none");
            $(".leftinstruction").css("display", "none");
            $(".rightinstruction").css("display", "none");
        }
        else {
            $(".numberofinstruction").css("display", "inline-block");
            $(".rightinstruction").css("display", "inline-block");
            $(".numberofinstruction").html("1/" + indexArray.length);
            $(".leftinstruction").css("display", "none");
        }
        // 生成详细路由
        for (var j = 0; j < indexArray.length; j++) {
            var i = indexArray[j];
            count++;
            var dom = $(html);
            var floor = pointList[i].next_floor;
            if (count == 1) {
                dom.addClass("top");
                var strHtml = "";
                var distanceMeter = parseInt(distance / 1000);
                if (distanceMeter > 90) {
                    strHtml = "总距离:" + parseInt(distance / 1000) + "米 预计耗时:" + parseInt(distanceMeter / 90) + "分" + parseInt((distanceMeter % 90) * 60 / 100) + "秒";
                }
                else {
                    strHtml = "总距离:" + parseInt(distance / 1000) + "米 预计耗时:" + distanceMeter + "秒";
                }
                /* anjun 16-5-16 */
//                dom.find(".distance").html("").append("总距离:" + parseInt(distance / 1000) + "米");
//                dom.find(".distance").html("").append(strHtml);
                if (pointList[i].endPOI) {
                    dom.find(".distance").css("line-height", "30px");
                }
                else {
                    dom.find(".distance").css("line-height", "60px");
                }
            } else {
                var pf = pointList[i].prev_floor;
                var pb = dom.find(".distance");
                pb.addClass("prevBtn");
                pb.html("").append("返回至" + (pf.toUpperCase()) + "层");
                if (pointList[i].endPOI) {
                    pb.css("line-height", "30px");
                }
                if (pf) {
                    (function () {
                        var f = pf;
                        pb.click(function () {
                            var previouFloor = f;
                            //若楼层中包含小数点
                            if (f.indexOf(".") > 0) {
                                previouFloor = f.replace(".", "_");
                            }
                            jqueryDOM.find(".item").removeClass("top");
                            jqueryDOM.find(".item[floor=" + previouFloor + "]").addClass("top");
                            //若为同一楼层中两段的线之一
                            if (f.indexOf("-") > 0) {
                                Rtmap.Scene.changeFloorTo(f.split("-")[0], f);
                            }
                            else {
                                Rtmap.Scene.changeFloorTo(f, f);
                            }
                        });
                    })();
                }
            }
            ;
            if (pointList[i].endPOI) {
                var poiName = pointList[i].endPOI.name;
                var nextPoi = dom.find(".nextBtn");
                var nextFloorName = floor.indexOf("-") > 0 ? floor.split("-")[0] : floor;
                nextPoi.append("经过" + poiName + "至" + (nextFloorName.toUpperCase()) + "层");
                nextPoi.css("line-height", "30px");
                if (floor) {
                    (function () {
                        var f = floor;
                        nextPoi.click(function () {
                            var toFloor = f;
                            //若楼层中包含小数点0.5层时情况
                            if (f.indexOf(".") > 0) {
                                toFloor = f.replace(".", "_");
                            }
                            jqueryDOM.find(".item").removeClass("top");
                            jqueryDOM.find(".item[floor=" + toFloor + "]").addClass("top");
                            //若为同一楼层中两段的线之一
                            if (f.indexOf("-") > 0) {
                                Rtmap.Scene.changeFloorTo(f.split("-")[0], f);
                            }
                            else {
                                Rtmap.Scene.changeFloorTo(f, f);
                            }
                        });
                    })()
                }
            }
            var floorValue = i;
            //若楼层中包含小数点
            if (floorValue.indexOf(".") > 0) {
                floorValue = floorValue.replace(".", "_");
            }
            dom.attr("floor", floorValue);
            jqueryDOM.find(".dashboardList").append(dom);
        }
        // 初始化内部事件
        if (!trackInstructionInfoInit) {
            Rtmap.Scene.on("changeFloor", function (f, dashBoardMark) {
                if (!dashBoardMark) return;
                //若楼层中包含小数点0.5层时情况
                if (f.indexOf(".") > 0) {
                    f = f.replace(".", "_");
                }
                currentPointInfo = pointList[dashBoardMark];
                //导航面板标记
                var floorMark = f;
                if (dashBoardMark)
                    floorMark = dashBoardMark;
                _setTrackInstructionInfo(floorMark);
                jqueryDOM.find(".item").removeClass("top");
                jqueryDOM.find(".item[floor=" + floorMark + "]").addClass("top");
            });

            $("#track_leftarrow").on("click", function () {
                var previouFloor = currentPointInfo.prev_floor;
                //若楼层中包含小数点
                if (previouFloor.indexOf(".") > 0) {
                    previouFloor = previouFloor.replace(".", "_");
                }
                jqueryDOM.find(".item").removeClass("top");
                jqueryDOM.find(".item[floor=" + previouFloor + "]").addClass("top");
                //若为同一楼层中两段的线之一
                var f = previouFloor;
                if (f.indexOf("-") > 0) {
                    Rtmap.Scene.changeFloorTo(f.split("-")[0], f);
                }
                else {
                    Rtmap.Scene.changeFloorTo(f, f);
                }
            })

            $("#track_rightarrow").on("click", function () {
                var toFloor = currentPointInfo.next_floor;
                //若楼层中包含小数点0.5层时情况
                if (toFloor.indexOf(".") > 0) {
                    toFloor = toFloor.replace(".", "_");
                }
                jqueryDOM.find(".item").removeClass("top");
                jqueryDOM.find(".item[floor=" + toFloor + "]").addClass("top");
                //若为同一楼层中两段的线之一
                var f = toFloor;
                if (toFloor.indexOf("-") > 0) {
                    Rtmap.Scene.changeFloorTo(f.split("-")[0], f);
                }
                else {
                    Rtmap.Scene.changeFloorTo(f, f);
                }
            });

            trackInstructionInfoInit = true;
        }

        /* anjun 16-5-25 */
        $(".pull_up_info_list").unbind("click");
        $(".pull_up_info_list").click(function () {
            var start = Rtmap.TrackFactory.getStartPoi();
            var end = Rtmap.TrackFactory.getEndPoi();
            createDetailPage([
                {floor: start.floor, x: start.x_coord, y: start.y_coord},
                {floor: end.floor, x: end.x_coord, y: end.y_coord}
            ]);
        });
        //_setTrackInstructionInfo(Rtmap.Scene.getNowFloor());
    }

    //设置导航指示信息
    function _setTrackInstructionInfo(floorMark) {
        //获取切换后的楼层在导航信息中的位置
        var currentFloorIndex = -1;
        if (indexArray.length > 1) {
            for (var i = 0; i < indexArray.length; i++) {
                if (indexArray[i] == floorMark) {
                    currentFloorIndex = i + 1;
                }
            }
        }
        //根据当前楼层信息设置导航指示箭头可见性
        if (currentFloorIndex == -1) {
            $(".numberofinstruction").css("display", "none");
            $(".leftinstruction").css("display", "none");
            $(".rightinstruction").css("display", "none");
        }
        else {
            $(".numberofinstruction").css("display", "inline-block");
            if (currentFloorIndex == 1) {
                $(".leftinstruction").css("display", "none");
                $(".rightinstruction").css("display", "inline-block");
            }
            else if (currentFloorIndex == indexArray.length) {
                $(".leftinstruction").css("display", "inline-block");
                $(".rightinstruction").css("display", "none");
            }
            else {
                $(".leftinstruction").css("display", "inline-block");
                $(".rightinstruction").css("display", "inline-block");
            }
            $(".numberofinstruction").html(currentFloorIndex + "/" + indexArray.length);
        }
    }

    //导航路径提示框模块
    _page.TrackDashboard = {
        show: function (_pointList, distance) {
            !window.__count ? window.__count = 0 : window.__count++
            console.log(window.__count)
            Page.controllerHelper.up("TrackDashboard");
            $("body").append(jqueryDOM);
            jqueryDOM.find(".dashboardList").html("");
            pointList = _pointList;
            _createDashboard(distance);
        },
        close: function () {
            jqueryDOM.remove();
        }
    }
})(window.Page);