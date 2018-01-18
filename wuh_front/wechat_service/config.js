// config.js 配置 整体代码打包位置
// 首都 wechat 公众号 打包后的代码直接部署在域名之下 包括 standard,activity,static,因此内部的功能访问公共资源static时 直接 /static/... 就可以获取到资源了
// 重庆公众号的部署：由于首都的公众号项目以部署到根域名下，因此重庆公众号的部署 必须用一个文件夹包裹资源部署才可以进行区分
// 这时 内部的功能获取公共资源时 就应该用  /包裹的文件夹/static/...  来获取
// 为了统一控制 公众号下 用于发布时公共资源的获取 及 服务启动的测试
// 将配置放到此文件中，然后在内部所有功能中 通过 require的形式进行引入 来进行控制,这也给其它的流程或内容控制提供了可能
// 如：统一控制 接口的域名 ，如 traffic.rtmap.com 的功能想访问 weixin.bcia.com.cn下的接口 (正常资源和接口在一台服务器接口可以用 /aup/api/.. (==http://weixin.bcia.com.cn/aup/api/...)的形式进行获取)

var obj = {
    basepath:'build',//代码压缩到build下 
    baseDir:'wyh_wechat' //代码压缩到build下的根目录
}

// 两种配置 
// 1. 以 basepath为根目录启动服务 适合项目发不到 域名+ baseDir 下
// 2. 以 basepath+'/'+baseDir 为启动目录 适合发布到 域名的根目录下 
// serverRoot 的配置 影响 内部功能 公共资源 static的获取 和 base标签 href的替换问题
var serverRoot = obj.basepath; // 启动服务的根目录 build || build/wechat ,basepath || basepath/baseDir

module.exports = {
    basepath:obj.basepath, 
    baseDir:obj.baseDir,
    dest:(function(){ // 打包目录目的地
       return './'+obj.basepath+'/'+obj.baseDir+'/'; // ./build/wuh_wechat/
    }()),
    replaceStr:(function(){ // 分支中 替换路径 专用 意在将 分支中的代码 打包到 dest 下对应的目录
       return  obj.basepath+'/'+obj.baseDir;
    }()),
    // replaceStr: (function () { // 分支中 替换路径 专用 意在将 分支中的代码 打包到 dest 下对应的目录
    //     return obj.basepath + '/' + obj.baseDir;
    // }()),

    serverRoot: serverRoot,
    common: (function () { // 内部功能 获取公共资源 和 base标签的前缀
        var result = '/';
        if (serverRoot === obj.basepath) {
            result += obj.baseDir + '/';
        }
        return result;
    }()),


    link:{ // 公共的链接
        domain:'http://weixin.bcia.com.cn', // http://traffic.rtmap.com(:8081) 域名 测试时可以通过修改此参数 避免本地启动服务访问不到对应的服务 
        log:{
            page:'/aup/api/log/pageAction',// 普通页面日志
            activity:'/aup/api/log/promoLog' //活动页面日志
        },
        signature:'http://traffic.rtmap.com/aup/api/wechat/jssdk/signature', //签名服务    
        cardext:'/aup/api/wechat/card/cardExt',
        homeUrl:'/standard/entrance/portal.html'
    }
}