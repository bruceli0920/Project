'use strict';

/**
 * Created by gaoletian on 16/5/26.
 */
(function (_page) {
  var html = '\n        <div class="track_dashboard">\n          <div class="pull_up_info_list">\n            <img src="./public/img/info_list_pull_down.png" alt="" />\n          </div>\n          <div class="track_dashboard_content">\n            <div class="numberofinstruction">1/1</div>\n            <div class="leftinstruction ">\n              <span class="track_arrow off rot180"></span>\n            </div>\n            <div class="dashboardList"></div>\n            <div class="rightinstruction ">\n              <span class="track_arrow off"></span>\n            </div>\n          </div>\n        </div>\n';

  var $jqDOM = $(html),
      $pullup = $jqDOM.find('.pull_up_info_list'),
      $left = $jqDOM.find('.leftinstruction'),
      $right = $jqDOM.find('.rightinstruction'),
      $dash = $jqDOM.find('.dashboardList'),
      $step = $jqDOM.find('.numberofinstruction');

  var pointList = void 0,
      rawPointList = void 0,
      currentStep = 0;

  function _renderItem(data) {
    var hashDirection = window.hashDirection;
    var distance = Math.round(data.distance / 1000);
    var actionImage = hashDirection[data.action][0];
    var actionLable = hashDirection[data.action][1];
    var res = '\n                <div class="dashboardList_item">\n                    <div>\n                        <img src="' + actionImage + '" alt="" />\n                    </div>\n                    <div style="text-align: left;">\n                        <span>步行 ' + distance + ' 米后</span>\n                        <br>\n                        <span>在 ' + data.poi_name + ' 处' + actionLable + '</span>\n                    </div>\n                </div>\n         ';
    $dash.html(res);
  }

  function _renderStep(a, b) {
    $step.text(a + '/' + b);
  }

  function _drawTrackLine(index) {
    var startP = index === 0 ? rawPointList[0] : pointList[index - 1];
    var endP = pointList[index];
    if (startP.floor !== endP.floor) {
      var originIndex = rawPointList.indexOf(endP);
      startP = rawPointList[originIndex - 1];
    }
    Rtmap.TrackFactory.drawCTrackLine(startP, endP, endP.floor);
    //console.log(startP,'\n', endP)
  }

  function _renderArrow() {
    var lclss = currentStep === 0 ? 'track_arrow off rot180' : 'track_arrow on rot180';
    var rclss = currentStep === pointList.length - 1 ? 'track_arrow off' : 'track_arrow on';
    $left.html('<i class="' + lclss + '"></i>');
    $right.html('<i class="' + rclss + '"></i>');
  }

  function _render(pointIndex) {
    currentStep = pointIndex;
    _renderItem(pointList[pointIndex]);
    _renderStep(pointIndex + 1, pointList.length);
    _renderArrow();
    _drawTrackLine(pointIndex);
  }

  function _init() {
    currentStep = 0;
  }

  _page.TrackDashboard = {
    show: function show(_pointList) {

      _page.controllerHelper.up("TrackDashboard"); // ? 这是干什么的????
      // 初始化状态
      _init();

      $('body').append($jqDOM);
      // 点集合
      rawPointList = _pointList.pointlist;
      pointList = rawPointList.filter(function (point) {
        return point.important === 'true';
      });

      // 初始渲染
      _render(currentStep);

      // 左箭头
      $left.on('click', function () {
        if (currentStep === 0) {
          return false;
        }
        /* 点击页卡、滑动页卡查看路线详情 埋点 */
        accessLogAppender("opt_navi_detail", Page.URL.getParameter("key"));

        _render(--currentStep);
      });
      // 右箭头
      $right.on('click', function () {
        if (currentStep === pointList.length - 1) {
          return false;
        }
        /* 点击页卡、滑动页卡查看路线详情 埋点 */
        accessLogAppender("opt_navi_detail", Page.URL.getParameter("key"));
        _render(++currentStep);
      });
      // 上拉详细面版
      $pullup.on('click', function () {
        /* 点击页卡、滑动页卡查看路线详情 埋点 */
        accessLogAppender("opt_navi_detail", Page.URL.getParameter("key"));

        var index = currentStep;
        createDetailPage({ index: index });
        //_page.TrackDetail.show({index, rawPointList});
      });
    },
    close: function close() {
      $jqDOM.remove();
    },
    render: function render(index) {
      _render(index);
    }
  };
})(window.Page);