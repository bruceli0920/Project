var RTMAP_MAP_COLOR_CONFIG_ZHIHUITU = {
    "imageData": {
//        "190101":"./public/img/wc.png",
//        "190202":"./public/img/escalator.png"
//        "190206":"./public/img/doorway.png"
    },
    "globalData": {
        "canvas_color": "#ffffff",
        "font_color": "#872406",
        "start_icon_url": "",
        "end_icon_url": "",
        "focus_icon_url": "",
        "normal_icon_url": ""},
    "colorData": {
        0: {
            type: 0,
            fillColor: "#939393",       //填充颜色
            color: "#cccccc",           //边框颜色
            weight: 0.5,                  //边框宽度
            opacity: 1,                  //边框透明度
            fillOpacity: 1               //填充透明度
        },
        1: {
            type: 1,
            fillColor: "#e1f4f2",       //填充颜色
            color: "#777777",           //边框颜色
            weight: 0.5,                  //边框宽度
            opacity: 1,                  //边框透明度
            fillOpacity: 1               //填充透明度
        },
        2: {
            type: 2,
            fillColor: "#dfe7f7",       //填充颜色
            color: "#777777",           //边框颜色
            weight: 0.5,                  //边框宽度
            opacity: 1,                  //边框透明度
            fillOpacity: 1               //填充透明度
        },
        3: {
            type: 3,                  //楼梯天井
            fillColor: "#e8e8e8",       //填充颜色
            color: "#777777",           //边框颜色
            weight: 0.5,                  //边框宽度
            opacity: 1,                  //边框透明度
            fillOpacity: 1               //填充透明度
        },
        4: {
            type: 4,                //未添加区域
            fillColor: "#e8e8e8",       //填充颜色
            color: "#777777",           //边框颜色
            weight: 0.5,                  //边框宽度
            opacity: 1,                  //边框透明度
            fillOpacity: 1               //填充透明度
        },
        5: {
            type: 5,                 //poi
            fillColor: "#bad8c8",       //填充颜色
            color: "#648567",           //边框颜色
            weight: 0.5,                  //边框宽度
            opacity: 1,                  //边框透明度
            fillOpacity: 1,              //填充透明度,
            hover: {                    //图层 Hover 颜色 注：只有 type 5 有此属性。
                fillColor: "#dddddd",
                color: "#e9bbba",
                weight: 0.5,
                opacity: 1,
                fillOpacity: 1
            }
        },
        6: {
            type: 6,
            fillColor: "#dc7f7a",
            color: "#994f52",           //边框颜色
            weight: 0.5,                  //边框宽度
            opacity: 1,                  //边框透明度
            fillOpacity: 1,              //填充透明度,
        },
        7: {
            type: 7,                   //楼梯电梯
            fillColor: "#efe39c",
            color: "#ba9856",           //边框颜色
            weight: 0.5,
            opacity: 1,
            fillOpacity: 1
        },
        8: {
            type: 8,
            fillColor: "#e8e8e8",
            color: "#939393",           //边框颜色
            weight: 0.5,
            opacity: 0.5,
            fillOpacity: 0,
        },
        9: {
            type: 9,
            fillColor: "#fffffa",
            color: "#777777",           //边框颜色
            weight: 0.5,
            opacity: 1,
            fillOpacity: 1,
        },
        10: {
            type: 10,
            fillColor: "#adbce5",
            color: "#5c6d89",           //边框颜色
            weight: 0.5,
            opacity: 1,
            fillOpacity: 1
        },
        11: {
            type: 11,                   //停车场
            fillColor: "#f7ebe2",
            color: "#828282",           //边框颜色
            weight: 0.5,
            opacity: 1,
            fillOpacity: 1,
            dashArray: '3',
        },
        12: {
            type: 12,                //手机加油站／出入口
            fillColor: "#7f7f7f",
            color: "#474747",           //边框颜色
            weight: 0.5,
            opacity: 1,
            fillOpacity: 1,
        },
        13: {
            type: 13,
            fillColor: "#fffbf0",
            color: "#a0a0a0",           //边框颜色
            weight: 0.5,
            opacity: 0,
            fillOpacity: 0,
        },
        14: {
            type: 14,
            fillColor: "#fffbf0",
            color: "#a0a0a0",           //边框颜色
            weight: 0.5,
            opacity: 0,
            fillOpacity: 0,
        },
        15: {
            type: 15,
            fillColor: "#fffbf0",
            color: "#a0a0a0",           //边框颜色
            weight: 0.5,
            opacity: 0,
            fillOpacity: 0,
        }
    }
};

var RTMAP_MAP_COLOR_CONFIG_001 = [
    {
        type: 0,
        fillColor: "#cccccc",       //填充颜色
        color: "#cccccc",           //边框颜色
        weight: 0.5,                  //边框宽度
        opacity: 1,                  //边框透明度
        fillOpacity: 1               //填充透明度
    },
    {
        type: 1,                    //公共区
        fillColor: "#cccccc",       //填充颜色
        color: "#cccccc",           //边框颜色
        weight: 0.5,                  //边框宽度
        opacity: 1,                  //边框透明度
        fillOpacity: 1               //填充透明度
    },
    {
        type: 2,                    //控制区
        fillColor: "#cccccc",       //填充颜色
        color: "#cccccc",           //边框颜色
        weight: 0.5,                  //边框宽度
        opacity: 1,                  //边框透明度
        fillOpacity: 1               //填充透明度
    },
    {
        type: 3,                    //未知区
        fillColor: "#f1fcfe",
        color: "#f1fcfe",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 1
    },
    {
        type: 4,                    //无效区
        fillColor: "#f1eade",
        color: "#ddd5c5",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 1
    },
    {
        type: 5,                    //公共区POI
        fillColor: "#fffbf0",
        color: "#e9bbba",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 1,
        hover: {                    //图层 Hover 颜色 注：只有 type 5 有此属性。
            fillColor: "#dddddd",
            color: "#e9bbba",
            weight: 0.5,
            opacity: 1,
            fillOpacity: 1
        }
    },
    {
        type: 6,                    //卫生设施
        fillColor: "#add8aa",
        color: "#add8aa",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 1
    },
    {
        type: 7,                    //基础设施
        fillColor: "#cfef81",
        color: "#bad860",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 1
    },
    {
        type: 8,                    //外边框
        fillColor: "#cccccb",
        color: "#dfe7e0",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 0,
    },
    {
        type: 9,                    //停车区
        fillColor: "#fffbf0",
        color: "#e9bbba",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 1,
    },
    {
        type: 10,                   //控制区POI
        fillColor: "#f1fcfe",
        color: "#f1fcfe",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 1
    },
    {
        type: 11,                   //停车区POI
        fillColor: "#fffbf0",
        color: "#e9bbba",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 1,
    },
    {
        type: 12,                   //出入口
        fillColor: "#fffbf0",
        color: "#e9bbba",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 1,
    },
    {
        type: 13,
        fillColor: "#fffbf0",
        color: "#e9bbba",
        weight: 0.5,
        opacity: 0,
        fillOpacity: 0,
    },
    {
        type: 14,
        fillColor: "#fffbf0",
        color: "#e9bbba",
        weight: 0.5,
        opacity: 0,
        fillOpacity: 0,
    },
    {
        type: 15,
        fillColor: "#fffbf0",
        color: "#e9bbba",
        weight: 0.5,
        opacity: 0,
        fillOpacity: 0,
    }
];

