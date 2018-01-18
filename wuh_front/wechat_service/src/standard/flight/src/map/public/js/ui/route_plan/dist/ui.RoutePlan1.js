'use strict';

/**
 * Created by gaoletian on 16/6/12.
 */
(function (_page) {
  var htmlTemplate = '\n<div class="ui-route-plan" id="ui-route-plan">\n    <div class="header">\n      <div id="nav_back" style="width: 40px; font-size: 30px;">\n        <i class="fa fa-angle-left closeBtn" />\n      </div>\n      <div style="flex:1">\n        路线规划\n      </div>\n      <div>\n        <button id="btn_search" class="btn btn-blue">搜索</button>\n      </div>\n    </div>\n    <!--form -->\n    <div class="form">\n      <div style="width: 50px;"  id="btn_swap">\n        <img src=\'./public/img/swap.png\' width=\'20px\' height=\'64px\'/>\n      </div>\n      <div style="flex:1; display: flex; flex-direction: column;">\n        <input type="text"  data-type="start" placeholder="起点"/>\n        <input type="text"  data-type="end" placeholder="终点"/>\n      </div>\n      <div  style="display: flex; flex-direction: column; width: 160px;">\n          <a id="btn_pickup" data-type="start">地图选点</a>\n          <a id="btn_pickup" data-type="end">地图选点</a>\n      </div>\n    </div>\n    <!--err message -->\n    <div id="errInfo" style="display: none"></div>\n    <!--search result -->\n    <div id="poilist">\n    </div>\n\n  </div>\n  ';
  var $jqDom = $(htmlTemplate),
      $search = $jqDom.find('#btn_search'),
      $back = $jqDom.find('#nav_back'),
      $swap = $jqDom.find('#btn_swap'),
      $pickup = $jqDom.find('#btn_pickup'),
      $errInfo = $jqDom.find('#errInfo'),
      $poilist = $jqDom.find('#poilist'),
      $input = $jqDom.find('input'),
      $start = $jqDom.find('input').eq(0),
      $end = $jqDom.find('input').eq(1);

  var _start = null,
      _end = null,
      _poiCache = [],
      _typeCache = 'start',
      _timer = void 0,
      _initState = false;

  function _swap() {
    var _ref = [_end, _start];
    _start = _ref[0];
    _end = _ref[1];

    _setStart(_start);
    _setEnd(_end);
  }

  function _beginPlan() {
    $(".route_detail").remove();
    /* navi_req 埋点 */
    accessLogAppender("navi_req", Page.URL.getParameter("key"));

    if (!_start) {
      $errInfo.html('起点不能为空').show();
      return false;
    }
    if (!_end) {
      $errInfo.html('终点不能为空').show();
      return false;
    }

    try {
      window.Page.loading.show();
      Rtmap.TrackFactory.setStartPoiXY(_start.floor, _start.x, _start.y);
      Rtmap.TrackFactory.setEndPoiXY(_end.floor, _end.x, _end.y, function (res) {
        __onTrack(res);
      });
    } catch (e) {}
  }

  function _renderPoiList(_poilist) {
    _clearPoiList();
    if (!_poilist) {
      return;
    }
    var result = _poilist.map(function (poi, index) {
      return '<li data-index="' + index + '">' + poi.name + ' --- ' + poi.floor + '</li>';
    });

    $poilist.html(result.join(''));
  }

  function _clearPoiList() {
    $poilist.html('');
  }

  function _searchPOI(keywords) {
    if (typeof keywords !== 'string' || !keywords) {
      return false;
    }
    var url = 'http://lbsapi.rtmap.com/rtmap_lbs_api/v1/rtmap/associationsearch';
    var key = window.Page.URL.getParameter("key");
    var buildid = window.Page.URL.getParameter("buildid");
    var data = { key: key, keywords: keywords, buildid: buildid };

    $.post(url, JSON.stringify(data), function (res) {
      _poiCache = res.poilist;
      _renderPoiList(res.poilist);
    });
  }

  function _delaySearchPOI(keywords) {
    if (_timer) {
      clearTimeout(_timer);
    }
    _timer = setTimeout(function () {
      _searchPOI(keywords);
    }, 600);
  }

  function _setStart(param) {
    _start = param;
    var display_name = _start ? '' + param.name + (param.hideFloor ? '' : '---' + Rtmap.Config.getFloorAliasName(param.floor.toUpperCase())) : '';
    $start.val(display_name);
  }

  function _setEnd(param) {
    _end = param;
    var display_name = _end ? '' + param.name + (param.hideFloor ? '' : '---' + Rtmap.Config.getFloorAliasName(param.floor.toUpperCase())) : '';
    $end.val(display_name);

    // 设置我的位置
    if (!_start) {
        var myLocation = Page.wechat.getLocaler();
        if (!!myLocation) {
            _setStart(_merge(myLocation, { name: '当前位置', hideFloor: true }));
        }
    }
    else {
        if (_start.name == "当前位置") {
            var myLocation = Page.wechat.getLocaler();
            if (!!myLocation) {
                _setStart(_merge(myLocation, { name: '当前位置', hideFloor: true }));
            }
        }
    }
  }

  function _merge(a, b) {
    var res = {};
    Object.keys(a).forEach(function (key) {
      return res[key] = a[key];
    });
    Object.keys(b).forEach(function (key) {
      return res[key] = b[key];
    });
    return res;
  }

  function _back() {
    /* opt_navi_setting_close 埋点 */
    accessLogAppender("opt_navi_setting_close", Page.URL.getParameter("key"));

    $(".rtmap_search_box").show();
    $(".floor_change_box").show();

    /* 清除路线和起始点 */
    Rtmap.TrackFactory.clearAll();
    _reset();
  }

  function _reset() {
    $jqDom.remove();
    _start = null;
    _end = null;
    _initState = false;

    $start.val('');
    $end.val('');
    $errInfo.hide();
  }

  function _init() {
    $jqDom.appendTo('body');

    $search.click(function () {
      return _beginPlan();
    });
    $back.click(function () {
      return _back();
    });
    $swap.click(function () {
      return _swap();
    });

    $input.on('input', function (event) {
      _delaySearchPOI($(this).val());
    }).focus(function () {
      _typeCache = $(this).attr('data-type');
      _typeCache === 'start' ? _setStart() : _setEnd();
    });

    $pickup.click(function () {
      $errInfo.hide();
      _clearPoiList();
      _toggle();
      /* 清除路线和起始点 */
      //Rtmap.TrackFactory.clearAll();

      Page.Tip.set($(this).attr('data-type'));
    });

    $poilist.delegate('li', 'click', function () {
      var index = $(this).attr('data-index');
      var poi = _poiCache[index];
      _typeCache === 'start' ? _setStart(poi) : _setEnd(poi);
      $errInfo.hide();
      _clearPoiList();
    });
  }

  function _show(param) {
    var isDom = $('#ui-route-plan');
    if (isDom.length !== 1) {
      _init();
    }
    param.type === 'start' ? _setStart(param) : _setEnd(param);
    $jqDom.show();
  }

  function _toggle() {
    $jqDom.is(":visible") ? $jqDom.hide() : $jqDom.show();
  }

  window.__onTrack=function(res) {
      _page.loading.hide();
      if (res.hasOwnProperty("statusText") || res.result.error_code != "0") {
          /* 路径规划失败 埋点 */
          accessLogAppender("navi_fail", Page.URL.getParameter("key"));
          alert("路径规划失败");
          return false;
      }
      $jqDom.hide();
      /* 路径规划成功 埋点 */
      accessLogAppender("navi_success", Page.URL.getParameter("key"));
      //若存在定位点
      Page.Tip.set("all");
      window.__onTrackSuccess(res);
  }

  _page.RoutePlan = {
    show: function show() {
        var param = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
        _show(param);
    },
    close: function close() {
        $jqDom.hide();
    },
    getStart: function getStart() {
        return _start;
    },
    getEnd: function getEnd() {
        return _end;
    },
    toggle: function toggle() {
        _toggle();
    },
    pickupStart: function pickupStart() {
        $errInfo.hide();
        _clearPoiList();
        _toggle();
        Page.Tip.set("start");
    },
    pickupEnd: function pickupEnd() {
        $errInfo.hide();
        _clearPoiList();
        _toggle();
        Page.Tip.set("end");
    },
    reset: _reset
  };
})(window.Page);