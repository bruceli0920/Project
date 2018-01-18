var gulp = require('gulp'); // gulp
var gulpFlatten = require('gulp-flatten'); //
var yargs = require('yargs').argv;
var browserSync = require('browser-sync');//浏览器同步插件
var filter = require('gulp-filter'); // 过滤目录文件
var uglify = require('gulp-uglify'); // 压缩丑化js
var template = require('gulp-template'); // 模板
var sass = require('gulp-sass');//处理css
var sourcemaps = require('gulp-sourcemaps');//生成文件到源文件的一个映射
var fileinclude = require('gulp-file-include');// 引入文件(代码复用)
var autoprefixer = require('gulp-autoprefixer');//根据设置浏览器版本自动处理浏览器前缀兼容（尤其适合flex布局）

// 定义 wechatConfig 到 global 对象中 使所有 被 require的 js中 都能 访问到此变量
global.wechatConfig = require('./config');// 获取路径配置 可以将代码 根据配置打包到 指定的文件夹中
var link = wechatConfig.link;//公共链接 

var moduleTask = require('./module');
gulp.task('moduleTask', moduleTask.task);


// 控制命令接收后的相关操作
gulp.task('wechat:setValue',function(){
    // 开启一组任务 适合只想打包 2个以上 但又不是全部的情况 命令如： gulp --group shopping,tracing,flight
        // 启动某个功能 并 开启 wechat:server 示例： gulp --group tracing --wechat:s --pub test --torls   ps:( torls 自己定义的 )
        if (typeof yargs.group === 'string') {
            var arr = yargs.group.split(',');
            for (var i = 0, l = arr.length; i < l; i++) {
                gulp.start(arr[i]);
            }
        }
        // 设置开启服务 ps: 开启服务放到最后等待 子功能中 给 global.wechatConfig.startPath 赋值 以打开对应的页面
        if (yargs['wechat:s']) { // gulp --wechat:s 开启服务 gulp --wechat:s 8080 开启服务并设置服务端口
            gulp.start('wechat:server');
        }
        if( typeof yargs['wechat:domain'] ==='string' ){ // 改变公共接口的域名用于本地测试
            link.domain = yargs['wechat:domain']; 
        }
    });


// gulp common 打包公共静态资源
gulp.task('common', ['wechat:setValue','common:js', 'common:css','common:images','common:vendor']); // 不做 deault 的依赖 调用时 直接  gulp common 打包公共静态资源 避免每次都处理

// 编译 公共 css 文件
gulp.task('common:css', function () {
    console.log("开始执行公共css的压缩")
    gulp.src('./src/static/css/**/*.scss') //该任务针对的文件
        .pipe(sass({ outputStyle: 'compressed' })) //sass最终输出的样式风格
        .pipe(autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1']}))//gulp-autoprefixer的browsers参数详解，浏览器兼容
        .pipe(gulp.dest(wechatConfig.dest + '/static/css/')); //将会在这个目录下输出
    console.log(wechatConfig.dest + 'static/css/')
});
//编译公共的 js 文件
gulp.task('common:js', function () {
    console.log("开始执行公共js的压缩")
    // 符号含义
    // * 匹配任意长度的字符串 不包括 /
    // ? 匹配任意单个字符 不包括 /
    // ** 匹配任意长度的字符串 包括 /
    // ! 放在 匹配表达时的开始位置 作为一个过滤的表达式
    var f = filter(['**/*.js', '!**/*.min.js'], { restore: true });// 过滤 不是以 .min.js 结尾的 js文件 restore=true 保存被过滤的文件
    gulp.src('./src/static/js/**/*.js')
        .pipe(f)
        //common中 通过 引入其它的 js 完成 功能的 合并 避免源代码 臃肿
        .pipe(fileinclude({
            prefix:'@@',
            basepath:'@file'
        }) )//代码复用
        .pipe(template(link)) // 替换公共的链接
        .pipe( sourcemaps.init() ) //代码映射
        .pipe(uglify())//压缩js
        .pipe( sourcemaps.write('./maps') ) //sourcemap 写入 map文件夹中，sourcemap用于调试，只有 F12 debug模式下时 才会加载 sourcemap文件
        .pipe(f.restore) // 将过滤的文件拿回来 移动到 指定位置 ps: .min.js结尾的文件不用压缩
        .pipe(gulp.dest(wechatConfig.dest + 'static/js/'));
});
// 处理公共 images 资源
gulp.task('common:images', function () {
    console.log("开始执行公共image的压缩")
    gulp.src('./src/static/images/**/*.*')
        .pipe(gulp.dest(wechatConfig.dest + 'static/images/'));
});
// 移动第三方厂商提供的资源文件 如:jquery 等 
gulp.task('common:vendor', function () {
    console.log("开始执行第三方文件的压缩")
    gulp.src('./src/static/vendor/**/*.*')
        .pipe(gulp.dest(wechatConfig.dest + 'static/vendor/'));
});



//配置 server 查看全部功能 
gulp.task('wechat:server', function () { // 若引入的 gulpfile中 有 server task 后引入的 task 若和之前的名字相同会进行覆盖因此修改server名字
    var port = typeof yargs['wechat:s'] === 'number' ? yargs['wechat:s'] : 3000;
    // console.log('wechat server ', global.wechatConfig)
    browserSync.init({
        server: {
            // baseDir: './' + wechatConfig.basepath + '/' + wechatConfig.baseDir+'/standard/demo', // 启动服务的目录 默认 index.html    
            baseDir: wechatConfig.serverRoot,
            index: 'index.html'// 自定义启动文件名
        },
        port: port,
        startPath: global.wechatConfig.startPath || '/', // startPath 在每个子功能中进行赋值 用于启动服务时直接 打开某个功能的入口页面
        browser: ["chrome"]
    });
});


gulp.task('default',['wechat:setValue'], () => {

});













// gulp.task('watch', function () {
//     gulp.watch(src_css+'/**/*.css',['mincss']);
//     gulp.watch(src_js+'/**/*.js',['minjs']);
// });

// gulp.task('default',function(){
//     gulp.run('minjs','mincss');
//     gulp.run('watch');
// });