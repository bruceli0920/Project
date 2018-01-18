(function (_page) {
    const html = `
        <div class="track_detail">
          <div class="slide_down_handle">
            <img src="./public/img/info_list_pull_down.png" alt="" />
          </div>
          <div>
          起点
          </div>
          <div>
          详细路由
          </div>
          <div>
          终点
          </div>
        </div>
`;
    let pointList;
    let rawPointList;
    let jqueryDOM = $(html);

    function _renderStart(){

    }
    function _renderRoute() {

    }
    function _renderLift() {

    }
    function _renderEnd() {

    }
    function _render() {

    }
    const jqueryDom = $(html);
    _page.TrackDetail = {
        show(index, pointList){
            $('body').append(jqueryDOM);
        },
        hide(){

        }
    }
})(window.Page);