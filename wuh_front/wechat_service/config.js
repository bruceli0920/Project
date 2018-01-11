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
module.exports = {
    basepath:obj.basepath, 
    baseDir:obj.baseDir,
    dest:(function(){ // 打包目录目的地
       return './'+obj.basepath+'/'+obj.baseDir+'/'; // ./build/wuh_wechat/
    }()),
    replaceStr:(function(){ // 分支中 替换路径 专用 意在将 分支中的代码 打包到 dest 下对应的目录
       return  obj.basepath+'/'+obj.baseDir;
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