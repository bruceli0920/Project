/**
 * Created by gaoletian on 16/6/12.
 */
(function (_page) {
  const htmlTemplate = `
<div class="ui-route-plan" id="ui-route-plan">
    <div class="header">
      <div id="nav_back" style="width: 40px; font-size: 30px;">
        <i class="fa fa-angle-left closeBtn" />
      </div>
      <div style="flex:1">
        路线规划
      </div>
      <div>
        <button id="btn_search" class="btn btn-blue">搜索</button>
      </div>
    </div>
    <!--form -->
    <div class="form">
      <div style="width: 50px;"  id="btn_swap">
        <img src='./public/img/swap.png' width='20px' height='64px'/>
      </div>
      <div style="flex:1; display: flex; flex-direction: column;">
        <input type="text"  data-type="start" placeholder="起点"/>
        <input type="text"  data-type="end" placeholder="终点"/>
      </div>
      <div  style="display: flex; flex-direction: column; width: 160px;">
          <a id="btn_pickup" data-type="start">地图选点</a>
          <a id="btn_pickup" data-type="end">地图选点</a>
      </div>
    </div>
    <!--err message -->
    <div id="errInfo" style="display: none"></div>
    <!--search result -->
    <div id="poilist">
    </div>

  </div>
  `
  const $jqDom = $(htmlTemplate),
    $search = $jqDom.find('#btn_search'),
    $back = $jqDom.find('#nav_back'),
    $swap = $jqDom.find('#btn_swap'),
    $pickup = $jqDom.find('#btn_pickup'),
    $errInfo = $jqDom.find('#errInfo'),
    $poilist = $jqDom.find('#poilist'),
    $input = $jqDom.find('input'),
    $start = $jqDom.find('input').eq(0),
    $end = $jqDom.find('input').eq(1);


  let _start = null,
    _end = null,
    _poiCache = [],
    _typeCache = 'start',
    _timer,
    _initState = false;

  function _swap() {
    [_start, _end] = [_end, _start];
    _setStart(_start);
    _setEnd(_end);
  }

  function _beginPlan() {
    $(".route_detail").remove();
    /* navi_req 埋点 */
    accessLogAppender("navi_req", Page.URL.getParameter("key"))

    if(!_start) {
      $errInfo.html('起点不能为空').show()
      return false
    }
    if(!_end) {
      $errInfo.html('终点不能为空').show()
      return false
    }

    try {
      window.Page.loading.show();
      Rtmap.TrackFactory.setStartPoiXY(_start.floor, _start.x, _start.y);
      Rtmap.TrackFactory.setEndPoiXY(_end.floor, _end.x, _end.y, (res) => {__onTrack(res)});
    } catch (e) {
    }
  }

  function _renderPoiList(_poilist) {
    _clearPoiList()
    if (!_poilist) {
      return
    }
    let result = _poilist.map((poi, index) => {
      return `<li data-index="${index}">${poi.name} --- ${poi.floor}</li>`
    })

    $poilist.html(result.join(''))
  }

  function _clearPoiList() {
    $poilist.html('')
  }

  function _searchPOI(keywords) {
    if (typeof keywords !== 'string' || !keywords) {
      return false
    }
    let url = 'http://lbsapi.rtmap.com/rtmap_lbs_api/v1/rtmap/associationsearch'
    let key = window.Page.URL.getParameter("key")
    let buildid = window.Page.URL.getParameter("buildid")
    let data = {key, keywords, buildid}

    $.post(url, JSON.stringify(data), function (res) {
      _poiCache = res.poilist
      _renderPoiList(res.poilist)
    })
  }

  function _delaySearchPOI(keywords) {
    if (_timer) {
      clearTimeout(_timer)
    }
    _timer = setTimeout(() => { _searchPOI(keywords) }, 600)
  }

  function _setStart(param) {
    _start = param
    let display_name = _start ? `${param.name}${param.hideFloor ? '': '---' + param.floor.toUpperCase()}` : ''
    $start.val(display_name)
  }

  function _setEnd(param) {
    _end = param
    let display_name = _end ? `${param.name}${param.hideFloor ? '': '---' + param.floor.toUpperCase()}` : ''
    $end.val(display_name)

    // 设置我的位置
    if (!_start) {
      let myLocation = Page.wechat.getLocaler()
      if (!!myLocation) {
        _setStart(_merge(myLocation,{name: '当前位置', hideFloor: true}))
      }
    }
  }

  function _merge(a,b){
    let res = {}
    Object.keys(a).forEach((key) => res[key] = a[key])
    Object.keys(b).forEach((key) => res[key] = b[key])
    return res
  }

  function _back() {
    /* opt_navi_setting_close 埋点 */
    accessLogAppender("opt_navi_setting_close", Page.URL.getParameter("key"))

    $(".rtmap_search_box").show();
    $(".floor_change_box").show();

    /* 清除路线和起始点 */
    Rtmap.TrackFactory.clearAll();
    _reset()
  }

  function _reset(){
    $jqDom.remove();
    [_start, _end, _initState] = [null, null, false];
    $start.val('');
    $end.val('');
    $errInfo.hide()
  }

  function _init() {
    $jqDom.appendTo('body')

    $search.click(() => _beginPlan());
    $back.click(() => _back());
    $swap.click(() => _swap());

    $input
      .keyup(function (event) {
        _delaySearchPOI($(this).val())
      })
      .focus(function () {
        _typeCache = $(this).attr('data-type')
        _typeCache === 'start' ? _setStart(): _setEnd()
      });

    $pickup.click(function() {
      $errInfo.hide();
      _clearPoiList()
      _toggle()
      /* 清除路线和起始点 */
      Rtmap.TrackFactory.clearAll()

      Page.Tip.set($(this).attr('data-type'))
    })

    $poilist.delegate('li', 'click', function () {
      let index = $(this).attr('data-index')
      let poi = _poiCache[index]
      _typeCache === 'start' ? _setStart(poi) : _setEnd(poi);
      $errInfo.hide();
      _clearPoiList()
    })
  }

  function _show(param) {
    let isDom = $('#ui-route-plan')
    if (isDom.length !== 1) {
      _init()
    }
    param.type === 'start' ? _setStart(param) : _setEnd(param)
    $jqDom.show()
  }

  function _toggle() {
    $jqDom.is(":visible") ? $jqDom.hide() : $jqDom.show()
  }

  function __onTrack (res) {
    _page.loading.hide();
    if (res.hasOwnProperty("statusText") || res.result.error_code != "0") {
      /* 路径规划失败 埋点 */
      accessLogAppender("navi_fail", Page.URL.getParameter("key"));
      alert("路径规划失败");
      return false
    }
    $jqDom.hide()
    /* 路径规划成功 埋点 */
    accessLogAppender("navi_success", Page.URL.getParameter("key"));

    window.__onTrackSuccess(res);
  }

  _page.RoutePlan = {
    show(param = null){ _show(param) },
    close(){ $jqDom.hide() },
    getStart() { return _start },
    getEnd() { return _end },
    toggle() { _toggle() }
  }

}(window.Page))