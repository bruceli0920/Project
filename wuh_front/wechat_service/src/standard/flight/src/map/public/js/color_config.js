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
            fillColor: "#ffffff",       //填充颜色
            color: "#777777",           //边框颜色
            weight: 0.5,                  //边框宽度
            opacity: 1,                  //边框透明度
            fillOpacity: 1               //填充透明度
        },
        1: {
            type: 1,
            fillColor: "#ffffff",       //填充颜色
            color: "#777777",           //边框颜色
            weight: 0.5,                  //边框宽度
            opacity: 1,                  //边框透明度
            fillOpacity: 1               //填充透明度
        },
        2: {
            type: 2,
            fillColor: "#f6f6f6",       //填充颜色
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
            fillColor: "#f4f4f4",       //填充颜色
            color: "#777777",           //边框颜色
            weight: 0.5,                  //边框宽度
            opacity: 1,                  //边框透明度
            fillOpacity: 1               //填充透明度
        },
        5: {
            type: 5,                 //poi
            fillColor: "#d8e0ca",       //填充颜色
            color: "#97a869",           //边框颜色
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
            fillColor: "#ead6d6",
            color: "#ba9d9d",           //边框颜色
            weight: 0.5,                  //边框宽度
            opacity: 1,                  //边框透明度
            fillOpacity: 1,              //填充透明度,
        },
        7: {
            type: 7,                   //楼梯电梯
            fillColor: "#efefef",
            color: "#6e6e6e",           //边框颜色
            weight: 0.5,
            opacity: 1,
            fillOpacity: 1
        },
        8: {
            type: 8,
            fillColor: "#cccccb",
            color: "#878c93",//"#dfe7e0",           //边框颜色
            weight: 1,
            opacity: 0.9,
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
            fillColor: "#d0dee2",
            color: "#8eabc1",           //边框颜色
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
            fillColor: "#efefef",
            color: "#6e6e6e",           //边框颜色
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
        fillColor: "#ffffff",       //填充颜色
        color: "#777777",           //边框颜色
        weight: 0.5,                  //边框宽度
        opacity: 1,                  //边框透明度
        fillOpacity: 1               //填充透明度
    },
    {
        type: 1,                    //公共区
        fillColor: "#ffffff",       //填充颜色
        color: "#777777",           //边框颜色
        weight: 0.5,                  //边框宽度
        opacity: 1,                  //边框透明度
        fillOpacity: 1               //填充透明度
    },
    {
        type: 2,                    //控制区
        fillColor: "#f6f6f6",       //填充颜色
        color: "#777777",           //边框颜色
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
        fillColor: "#f4f4f4",
        color: "#777777",
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
        fillColor: "#ead6d6",
        color: "#ba9d9d",
        weight: 0.5,
        opacity: 1,
        fillOpacity: 1
    },
    {
        type: 7,                    //基础设施
        fillColor: "#efefef",
        color: "#6e6e6e",
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

