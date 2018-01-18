/**
 * Created by gaoletian on 16/5/26.
 */
(function (_page) {
  var html = `
        <div class="track_dashboard">
          <div class="pull_up_info_list">
            <img src="./public/img/info_list_pull_down.png" alt="" />
          </div>
          <div class="track_dashboard_content">
            <div class="numberofinstruction">1/1</div>
            <div class="leftinstruction ">
              <span class="track_arrow off rot180"></span>
            </div>
            <div class="dashboardList"></div>
            <div class="rightinstruction ">
              <span class="track_arrow off"></span>
            </div>
          </div>
        </div>
`;

  const $jqDOM = $(html),
    $pullup = $jqDOM.find('.pull_up_info_list'),
    $left = $jqDOM.find('.leftinstruction'),
    $right = $jqDOM.find('.rightinstruction'),
    $dash = $jqDOM.find('.dashboardList'),
    $step = $jqDOM.find('.numberofinstruction');

  let pointList,
    rawPointList,
    currentStep = 0;

  function _renderItem(data) {
    let hashDirection = window.hashDirection;
    let distance = Math.round(data.distance / 1000);
    let actionImage = hashDirection[data.action][0];
    let actionLable = hashDirection[data.action][1];
    let res = `
                <div class="dashboardList_item">
                    <div>
                        <img src="${actionImage}" alt="" />
                    </div>
                    <div style="text-align: left;">
                        <span>步行 ${distance} 米后</span>
                        <br>
                        <span>在 ${data.poi_name} 处${actionLable}</span>
                    </div>
                </div>
         `;
    $dash.html(res);
  }

  function _renderStep(a, b) {
    $step.text(`${a}/${b}`);
  }

  function _drawTrackLine(index) {
    let startP = index === 0 ? rawPointList[0] : pointList[index - 1];
    let endP = pointList[index];
    if (startP.floor !== endP.floor) {
      let originIndex = rawPointList.indexOf(endP);
      startP = rawPointList[originIndex - 1];
    }
    Rtmap.TrackFactory.drawCTrackLine(startP, endP, endP.floor);
    //console.log(startP,'\n', endP)
  }

  function _renderArrow() {
    let lclss = (currentStep === 0) ? 'track_arrow off rot180' : 'track_arrow on rot180';
    let rclss = (currentStep === pointList.length - 1) ? `track_arrow off` : `track_arrow on`;
    $left.html(`<i class="${lclss}"></i>`);
    $right.html(`<i class="${rclss}"></i>`);
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
    show(_pointList) {

      _page.controllerHelper.up("TrackDashboard"); // ? 这是干什么的????
      // 初始化状态
      _init()

      $('body').append($jqDOM);
      // 点集合
      rawPointList = _pointList.pointlist;
      pointList = rawPointList.filter((point) => point.important === 'true');

      // 初始渲染
      _render(currentStep)

      // 左箭头
      $left.on('click', () => {
        if (currentStep === 0) {
          return false;
        }
        /* 点击页卡、滑动页卡查看路线详情 埋点 */
        accessLogAppender("opt_navi_detail", Page.URL.getParameter("key"));

        _render(--currentStep);
      });
      // 右箭头
      $right.on('click', () => {
        if (currentStep === pointList.length - 1) {
          return false;
        }
        /* 点击页卡、滑动页卡查看路线详情 埋点 */
        accessLogAppender("opt_navi_detail", Page.URL.getParameter("key"));
        _render(++currentStep)
      });
      // 上拉详细面版
      $pullup.on('click', () => {
        /* 点击页卡、滑动页卡查看路线详情 埋点 */
        accessLogAppender("opt_navi_detail", Page.URL.getParameter("key"));

        let index = currentStep
        createDetailPage({index});
        //_page.TrackDetail.show({index, rawPointList});
      })
    },
    close() {
      $jqDOM.remove();
    },
    render(index){
      _render(index)
    }

  }

})(window.Page)