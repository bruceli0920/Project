var gulp = require('gulp'); // gulp
var gulpFlatten = require('gulp-flatten'); //
// var yargs = require('yargs').argv;
var browserSync = require('browser-sync');
var filter = require('gulp-filter'); // 过滤目录文件
var uglify = require('gulp-uglify'); // 压缩丑化js
// var template = require('gulp-template'); // 模板
var sass = require('gulp-sass');//处理css
// var sourcemaps = require('gulp-sourcemaps');
// var fileinclude = require('gulp-file-include');// 引入文件
var autoprefixer = require('gulp-autoprefixer');//根据设置浏览器版本自动处理浏览器前缀（尤其适合flex布局）

// 定义 wechatConfig 到 global 对象中 使所有 被 require的 js中 都能 访问到此变量
global.wechatConfig = require('./config');// 获取路径配置 可以将代码 根据配置打包到 指定的文件夹中
var link = wechatConfig.link;//公共链接 




// 编译 公共 css 文件
gulp.task('common:css', function () {
    console.log("开始执行公共css的压缩")
    gulp.src('./src/static/css/iframe.scss') //该任务针对的文件
        .pipe(sass({ outputStyle: 'compressed' })) //sass最终输出的样式风格
        .pipe(autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1']}))//gulp-autoprefixer的browsers参数详解，浏览器兼容
        .pipe(gulp.dest(wechatConfig.dest + '/static/css/')); //将会在这个目录下输出
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
    console.log(f)
    gulp.src('./src/static/js/rem.js')
        // .pipe(uglify())
        // .pipe(gulp.dest(dest_js));
        .pipe(f)
        // common中 通过 引入其它的 js 完成 功能的 合并 避免源代码 臃肿
        // .pipe(fileinclude({
        //     prefix:'@@',
        //     basepath:'@file'
        // }) )
        // .pipe(template(link)) // 替换公共的链接
        // .pipe( sourcemaps.init() ) 
        .pipe(uglify())
        // .pipe( sourcemaps.write('./maps') ) //sourcemap 写入 map文件夹中，sourcemap用于调试，只有 F12 debug模式下时 才会加载 sourcemap文件
        // .pipe(f.restore) // 将过滤的文件拿回来 移动到 指定位置 ps: .min.js结尾的文件不用压缩
        .pipe(gulp.dest(wechatConfig.dest + 'static/js/'));
});
gulp.task('common', ['common:css', 'common:js']);



















gulp.task('watch', function () {
    gulp.watch(src_css+'/**/*.css',['mincss']);
    gulp.watch(src_js+'/**/*.js',['minjs']);
});

gulp.task('default',function(){
    gulp.run('minjs','mincss');
    gulp.run('watch');
});