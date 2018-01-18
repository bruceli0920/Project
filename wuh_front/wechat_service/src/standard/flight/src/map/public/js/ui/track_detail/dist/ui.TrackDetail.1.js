'use strict';

(function (_page) {
    var html = '\n        <div class="track_detail">\n          <div class="slide_down_handle">\n            <img src="./public/img/info_list_pull_down.png" alt="" />\n          </div>\n          <div>\n          起点\n          </div>\n          <div>\n          详细路由\n          </div>\n          <div>\n          终点\n          </div>\n        </div>\n';
    var pointList = void 0;
    var rawPointList = void 0;
    var jqueryDOM = $(html);

    function _renderStart() {}
    function _renderRoute() {}
    function _renderLift() {}
    function _renderEnd() {}
    function _render() {}
    var jqueryDom = $(html);
    _page.TrackDetail = {
        show: function show(index, pointList) {
            $('body').append(jqueryDOM);
        },
        hide: function hide() {}
    };
})(window.Page);