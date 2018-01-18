var Page = window.Page || {};
var openId = null;
var debugTools = false;
var locationModel = "follow";//定位模式 -free or -follow
var userProfileImageUrl = null;//用户头像图片Url地址
var userNickName = null;//用户昵称

//获取颜色配置方案并配置
function getColorConfig(handler) {
    var requestData = { key: Page.URL.getParameter("key") };
    $.ajax({
        type: "POST",
        //url:"http://123.57.74.38:8080/rtmap_lbs_api/v1/rtmap/map_color",
        url: "http://lbsapi.rtmap.com/rtmap_lbs_api/v1/rtmap/map_color",
        data: JSON.stringify(requestData)
    }).done(function (data) {
    if (data.result.error_code) {
        if (data.map_color && data.map_color.colorData) {
            for (var i in data.map_color.colorData) {
                var obj = data.map_color.colorData[i];
                Rtmap.Style.setPoiDefaultStyle(obj.type, obj);
            }
            Rtmap.Style.setImageConfig(data.map_color.imageData); //设置全局图片属性
            Rtmap.Style.setGlobalConfig(data.map_color.globalData); //设置全局属性
            var canvasColor = Rtmap.Style.getGlobalConfig("canvas_color");
            $(".canvas").css({ background: canvasColor });
        } else {
            var gloablData = RTMAP_MAP_COLOR_CONFIG_ZHIHUITU.globalData; //默认智慧图的全局配置
            var imageData = RTMAP_MAP_COLOR_CONFIG_ZHIHUITU.imageData; //默认智慧图的图片地址配置
            var colorData = RTMAP_MAP_COLOR_CONFIG_ZHIHUITU.colorData; //默认颜色配置
            for (i in colorData) {
                var obj = colorData[i];
                Rtmap.Style.setPoiDefaultStyle(obj.type, obj);
            }
            Rtmap.Style.setImageConfig(imageData);
            Rtmap.Style.setGlobalConfig(gloablData);
            var canvasColor = Rtmap.Style.getGlobalConfig("canvas_color");
            $(".canvas").css({ background: canvasColor });
        }
    }
    handler();
});
};

//初始化本地颜色方案
function initializeLocalColorConfig() {
  var gloablData = RTMAP_MAP_COLOR_CONFIG_ZHIHUITU.globalData; //默认智慧图的全局配置
  var imageData = RTMAP_MAP_COLOR_CONFIG_ZHIHUITU.imageData; //默认智慧图的图片地址配置
  var colorData = RTMAP_MAP_COLOR_CONFIG_ZHIHUITU.colorData; //默认颜色配置
  for (i in colorData) {
    var obj = colorData[i];
    Rtmap.Style.setPoiDefaultStyle(obj.type, obj);
  }
  Rtmap.Style.setImageConfig(imageData);
  Rtmap.Style.setGlobalConfig(gloablData);
  var canvasColor = Rtmap.Style.getGlobalConfig("canvas_color");
  $(".canvas").css({background: canvasColor});
};

/*
 *JS执行入口
 */
$(document).ready(function () {
    openId = Page.URL.getParameter("openid");
    debugTools = Page.URL.getParameter("debug");
    //获取建筑物偏转角
    window.initBuildAngle();
    initializeLocalColorConfig();
    //getColorConfig(function () {
    Rtmap.Scene.initMapContext({ parentDOM: 'canvas' });
    Rtmap.Control.showZoom();//显示Zoom 控件
    Rtmap.Control.showScale(); //显示比例尺
    Rtmap.Control.showLocal(function () {
        /* 点击定位按钮 埋点 */
        accessLogAppender("opt_navi_button_click", Page.URL.getParameter("key"));

        var local = Page.Local.getLocaler();
        if (local) {
            if (Rtmap.Scene.getNowFloor().toUpperCase() != local.floor.toUpperCase()) {
                Rtmap.Scene.changeFloorTo(local.floor);
            }
            ;
            Rtmap.Scene.moveTo(local);
        } else {
            local = Page.wechat.getLocaler();
            if (local) {
                if (Rtmap.Scene.getNowFloor().toUpperCase() != local.floor.toUpperCase()) {
                    Rtmap.Scene.changeFloorTo(local.floor);
                }
                ;
                Rtmap.Scene.moveTo(local);
                locationModel = "follow";//切换为跟随模式
                Rtmap.Control.enableLocal();//默认置灰
            }
            else {
                //Rtmap.Scene.moveToCenter();
            }
        }
        ;
    }); //显示居中按钮
    Rtmap.Control.disableLocal();//默认置灰
    Page.SearchControl = Rtmap.Control.showSearch(); //显示搜索栏
    Page.FloorBtn = Rtmap.Control.showFloorChange(); //显示楼层切换按钮
    var buildId = Page.URL.getParameter("buildid");
    var floor = Page.URL.getParameter("floor");
    if (floor) {
        //针对凯德修改
        if (floor.toUpperCase() == "B2M") {
            floor = "b1.5";
        }
    }
    var key = Page.URL.getParameter("key");
    var token = Page.URL.getParameter("token");
    if (!(key || token)) {
        alert("Need Key or Token");
        return;
    }
    //是否为捕获模式(在中心打点)
    var capturemode = Page.URL.getParameter("capturemode");
    Page.capturemode = capturemode;

    var labelStyle = Page.URL.getParameter("labelstyle");
    //地图初始化默认配置
    Rtmap.Config.setup({
        buildId: buildId,
        defaultFloor: floor || "f1",
        Key: key,
        Token: token,
        showLabelByStar: true,
        PoiStart: {
            "志愿者服务台": 9,
        },
        labelStyle: labelStyle
    });

    //绑定全局事件
    Page.Controller.bindGlobalEvent();
    //初始化地图
    Page.Controller.initMap();

    //若传入openid，则进行实时定位
    if (openId) {
        Page.wechat.locateAlert();
        if (debugTools) {
            Rtmap.WechatLocate.prepare({ debug: "true" });
        }
        else {
            Rtmap.WechatLocate.prepare({ debug: "false" });
        }
        userProfileImageUrl = Page.URL.getParameter("headimgurl");
        userNickName = Page.URL.getParameter("nickname");
    }
});

/*
 *Tip UI Control
 */
(function (_page) {
  var Users = {};
  //控制插件用来提起最下方控制栏，以显示Tip框
  _page.controllerHelper = {
    up: function (user) {
      Users[user] = true;
      $(".rtmap_zoom_box").addClass("moveUp");
      $(".rtmap_scale_box").addClass("moveUp");
    },
    down: function (user) {
      delete Users[user];
      var haveUser = false;
      for (var i in Users) {
        haveUser = true;
      }
      if (!haveUser) {
        $(".rtmap_zoom_box").removeClass("moveUp");
        $(".rtmap_scale_box").removeClass("moveUp");
      }
    }
  }
})(window.Page);

/*
 * Global Event
 */
(function (_page) {
  function _bindGlobalEvent() {

    var firstLoad = true;

    Rtmap.DataProvider.getBuildInfo({}, function (err, data) {
      Rtmap.Config.setFloorData(data.floorinfo);
      var floorName = Rtmap.Scene.getNowFloor();
      var floorAliasName = Rtmap.Config.getFloorAliasName(floorName);
      $(".rtmap_floor_btn").text(floorAliasName);
      Page.FloorBtn.setData(data.floorinfo);
      var d = $("<div/>", {
        text: data.name_chn,
        class: "build_name"
      });

      $(".searchInput").attr("placeholder", "搜索店铺   @" + data.name_chn);
      $("title[class=bdn]").html(data.name_chn);
    });
    Rtmap.Scene.on("mapClick", function (obj) {
      Page.Tip.close();
    });

    Rtmap.Scene.on("BKClick", function (obj) {
      return;
    });

    //显示路径中的点和导航路径
    function drawPoints() {
      //point 参数 point=x,y
      var pointStr = Page.URL.getParameter("point");
      if (pointStr) {
        var coords = pointStr.split(",");
        Rtmap.Scene.createMarker({x: parseFloat(coords[0]), y: parseFloat(coords[1])});
      }
      //points参数带[]
      var pointsStr = Page.URL.getParameter("points");
      if (pointsStr) {
        var pointAry = JSON.parse(pointsStr);
        for (var i = 0; i < pointAry.length; i++) {
          Rtmap.Scene.createMarker({x: pointAry[i][0], y: pointAry[i][1]});
        }
      }
      try {
        var route = Page.URL.getParameter("route");
        var routeAry = JSON.parse(route);
        if (routeAry && routeAry.length > 1) {
          var routePoint = [];
          for (var i = 0; i < routeAry.length; i++) {
            var Point = routeAry[i];
            if (i > 0 && i != routeAry.length - 1) {
              var point = {
                x: Point[0],
                y: Point[1],
                floor: Point[2]
              };
              routePoint.push(point);
            } else if (i == 0) {
              var startPoi = {
                x: Point[0],
                y: Point[1],
                floor: Point[2]
              };
              Rtmap.Scene.changeFloorTo(Point[2]);
            } else if (i > 0 && i == routeAry.length - 1) {
              var endPoi = {
                x: Point[0],
                y: Point[1],
                floor: Point[2]
              };
            }
            startPoi ? Rtmap.TrackFactory.setStartPoi(startPoi) : "";
            routePoint.length > 0 ? Rtmap.TrackFactory.setRoutePoints(routePoint) : "";
            endPoi ? Rtmap.TrackFactory.setEndPoiXY(endPoi.floor, endPoi.x, endPoi.y, function (res) {
                //若存在定位点
                Page.Tip.set("all");
                window.__onTrackSuccess(res);
                //通过传参执行的路径规划,不显示返回框
                $(".backBtn").hide();
            }) : "";
          }
        } else if (routeAry && routeAry.length == 1) {
            var Point = routeAry[0];
            var startPoi = {
                x: Point[0],
                y: Point[1],
                floor: Point[2]
            };
          //只传入终点,并且openId存在
            if (openId) {
                Rtmap.TrackFactory.setEndPoi(startPoi, "car");
            }
            else {
                window.setTimeout(
                    function () {
                        Rtmap.TrackFactory.setEndPoi(startPoi);
                        //设置导航页信息
                        if (window.Page.RoutePlan) {
                            window.Page.RoutePlan.show({
                                x: startPoi.x,
                                y: startPoi.y,
                                floor: startPoi.floor,
                                poi_no: -1,
                                name: "传入终点",
                                type: "end"
                            });
                        }
                        window.Page.RoutePlan.pickupStart();
                    }, 300);
            }
        }
      } catch (e) {
        console.log(e);
      }
      //支持endpoint_name参数，传入终点名称导航
      try {
        var pointNameStr = Page.URL.getParameter("endpoint_name");
        if (pointNameStr) {
          var floor = Rtmap.Config.getOption().defaultFloor.toUpperCase();
          var poilayer = Rtmap.Scene.getPoiByName(floor, pointNameStr);
          //设置终点
          if (poilayer) {
              window.setTimeout(function () {
                  Rtmap.TrackFactory.setEndPoi(poilayer);
                  //设置导航页信息
                  if (window.Page.RoutePlan) {
                      if (poilayer.feature) {
                          window.Page.RoutePlan.show({
                              x: poilayer.feature.properties.x_coord,
                              y: poilayer.feature.properties.y_coord,
                              floor: Rtmap.Scene.getNowFloor().toLowerCase(),
                              poi_no: poilayer.feature.properties.poi_no,
                              name: poilayer.feature.properties.name_chinese,
                              type: "end"
                          });
                      }
                      else {
                          window.Page.RoutePlan.show({
                              x: poilayer.x,
                              y: poilayer.y,
                              floor: poilayer.floor.toLowerCase(),
                              poi_no: poilayer.poi_no,
                              name: poilayer.name,
                              type: "end"
                          });
                      }
                  }
                  window.Page.RoutePlan.pickupStart();
              }, 300);
          }
        }
      }
      catch (e) {
        console.log(e);
      }
    }

    //根据poino选中要素
    function selectPoiByNo(poiNo) {
      var floor = Rtmap.Config.getOption().defaultFloor.toUpperCase();
      var poiLayer = Rtmap.Scene.getPoiByNum(floor, poiNo);
      if (poiLayer) {
        var name = poiLayer.feature.properties.name_chinese;
        Page.Tip.show({
          layer: poiLayer,
          poiName: name,
          parentDOM: $("#infoBox"),
          start: function () {
            Rtmap.TrackFactory.setStartPoi(poiLayer);
          },
          end: function () {
            Rtmap.TrackFactory.setEndPoi(poiLayer);
          }
        });
      }
    }

    var crossFloorSearchAction = null;
    Rtmap.Scene.on("drawedMap", function () {
      var zoom = null;
      var center = null;
      if (firstLoad) {
        zoom = Page.URL.getParameter("zoom");
        try {
          center = JSON.parse(Page.URL.getParameter("center"));
        } catch (e) {

        }
        poiNo = Page.URL.getParameter("poino");
        if (poiNo) {
          selectPoiByNo(parseInt(poiNo));
        }
        firstLoad = false;
        drawPoints();
        if (center) {
          setTimeout(function () {
            Rtmap.Scene.moveTo({
              x: center[0],
              y: center[1]
            }, zoom);
          });
        } else {
          //此处不再设置范围，改为在加载完BK层后设置范围
          //Rtmap.Scene.fitBounds();
        }
        //不带中括号方式
        var centerPoint = Page.URL.getParameter("centerpoint");
        if (centerPoint) {
          var coords = centerPoint.split(",");
          setTimeout(function () {
            Rtmap.Scene.moveTo({
              x: parseFloat(coords[0]),
              y: parseFloat(coords[1])
            }, zoom);
          });
        }

        Rtmap.Location.on("haveLocation", function (locationData) {
          Page.Local.update(locationData.x, locationData.y, locationData.floor.toLowerCase());
        });
      }
      crossFloorSearchAction ? crossFloorSearchAction() : "";
      crossFloorSearchAction = null;
      //绘制完地图后再弹出提示
      if (Page.SearchControl.isChangeToNearFloor) {
          Page.Controller.DialogLabel.show("当前楼层无该设施，已为您跳转至" + Page.SearchControl.changeToFloor + "层。", 2000);
          Page.SearchControl.isChangeToNearFloor = false;
      };
      var floorName = Rtmap.Scene.getNowFloor();
      var floorDesc = Rtmap.Config.getFloorDesc(floorName);
      if (floorDesc.indexOf("停车场") > -1) {
          Rtmap.Parking.startMonitor();
      }
      else {
          Rtmap.Parking.stopMonitor();
      }
    });

    Rtmap.Scene.on("mapDrag", function (obj) {
      Page.Local.changeModel("free");
      locationModel = "free";
      Rtmap.Control.disableLocal();//默认置灰
    });

    var changeToNearFloor = false;
    //因为没有本层结果，触发跳转到最近结果的事件
    Page.SearchControl.on("changeToNearFloor", function (floor) {
      //Page.Controller.DialogLabel.show("当前楼层无该设施，为您跳转至"+floor.toUpperCase()+"层。",2000);
      changeToNearFloor = true;
      //绘制完地图后再弹出提示
      Page.SearchControl.changeToFloor = floor.toUpperCase();
      Page.SearchControl.isChangeToNearFloor = true;
    });

    //触发标记搜索结果到地图上的事件
    Page.SearchControl.on("markerSearchToMap", function (poiDatas, markers) {
      Page.ClearBtn.show("Search");

      function clearSearchResultEvent() {
        Page.SearchControl.clearSearchResult();
      };
      //移除事件
      Page.ClearBtn.removeEvent(
        clearSearchResultEvent
      );
      //添加事件
      Page.ClearBtn.addEvent(
        clearSearchResultEvent
      );

      for (var i = 0; i < markers.length; i++) {
        (function () {
          var data = poiDatas[i];
          markers[i].on("click", function () {
            bindEvent(data);
          });
        })();
      }
      if (changeToNearFloor) {
        crossFloorSearchAction = function () {
          bindEvent(poiDatas[0]);
        }
      } else {
        bindEvent(poiDatas[0]);
      }
      ;
      changeToNearFloor = false;//重置状态
      var deleteM;

      function removeSelectedMarkers() {
        deleteM ? Rtmap.Scene.addLayer(deleteM) : "";
        for (var i = 0; i < markers.length; i++) {
          if (markers[i].selected) {
            deleteM = markers[i];
            Rtmap.Scene.removeLayer(markers[i]);
            break;
          }
        }
      };
      function bindEvent(data) {
        Page.Tip.show({
          layer: Rtmap.Scene.getPoiByNum(data.floor, data.poi_no),
          poiName: data.name,
          parentDOM: $("#infoBox"),
          start: function () {
            //根据 poi Num 获取POI层
            var layer = Rtmap.Scene.getPoiByNum(data.floor, data.poi_no);
            removeSelectedMarkers();
            Rtmap.TrackFactory.setStartPoi(layer);
          },
          end: function () {
            //根据 poi Num 获取POI层
            var layer = Rtmap.Scene.getPoiByNum(data.floor, data.poi_no);
            removeSelectedMarkers();
            Rtmap.TrackFactory.setEndPoi(layer);
          },
          data: data
        });
      }

      Page.ClearBtn.addEvent(function () {
        Page.Tip.close();
      });

      if (Rtmap.TrackFactory.getTrackStatus()) {
        Rtmap.TrackFactory.clearPath();
        Page.controllerHelper.down("TrackDashboard");
        Page.TrackDashboard.close();
      }
    });
    //
    Page.SearchControl.on("searchFocus", function (events) {
      Page.Tip.closeCusDetail();
    });
    Page.SearchControl.on("categoryBtn", function (events) {
      Page.Tip.closeCusDetail();
    });
    Page.SearchControl.on("searchBtn", function (events) {
      Page.Tip.closeCusDetail();
    });

    Page.SearchControl.on("clearSearchResult", function (poiData) {
      if (!Rtmap.TrackFactory.getTrackStatus()) {
        Page.ClearBtn.close("Search");
      }
    });

    (function () {
      var showBox = {};
      Rtmap.Search.on("beforeSearch", function (timestamp) {
        showBox[timestamp] = Page.Controller.DialogLabel.show("正在搜索...");
      });

      Rtmap.Search.on("afterSearch", function (data, timestamp) {
        Page.Controller.DialogLabel.close(showBox[timestamp]);
        if ((!data.poilist) || data.poilist.length < 1) {
          Page.Controller.DialogLabel.show("没有找到相关店铺或设施", 1000);
        }
      });
    })();

    Rtmap.Scene.on("changeFloor", function (f) {
      $("#floorChange").html(f.toUpperCase() + "");
      var d = Page.floorChange.getFloorInfo(f);
      $("#floorInfo").html(d + "");
      Page.Tip.close();
    });

    Rtmap.Scene.on("poiClick", function (data, layer) {
      //bk layer传入
      if (!layer) {
        Page.Tip.close();
        return;
      }
      //选中marker移除
      var marker = Rtmap.Scene.SelectMarker;
      marker ? Rtmap.Scene.removeLayer(marker, true) : "";
      var name = layer.feature.properties.name_chinese;
      Page.Tip.show({
        layer: layer,
        poiName: name,
        parentDOM: $("#infoBox"),
        start: function () {
          Rtmap.TrackFactory.setStartPoi(layer);
        },
        end: function () {
          Rtmap.TrackFactory.setEndPoi(layer);
        }
      });
      var redIconUrl = Rtmap.Style.getGlobalConfig("focus_icon_url");
      var _icon = L.icon({
        iconUrl: redIconUrl,
        iconRetinaUrl: redIconUrl,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        shadowSize: [68, 95],
        shadowAnchor: [22, 94]
      });
      marker = Rtmap.Scene.createMarker({
        x: layer.feature.properties.x_coord,
        y: layer.feature.properties.y_coord,
        icon: _icon
      });
      marker.selected = true;
      Rtmap.Scene.SelectMarker = marker;
    });
  };

  function _initMap() {
    var f = Rtmap.Config.getOption().defaultFloor;
    Rtmap.Scene.changeFloorTo(f);
  };

  var _alertLabel = (function () {
    function _show(txt) {
      var alertBox = $("<div/>", {class: "alertBox"});
      alertBox.text(txt);
      $("body").append(alertBox);
      return alertBox;
    };

    function _clearShow(box) {
      if (box) {
        box.remove();
      }
    }

    return {
      getShow: _show,
      clearShow: _clearShow
    }
  })();

  var _dialogLabel = (function () {
    var _dialog = null;

    function _show(txt, time) {
      _dialog = $("<div/>", {class: "dialog_label"});
      var text = $("<div/>", {class: "content", text: txt});
      _dialog.html("").css({opacity: 1}).append(text);
      $("body").append(_dialog);
      height = text[0].scrollHeight;
      text.css({"margin-top": -height / 2 + "px"});
      //anj
      text.css({"text-shadow": "0 0 0"});
      if (time) {
        (function () {
          var d = _dialog;
          setTimeout(function () {
            _close(d);
          }, time);
        })()
      }
      return _dialog;
    };


    function _close(dailog) {
      dailog.animate({opacity: 0.01}, 500, function () {
        dailog.html("").remove().css({opacity: 1});
      });
    }

    return {
      show: _show,
      close: _close
    }
  })();

  _page.Controller = {
    bindGlobalEvent: _bindGlobalEvent,
    initMap: _initMap,
    AlertLabel: _alertLabel,
    DialogLabel: _dialogLabel
  }
})(window.Page);

/*
 *Clear Btn UI
 */
(function (_page) {
  var showStatus = false; //hide
  var Events = [];
  var JsonEvents = {};
  var clearBtn = $('<div class="clearBtn clearSearch"><img src="./public/img/cleanup.png"></div>');
  var showList = {};

  clearBtn.click(function () {
    for (var i in JsonEvents) {
      JsonEvents[i]();
    }
    for (var i = 0; i < Events.length; i++) {
      Events[i]();
    }
    if (!showStatus) {
      Events.length = 0;
    }
    //anj
    $(".tip_box").hide();
  });

  _page.ClearBtn = {
    show: function (name) {
      showList[name] = 0;
      showStatus = true;
      $(".top_right_bar").append(clearBtn);
      clearBtn.show();
      $(".top_right_bar").show();//防止在routeDisplay中被隐藏
    },
    addEvent: function (func) {
      Events.push(func);
    },
    removeEvent: function (func) {
      for (var i = 0; i < Events.length; i++) {
        if (Events[i].name == func.name) {
          Events.splice(i, 1);
          return;
        }
      }
    },
    bind: function (action, handler) {
      JsonEvents[action] = handler;

    },
    close: function (name) {
      delete showList[name];
      var haveUser = false;
      for (var i in showList) {
        haveUser = true;
      }
      if (!haveUser) {
        showStatus = false;
        clearBtn.hide();
      }
    }
  }
})(window.Page);

/*
 * Floor List UI
 */
(function (_page) {
  var _floorAry;
  var _floorJson = {};

  function _createFloorList() {
    var ul = $("<ul/>", {class: "show_floor_list"});
    for (var i = 0; i < _floorAry.length; i++) {
      var li = $("<li/>", {class: "li"});
      li.append("<div class='floor'>" + _floorAry[i].floor + "</div>");
      li.append("<div class='desc'>" + _floorAry[i].desc + "</div>");
      ul.append(li);
      _bindEvent(li, _floorAry[i].floor);
    }
    ;
    return ul;
  }

  function _bindEvent(tag, floor) {
    tag.click(function () {
      Rtmap.Scene.changeFloorTo(floor.toLowerCase());
      return false;
    });
  }

  _page.floorChange = {
    changeFloor: function () {
      var ul = _createFloorList();
      $("#infoBox").html("").append(ul);
    },
    setData: function (data) {
      if (!data.build_detail) {
        return;
      }
      _floorAry = data.build_detail.floorinfo;
      for (var i = 0; i < _floorAry.length; i++) {
        var key = _floorAry[i].floor.toLowerCase();
        _floorJson[key] = _floorAry[i].desc;
      }
    },
    getFloorInfo: function (floor) {
      floor = floor.toLowerCase();
      return _floorJson[floor];
    }
  };
})(window.Page);

/*
 *Tip and Detail UI
 */
(function (_page) {
  var tip_box = $("<div/>", {class: "tip_box"});
  var detail_box = $("<div/>", {class: "detail_Tip"});
  var startFuc = null;
  var endFuc = null;
  var showLayer = null;
  //选中要素样式
  var overstyle = {
    color: "#844d8c",
    fillColor: "#c28dc4",
    weight: 1,
    opacity: 1,
    fillOpacity: 1
  };
  var strHtml = '' +
    '<div class="top_bar">' +
    '<div class="title"></div>' +
    '<i class="fa fa-close close"></i>' +
    '<div class="detail_enter"><i class="fa fa-angle-up"></i> 详情 </div>'+
    '</div>' +
    '<div class="btn_bar">' +
    '<div class="start"><i class="fa fa-long-arrow-up"></i>从这里出发</div>' +
    '<div class="end"><i class="fa fa-long-arrow-down"></i>去这里</div>' +
    '</div>';

  var detailHtml = '<div class="back"><i class="fa fa-close"></i></div>' +
    '<iframe src=""></iframe>';

  var cusDetailHtml = null;
  var cusDetailDOM = null;
  var showStatus = false;

  function updateHtml(json) {
    var image = "";
    var descript = "";
    var moregroup = "";
    var currecy = "";
    var phone = "";
    if (json.poi_image) {
      image = '<div class="group">' +
        '<img class="poi_image" src="' + json.poi_image + '" />' +
        '</div>';
    }

    if (json.poi_descript) {
      descript = '<div class="group">' +
        '<p>' + json.poi_descript + '</p>' +
        '</div>';
    }

    if (json.support_currecy) {
      currecy = '<p class="poi_phone_list">' +
        '<span>支持货币:</span>' +
        '<span class="poi_phone">' + (json.support_currecy || "") + '</span>' +
        '</p>';
    }

    if (json.more) {
      moregroup = '<a class="more">更多...</a>';
    }

    if (json.phone_number) {
      var ary = json.phone_number.split(",");
      for (var i = 0; i < ary.length; i++) {
        phone += '<a href="tel:' + ary[i] + '">' + ary[i] + '</a> &nbsp;';
      }
    }
    cusDetailHtml =
      '<div class="cus_detail">' +
      '<div class="detail_box">' +
      '<div class="poi_info">' +
      '<div class="group">' +
      '<div class="poi_logo">' +
      (json.poi_logo ? '<img src=' + json.poi_logo + '>' : "") +
      '</div>' +
      '<span class="poi_title">' + (json.poi_name || "") + '</span>' +
      '<p class="poi_address_list">' +
      '<span>地址：</span>' +
      '<span class="poi_address">' + (json.poi_address || "") + '</span>' +
      '</p>' +
      '<p class="poi_phone_list">' +
      '<span>电话：</span>' +
      '<span class="poi_phone">' + phone + '</span>' +
      '</p>' +
      '</div>' +
      '<div class="group">' +
      '<p class="poi_address_list">' +
      '<span>分类：</span>' +
      '<span class="poi_address">' + (json.business_type || "") + '</span>' +
      '</p>' +
      '<p class="poi_phone_list">' +
      '<span>营业时间：</span>' +
      '<span class="poi_phone">' + (json.business_time || "") + '</span>' +
      '</p>' +
      currecy +
      '</div>' +
      image +
      descript +
      moregroup +
      '</div>' +
      '</div>' +
      '</div>';
    cusDetailDOM ? cusDetailDOM.remove() : '';
    cusDetailDOM = $(cusDetailHtml);
    cusDetailDOM.find(".more").click(function () {
      showDetail(json.more);
    });
  }

  function toggleCusDetail(json) {
    if (!showStatus) {
      updateHtml(json);
      showStatus = true;
      $("body").append(cusDetailDOM);
      tip_box.find(".detail_enter").find("i").removeClass("fa-angle-up").addClass("fa-angle-down");
    } else {
      _closeCusDetail();
    }
  }

  function _closeCusDetail() {
    tip_box.find(".detail_enter").find("i").removeClass("fa-angle-down").addClass("fa-angle-up");
    showStatus = false;
    cusDetailDOM ? cusDetailDOM.remove() : "";
  }

  function showDetail(url) {
    detail_box.html("").append(detailHtml);
    detail_box.find(".back").click(function () {
      detail_box.remove();
    });
    detail_box.find("iframe").attr("src", url);
    $("body").append(detail_box);
  }

  tip_box.append(strHtml);

  tip_box.find(".close").click(function () {
    reStyle();
    _page.Tip.close();
  });

  tip_box.find(".start").click(function () {
    startFuc ? startFuc() : "";
    tip_box.hide();

    Page.Tip.set('all');

    reStyle();
    _page.Tip.close();
    Page.ClearBtn.show("Track");
    Page.ClearBtn.bind("clearPath", function () {
      Rtmap.TrackFactory.clearPath();
      Page.controllerHelper.down("Tip");
      Page.RoutePlan.reset();
      Page.Tip.set('all');
    });

    //设置导航页信息
    if (window.Page.RoutePlan) {
      if (showLayer.feature) {
        window.Page.RoutePlan.show({
          x: showLayer.feature.properties.x_coord,
          y: showLayer.feature.properties.y_coord,
          floor: Rtmap.Scene.getNowFloor().toLowerCase(),
          poi_no: showLayer.feature.properties.poi_no,
          name: showLayer.feature.properties.name_chinese,
          type: "start"
        });
      }
      else {
        window.Page.RoutePlan.show({
          x: showLayer.x,
          y: showLayer.y,
          floor: showLayer.floor.toLowerCase(),
          poi_no: showLayer.poi_no,
          name: showLayer.name,
          type: "start"
        });
      }
    }
  });

  tip_box.find(".end").click(function () {
    endFuc ? endFuc() : "";
    tip_box.hide();

    Page.Tip.set('all');

    reStyle();
    _page.Tip.close();
    Page.ClearBtn.show("Track");
    Page.ClearBtn.bind("clearPath", function () {
      Rtmap.TrackFactory.clearPath();
      Page.controllerHelper.down("Tip");
    });

//        设置导航页信息
    if (window.Page.RoutePlan) {
      if (showLayer.feature) {
        window.Page.RoutePlan.show({
          x: showLayer.feature.properties.x_coord,
          y: showLayer.feature.properties.y_coord,
          floor: Rtmap.Scene.getNowFloor().toLowerCase(),
          poi_no: showLayer.feature.properties.poi_no,
          name: showLayer.feature.properties.name_chinese,
          type: "end"
        });
      }
      else {
        window.Page.RoutePlan.show({
          x: showLayer.x,
          y: showLayer.y,
          floor: showLayer.floor.toLowerCase(),
          poi_no: showLayer.poi_no,
          name: showLayer.name,
          type: "end"
        });
      }
    }
  });

  tip_box.find(".detail_enter").click(function () {
    Page.SearchControl.hideCategory();
    var url = $(this).data("url");
    var type = $(this).data("type");
    var data = $(this).data("data");
    var self = this;
    if (url) {
      if (type == "html") {
        showDetail(url);
      } else if (type == 'button') {
        if (data.classify_attr) {
          Page.PoiDetail.getDetailData(data, function (err, res) {
            if (!err) {
              res.more = url;
              toggleCusDetail(res)
            }
          });
        } else {
          toggleCusDetail({
            more: url,
            poi_name: data.name_chinese
          })
        }
      }
    } else {
      Page.PoiDetail.getDetailData(data, function (err, res) {
        if (!err) {
          toggleCusDetail(res)
        }
      });
    }
  });


  function reStyle() {
      if (showLayer && showLayer.feature && !showLayer.ParkingStatus) {
      var poiType = showLayer.feature.properties.style;
      var style = Rtmap.Classification.getLayerStyle(showLayer);
      if (showLayer.setStyle) showLayer.setStyle(style);
    }
  }

  Rtmap.TrackFactory.on("drawPath", function (e, trackLine) {
    Page.SearchControl.clearSearchResult();
    if (trackLine) {
      window.setTimeout(function () {
        if (!Rtmap.TrackFactory.getCTrackLine()) {
          Rtmap.Scene.getMap().fitBounds(trackLine.getBounds().pad(0.2));
        }
      }, 350);
    }
  });

  Rtmap.TrackFactory.on("clearPath", function () {
    Page.ClearBtn.close("Track");
    Page.controllerHelper.down("TrackDashboard");
  });

  Rtmap.TrackFactory.on("needStartPoi", function () {
    Page.Controller.DialogLabel.show("请选择起点", 1000);
  });

  (function () {
    var showBox = {};
    Rtmap.TrackFactory.on("beforeRequest", function (timestamp) {
      //showBox['a']=Page.Controller.DialogLabel.show("正在规划路径...");
    });
    Rtmap.TrackFactory.on("afterRequest", function () {
      // Page.Controller.DialogLabel.close(showBox["a"]);
    });
  })();

  function detialBtncheck(json) {
    if (!json.layer) {
      return;
    }
    var properties = json.layer.feature.properties;
    _closeCusDetail();
    if (Rtmap.Config.getOption().vendorDetailUrl) {
        if (Rtmap.Config.getOption().poiDetialType != "1") {
            Page.PoiDetail.getVendorDetail(properties, function (data) {
                if (data.result.error_code == "0") {
                    if (data.url) {
                        tip_box.find(".detail_enter").show();
                        tip_box.find(".detail_enter").data("url", data.url);
                        tip_box.find(".detail_enter").data("type", data.type);
                        tip_box.find(".detail_enter").data("data", properties);
                    } else if (properties.classify_attr == 0) {
                        tip_box.find(".detail_enter").data("url", null).hide();
                    } else {
                        tip_box.find(".detail_enter").data("url", null).data("data", properties).show();
                    }
                }
            });
        }
        else {//拼接式详情(西单大悦城需求)type==1
            var url = Rtmap.Config.getOption().vendorDetailUrl;
            var buildId = Rtmap.Config.getOption().buildId;
            var floor = properties.floor;
            var poi_no = properties.poi_no;
            var url = Rtmap.Config.getOption().vendorDetailUrl + "&build=" + buildId + "&floor=" + floor + "&poi=" + poi_no;
            tip_box.find(".detail_enter").show();
            tip_box.find(".detail_enter").data("url", url);
            tip_box.find(".detail_enter").data("type", "html");
            tip_box.find(".detail_enter").data("data", properties);
        }
    } else if (properties.classify_attr && properties.classify_attr != 0) {
        tip_box.find(".detail_enter").data("url", null).data("data", properties).show();
    }
  }

  _page.Tip = {
    show: function (json) {
      Page.controllerHelper.up("Tip");
      reStyle();
      showLayer = json.layer;
      if (showLayer && !showLayer.ParkingStatus) {//若有停车位实时状态
          showLayer.setStyle ? showLayer.setStyle(overstyle) : "";
      }
      else {
          showLayer = json.data;//由后台查询获取的数据，无layer
      }
      tip_box.show();
      tip_box.find(".title").text(json.poiName);
      tip_box.find(".detail_enter").hide();
      detialBtncheck(json);
      startFuc = json.start;
      endFuc = json.end;
      $("body").append(tip_box);
      $(".dashboardList").hide();
    },
    set: function (_type) {
      var $end = tip_box.find(".end"),
          $start = tip_box.find(".start");

      switch (_type) {
          case 'start':
              $end.hide();
              $start.show().css({ width: '100%' });
              break;
          case 'end':
              $end.show().css({ width: '100%' });
              $start.hide();
              break;
          default:
              $start.show().css({ width: '50%', display: 'inline-block'});
              $end.show().css({ width: '50%', display: 'inline-block' });
      }
      Page.controllerHelper.down("Tip");
    },
    close: function () {
      //选中marker移除
      var marker = Rtmap.Scene.SelectMarker;
      marker ? Rtmap.Scene.removeLayer(marker, true) : "";
      reStyle();
      $(".dashboardList").show();
      tip_box.hide();
      _closeCusDetail();
      Page.controllerHelper.down("Tip");
    },
    closeCusDetail: _closeCusDetail
  }
})(window.Page);

/*
 *DetailInfo Service
 */
(function (_page) {
  function _getDetailData(json, callback) {
    $.ajax({
      type: "post",
      url: "http://lbsapi.rtmap.com:8080/rtmap_lbs_api/v1/rtmap/classify_poiinfo",
      //url:"http://lbsapitest2.rtmap.com:8080/rtmap_lbs_api/v1/rtmap/classify_poiinfo",
      data: JSON.stringify({
        key: Page.URL.getParameter("key"),
        buildid: Rtmap.Config.getOption().buildId,
        floor: json.floor || 'F2',
        poi_no: json.poi_no || '75',
        classify_id: json.classify_attr || '1'
      })
    }).done(function (data) {
      if (data.result.error_code == 0) {
        callback ? callback(null, data.poiinfo) : "";
      }
      callback ? callback(data.result.error_msg) : "";
    });
  }

  function _getVendorDetail(json, callback) {
    $.ajax({
      type: "get",
      url: Rtmap.Config.getOption().vendorDetailUrl,
      data: {
        buildid: json.id_build,
        floor: json.floor,
        poi_no: json.poi_no
      },
      jsonp: "callback",
      jsonpCallback: "handler",
      dataType: "jsonp",
    }).done(function (data) {
      callback ? callback(data) : "";
    });
  };

  _page.PoiDetail = {
    getDetailData: _getDetailData,
    getVendorDetail: _getVendorDetail
  }
})(Page);

/*
 * location for web browser
 */
(function (_page) {
  var localer = null;
  var oldX = null, oldY = null;
  var animate = null;
  var model = "follow"

  function Localer(x, y, floor) {
    this.x = x;
    this.y = y;
    this.floor = floor;
    var icon = L.icon({
      iconUrl: "./public/img/position.png",
      iconRetinaUrl: "./public/img/position.png",
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      shadowSize: [68, 95],
      shadowAnchor: [22, 94]
    });
    this.body = Rtmap.Scene.createMarker({
      icon: icon,
      floor: floor,
      fillOpacity: 1,
      opacity: 1,
      fillColor: "#0091FF",
      color: "#fff",
      weight: 2,
      size: 10,
      x: x,
      y: y
    });
  }

  //no used can be deleted
  Localer.prototype.flashLoop = function () {
    var carCircleSize = 10;
    var step = 0.2;
    var self = this;
    var scope = this.scope;
    scope.animate = new Rtmap.Animate(function () {
      carCircleSize += step;
      if (carCircleSize < 10 || carCircleSize > 25) {
        step = -step;
        carCircleSize = 10;
      }
      self.scope.setRadius(carCircleSize);
    });
    //scope.animate.run();
  };
  Localer.prototype.updateLocation = function (x, y, floor) {
    this.x = x;
    this.y = y;
    this.floor = floor;
    var latlng = L.CRS.EPSG3395.projection.unproject(new L.Point(x, y));
    this.body.setLatLng(latlng);
    this.scope.setLatLng(latlng);
    console.log(this.floor, Rtmap.Scene.getNowFloor());
    if (this.floor == Rtmap.Scene.getNowFloor()) {
      this.scope.bringToFront();
      this.body.bringToFront();
      console.log(1);
    }
  };

  function _update(x, y, floor) {
    if (oldX == x && oldY == y) {
      return;
    }
    var nowX = parseFloat(oldX);
    var nowY = parseFloat(oldY);
    oldX = x;
    oldY = y;
    if (localer != null) {
      localer.updateLocation(x, y, floor);
      return;
      var oneStepX = (x - nowX) / 30;
      var oneStepY = (y - nowY) / 30;

      var count = 0;
      animate = new Rtmap.Animate(function (timestamp) {
        nowX += oneStepX;
        nowY += oneStepY;
        count++;
        if (count > 28) {
          count = 0;
          animate.clear();
          if (model == "follow") {
            //Rtmap.Scene.moveTo({x:nowX,y:nowY});
          }
        } else {
          localer.updateLocation(nowX, nowY);
        }
      });
      animate.run();
    } else {
      localer = new Localer(x, y, floor);
    }
  }

  _page.Local = {
    update: _update,
    changeModel: function (_model) {
      model = _model;
      if (_model == "follow") {
        Rtmap.Scene.moveTo({x: oldX, y: oldY});
      }
    },
    stop: function () {
      animate ? animate.stop() : "";
    },
    setLocaler: function () {

    },
    getLocaler: function () {
      return localer;
    }
  }
})(window.Page);

/*
 *URL util
 */
(function (_page) {
  function _getURLParameter(name, search) {
    var _search = search || location.search;
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(_search) || [, ""])[1].replace(/\+/g, '%20')) || null
  }

  _page.URL = {
    getParameter: function (name, search) {
      var str = _getURLParameter(name, search);
      //str ? str = str.replace(/\//g, "") : "";
      return str
    }
  }
})(window.Page);


/*
 * wechat realtime location
 */
(function (_page) {
  var _locationTimer = null;
  var _locationMarker = null;
  var _locationTargetLine = null;//实时定位点与目标点之间的直线
  var _lastLocationUpdateTime = null;
  var _openid = null;
  var _localer = null;
  var _bNavigator = false;//是否执行过导航
  var _bIsFirstLocation = true;

  function _drawLocation(data) {
    if (data.result.error_code == 0) {
      clearTimeout(window.locateAlertTmp);
      _updateStartMarker(data.lbsinfo.x, data.lbsinfo.y, data.lbsinfo.floor);
    }
  }

  function _updateStartMarker(x, y, floor) {
    _localer = {};
    _localer.x = x;//user_position
    _localer.y = y;
    _localer.floor = floor;
    //_lastLocationUpdateTime = new Date().getTime();
    if (_locationMarker) {
      if (_locationMarker._map == null) {
        _locationMarker = null;
      }
    }
    if (!_locationMarker) {
      if (Rtmap.Scene.getNowFloor().toUpperCase() == floor.toUpperCase()) {
        if (!window.userProfileImageUrl) {
            var icon = L.icon({
                iconUrl: "./public/img/position.png",
                iconRetinaUrl: "./public/img/position.png",
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                shadowSize: [68, 95],
                shadowAnchor: [22, 94]
            });
            _locationMarker = Rtmap.Scene.createMarker({
                icon: icon,
                floor: floor,
                fillOpacity: 1,
                opacity: 1,
                fillColor: "#0091FF",
                color: "#fff",
                weight: 2,
                size: 10,
                x: x,
                y: y
            });
        }
        else {
            try {
                var latlng = L.CRS.EPSG3395.projection.unproject(new L.Point(x, y));
                _locationMarker = window.Rtmap.Extend.createUserProfileMarker(Rtmap.Scene.getMap(), latlng.lat, latlng.lng, window.userProfileImageUrl);
                Rtmap.Scene.addExistMarker(_locationMarker, floor);
            }
            catch (e) {
                alert(e);
            }
        }
      }
    }
    else {
      var latlng = L.CRS.EPSG3395.projection.unproject(new L.Point(x, y));
      _locationMarker.setLatLng(latlng);
      //若楼层不一致，则移除定位点
      if (Rtmap.Scene.getNowFloor().toUpperCase() != floor.toUpperCase()) {
        Rtmap.Scene.removeLayer(_locationMarker, true);
      }
    }
    //跟随模式
    if (locationModel == "follow") {
        Rtmap.Scene.moveTo(_localer);
        Rtmap.Control.enableLocal();
        if (Rtmap.Scene.getNowFloor().toUpperCase() != _localer.floor.toUpperCase()) {
            Rtmap.Scene.changeFloorTo(_localer.floor);
        }
    }
    _bIsFirstLocation = false;

    //是否传入路径参数
    var route = Page.URL.getParameter("route");
    var routeAry = JSON.parse(route);
    routeAry ? "" : routeAry = [];
    //判断是否带终点POI点参数
    var pointNameStr = Page.URL.getParameter("endpoint_name");
    if (pointNameStr || routeAry.length == 1) {
        //判断是否执行过路径规划
        if (!_bNavigator && Rtmap.TrackFactory.getEndPoi()) {
            Rtmap.TrackFactory.setStartPoi(_localer);
            try {
                var endPoi = Rtmap.TrackFactory.getEndPoi();
                endPoi ? Rtmap.TrackFactory.setEndPoiXY(endPoi.floor, endPoi.x_coord, endPoi.y_coord, function (res) {
                    Page.Tip.set("all");
                    window.__onTrackSuccess(res);
                    //通过传参执行的路径规划,不显示返回框
                    $(".backBtn").hide();
                }) : "";
            }
            catch (e) { };
            _bNavigator = true;
        }
    }
    _updateLocationTargetLine(x, y, floor);
  }

  //清除橡皮筋线
  function _clearLocationTargetLine() {
    if (_locationTargetLine) {
      Rtmap.Scene.removeLayer(_locationTargetLine, true);
      _locationTargetLine = null;
    }
  }

  //更新定位点与目标点橡皮筋
  function _updateLocationTargetLine(x, y, floor) {
    var latlng = L.CRS.EPSG3395.projection.unproject(new L.Point(x, y));
    if (_locationTargetLine) {
        Rtmap.Scene.removeLayer(_locationTargetLine, true);
        _locationTargetLine = null;
    }
    //若楼层一致
    if (Rtmap.Scene.getNowFloor().toUpperCase() == floor.toUpperCase()) {
        var endPoi = Rtmap.TrackFactory.getEndPoi();
        if (!endPoi) return;
        if (!endPoi.floor) return;
        try {
            if (endPoi.floor && endPoi.floor.toUpperCase() == Rtmap.Scene.getNowFloor().toUpperCase()) {//若存在目标点，且在同一楼层，则绘制橡皮筋,定位点与目标点橡皮筋
                var endLatlng = L.CRS.EPSG3395.projection.unproject(new L.Point(endPoi.x_coord, endPoi.y_coord));//endPoi.Marker.getLatLng();
                var latlngs = [];
                latlngs.push(latlng);
                latlngs.push(endLatlng);
                _locationTargetLine = L.polyline(latlngs, { color: 'red', opacity: 1, weight: 2 });
                Rtmap.Scene.addLayer(_locationTargetLine);
            }
        }
        catch (e) {
            //alert(e);
        }
    }
  }

  //确认定位是否可用
  function _validLocationIsOK() {
    if (_lastLocationTime) {
      var nowTime = new Date().getTime();
      var tick = (nowTime - _lastLocationTime) / 1000;
      $("#show .step").html("时间间隔:" + tick);
      //距上次定位成功时间超过10秒
      if (tick > 10) {
        Page.Controller.DialogLabel.show("定位失败,网络可能不可用!", 2000);
        _isValidLocation = false;
      }
      else {
        //延迟验证网络是否可用
        window.setTimeout(function () {
          _validLocationIsOK();
        }, 5000);
      }
    }
  }

  function _stopLocation() {
    if (_locationTimer) {
      window.clearInterval(_locationTimer);
    }
  }

  //是否有效定位点
  function _isValidLocation(data) {
    if (_localer) {
      //容差
      var tolerance = (new Date().getTime() - _lastLocationUpdateTime) * 1.5 / 1000;
      if (_localer.floor != data.lbsinfo.floor) {
        return true;
      }
      var distance = Math.pow(((data.lbsinfo.x - _localer.x) * (data.lbsinfo.x - _localer.x) + (data.lbsinfo.y - _localer.y) * (data.lbsinfo.y - _localer.y)), 0.5);
      if (distance > tolerance) {
        return false;
      }
    }
    return true;
  }

  //蓝牙提示
  function _locateAlert() {
    window.locateAlertTmp = window.setTimeout(function () {
      Page.Controller.DialogLabel.show("定位需要蓝牙，请确认是否开启!", 3000)
    }, 10000);
  }

  //指针方向
  window.addEventListener("deviceorientation", orientationHandler, false);

  function orientationHandler(event) {
      if (!_locationMarker) return;
      var angle = 0;
      if (event.webkitCompassHeading) {
          // Apple works only with this, alpha doesn't work
          angle = event.webkitCompassHeading;
      }
      else {
          angle = 360 - event.alpha;
      }
      var deviceAngle = Math.round(angle) + window.getBuildAngle(); //左右旋转deg
      //var deviceAngle = Math.round(event.beta) + correctionValue; //前后旋转deg
      //var deviceAngle = Math.round(event.gamma) + +correctionValue; //扭转设备deg
      try {
          _locationMarker.setRotationAngle(deviceAngle);
      }
      catch (e) {
      }
  }

  _page.wechat = {
    updateStartMarker: _updateStartMarker,
    updateLocationTargetLine: _updateLocationTargetLine,
    clearLocationTargetLine: _clearLocationTargetLine,
    stopLocation: _stopLocation,
    getLocaler: function () {
      return _localer;
    },
    drawLocation: _drawLocation,
    locateAlert: _locateAlert
  }
})(Page);

(function getStep(window) {
  var CURRENT_SETP;
  var SENSITIVITY = 10; // SENSITIVITY灵敏度
  var mLastValues = [];
  var mScale = [];
  var mYOffset;
  var end = 0;
  var start = 0;
  var build_angle = 0;
  /**
   * 最后加速度方向
   */
  var mLastDirections = [];
  var mLastExtremes = [new Array(6), new Array(6)];
  var mLastDiff = [];
  var mLastMatch = -1;

  function _stepDetector() {
    var h = 480;
    mYOffset = h * 0.5;
    mScale[0] = -(h * 0.5 * (1.0 / (9.80665 * 2)));
    mScale[1] = -(h * 0.5 * (1.0 / (60.0)));
  }

  _stepDetector();

  function _countStep(data) {
    var event;
    CURRENT_SETP = 0;
    for (var num = 0; num < data.length; num++) {
      event = data[num];
      var vSum = 0;
      for (var key in event) {
        var v = mYOffset + event[key] * mScale[1];
        vSum += v;
      }
      var k = 0;
      var v = vSum / 3;

      var direction = (v > mLastValues[k] ? 1
        : (v < mLastValues[k] ? -1 : 0));
      if (direction == -mLastDirections[k]) {
        // Direction changed
        var extType = (direction > 0 ? 0 : 1); // minumum or
        // maximum?
        mLastExtremes[extType][k] = mLastValues[k];
        var diff = Math.abs(mLastExtremes[extType][k]
          - mLastExtremes[1 - extType][k]);

        if (diff > SENSITIVITY) {
          var isAlmostAsLargeAsPrevious = diff > (mLastDiff[k] * 2 / 3);
          var isPreviousLargeEnough = mLastDiff[k] > (diff / 3);
          var isNotContra = (mLastMatch != 1 - extType);

          if (isAlmostAsLargeAsPrevious && isPreviousLargeEnough
            && isNotContra) {
            end = new Date().getTime();
            if (end - start > 300) {// 此时判断为走了一步

              CURRENT_SETP++;
              mLastMatch = extType;
              start = end;
            }
          } else {
            mLastMatch = -1;
          }
        }
        mLastDiff[k] = diff;
      }
      mLastDirections[k] = direction;
      mLastValues[k] = v;
    }
    return CURRENT_SETP;
  }

  function _moveStatus(data) {
    if (data.length) {
      var avg = 0; // 均值
      var tmp = 0;
      for (var f = 0; f < data.length; f++) {
        var plus = 0;
        if (data[f]) {
          data[f].sq = 0;
          for (var key in data[f]) {
            var numTmp = parseFloat(data[f][key]);
            plus += numTmp * numTmp;
          }
          avg += Math.sqrt(plus);
          data[f].sq = Math.sqrt(plus);
        }
      }

      avg = avg / data.length;
      for (var g = 0; g < data.length; g++) {
        var tmp_1 = 0;
        tmp_1 = data[g].sq - avg;
        tmp += Math.pow(tmp_1, 2);
      }
      tmp = tmp / data.length;
      //$("#show .step").html(tmp);
      return tmp > 0.2 ? 1 : 0;
    } else {
      return 1;
    }
  }

  function _compassStandard(data) {

    function _getAvg(data1) {
      var sum = 0;
      var avg_befor = parseFloat(data1[0].alpha);

      for (var i = 0; i < data1.length; i++) {
        if (data1[i]) {
          sum += (_getDegree(parseFloat(data1[i].alpha), avg_befor) + avg_befor);
        }
      }
      sum = sum / data1.length;
      if (sum < 0) {
        sum += 360;
      }
      return sum;
    }

    function _getDegree(start, end) {
      var tmp = start - end;
      if (tmp > 180) {
        tmp -= 360;
      } else if (tmp < 180) {
        tmp += 360;
      }
      return tmp;
    }

    function _getAngular(start, end) {
      var tmp = start - end;
      if (tmp < 0) {
        tmp = -tmp;
      }
      if (tmp > 180) {
        tmp -= 360;
      }
      if (tmp < 0) {
        tmp = -tmp;
      }
      return tmp;
    }

    function _getStandard(data2, avg) {
      var avr = 0;
      var tmp = 0;
      for (var i = 0; i < data2.length; i++) {
        tmp = _getAngular(data2[i].alpha, avg);
        avr += tmp * tmp;
      }
      avr = avr / data2.length;
      return Math.sqrt(avr);
    }

    if (data.length) {
      var avg = _getAvg(data);
      var standard = _getStandard(data, avg);
      return standard;
    } else {
      return 127;
    }
  }

  function _initBuildAngle(callBack) {
    var _buildId = Page.URL.getParameter("buildid");
    var _key = Page.URL.getParameter("key");
    var _buildid_list = [];
    _buildid_list.push(_buildId);
    $.ajax({
      type: "post",
      url: "http://lbsapi.rtmap.com/rtmap_lbs_api/v1/rtmap/build_angle",
      dataType: "json",
      data: JSON.stringify({
        key: _key,
        buildid_list: _buildid_list
      })
    }).done(function (data) {
      if (data.build_angle_list) {
        build_angle = data.build_angle_list[0].angle;//偏转角
      }
    });
  }

  function _getBuildAngle() {
      if (build_angle)
          return parseInt(build_angle);
      else
          return 0;
  }

  window.countStep = _countStep;
  window.moveStatus = _moveStatus;
  window.compassStandard = _compassStandard;
  window.initBuildAngle = _initBuildAngle;
  window.getBuildAngle = _getBuildAngle;
})(window);

(function () {
  window.hashDirection = {
    1: ["./public/img/straight.png", "直行"], //直行
    2: ["./public/img/right_front.png", "右前"], //右前
    3: ["./public/img/right.png", "右转"], //右转
    4: ["./public/img/right_rear.png", "右后"], //右后
    5: ["./public/img/left_rear.png", "左后"], //左后
    6: ["./public/img/left.png", "左转"],//左转
    7: ["./public/img/left_front.png", "左前"], //左前
    8: ["./public/img/elevator_up.png", "上直梯"], //直梯上
    9: ["./public/img/elevator_down.png", "下直梯"],  //直梯下
    10: ["./public/img/stair_up.png", "上扶梯"], //扶梯上
    11: ["./public/img/stair_down.png", '下扶梯']  //扶梯下
  };
})();


/**
 * track success callback
 * gaoletian
 */
(function () {
    window.__onTrackSuccess = function (point) {
    if (point.pointlist.length != 1) {
        window.__store = point;
        window.Page.TrackDashboard.show(point);
        window.createDetailPage(point)
        //路径规划后，会缩放到起点，设为自由模式
        locationModel = "free";
        Rtmap.Control.disableLocal();//默认置灰
    }
  }
})();
