var gulp = require('gulp'); // gulp
var sass = require('gulp-sass');
var cleanCss=require('gulp-clean-css');
var uglify=require('gulp-uglify');
var rename=require('gulp-rename');
var prettify=require('gulp-html-prettify');
var fileinclude = require('gulp-file-include');
var template = require('gulp-template');
var browserSync = require('browser-sync');
var yargs = require('yargs').argv;
var sourcemaps = require('gulp-sourcemaps');

// var apiBase = 'http://airtest.rtmap.com/service-api/';
// var apiBase='http://weixin.cqa.cn/service-api/';
var apiBase = 'http://10.10.11.21:8989/api/'; // 默认测试接口
// wechat-service/config.js
// 可以通过 config.js中的配置控制某些行为
var globalConfig = global.wechatConfig || require('../../../../config');
// var apiBase='http://traffic.rtmap.com/service-api';// 默认测试链接
var commonStatic = 'http://airtest.rtmap.com/ckgWechat/'; // 静态资源获取链接 用于编译到当前目录下的build文件夹时 获取公共资源

//gulp --ss -w --pub test

//路径配置
var pathConfig = {
    server:{ // 启动服务相关配置
        root:__dirname+'/build',
        startPath: '/flight/portal.html'
    },
    basepath:__dirname+'/build', // 文件编译 指定根目录
    pageBase:'/flight/', // html中 base标签的 url 便于 引入静态资源 解决 js中跳转 页面的路径问题
    baseDir:'/flight/', // 输出到 根目录下的 文件夹的名称
    output:{ // 各个资源 对应的输出路径
        html:'/',
        js:'js/',
        css:'css/',
        images:'images/'
    },
    get:function(name){
        return this.basepath + this.baseDir + ( this.output[name] || '' );
    },
    replaceStr:globalConfig.replaceStr // 路径替换内容 将 应用打包到对应的位置
}
/**
 * 文件放到发布目录下
 */
function toRlsDir() {
    commonStatic = globalConfig.common;// 静态资源的获取 如重庆公众号，获取公共静态资源为： /ckgWechat/static/....
    pathConfig.basepath = __dirname.replace('src', pathConfig.replaceStr );// 放到 wechat目录下
    pathConfig.baseDir = '/'; // 连接 basepath 和  output字段之前的 斜线
    if( !!global.wechatConfig ){ // 设置 启动 外层服务的 初始化访问页面 gulp tracing --wechat:s --pub test --torls
        global.wechatConfig.startPath =globalConfig.common+'standard/flight/portal.html';
        console.log('toRlsDir');
    }
}

// 所有任务 执行前的 变量赋值 操作
gulp.task('flight:setValue',function() {
    if( yargs.pub ){ // 有 pub 参数
        switch(yargs.pub){
            case 'rls': // 发布
                pathConfig.pageBase = globalConfig.common+'standard/flight/';
                apiBase = 'http://weixin.cqa.cn/service-api/';
                // apiBase = 'http://weixin.cqa.cn/app/'; // app正式

                toRlsDir();
                // apiBase = '/service-api/';
                rlsStatus = true;
                console.log('进入发布状态');
                break;
            case 'dev': // 开发
                pathConfig.pageBase = globalConfig.common+'standard/flight/';
                apiBase='http://10.10.10.177:8080/service-api/'
                console.log('进入开发状态');
                break;
            case 'test': // 测试
                console.log('进入测试状态');
                toRlsDir();
                break;
        }
    }
    if( typeof yargs.pageBase ==='string' && !rlsStatus ){ //通过命令 设置页面的 base标签 url 用于外部 单独开启tracing 编译时 使用
         pathConfig.pageBase = yargs.pageBase;
         console.log( '页面base修改成 '+pathConfig.pageBase );
    }
    if( typeof yargs.apiBase ==='string' && !rlsStatus ){ //通过命令 设置 接口 请求头 用于外部单独开启tracing 编译时 使用
         api.apiBase = yargs.apiBase;
         console.log( '页面base修改成 '+api.apiBase );
    }
    if( typeof yargs.name ==='string' && !rlsStatus ){ // 通过命令 设置打包后的文件夹的名称 / 项目的名称
        if( yargs.name.charAt(0) !='/' ){
            yargs.name = '/'+yargs.name;
        }
        if( yargs.name.charAt(yargs.name.length -1) !='/' ){
            yargs.name = yargs.name+'/';
        }
         pathConfig.baseDir = yargs.name;
    }
    if( yargs.torls ){ // 设置编译文件 放到 最外层的 wechat中 用于 在 wechat中开启服务查看子功能的页面的操作
        pathConfig.pageBase = globalConfig.common+'standard/flight/';
        toRlsDir();
    }
    if( yargs.min ){ //用min命令控制代码压缩压缩  ' gulp --min '  开启代码压缩
       //compress = true;
       console.log( '开启代码压缩' );
    }

     if( yargs.ss ){ // 启动以wechat/build为根路径的服务
        // 修改 pageBase,修改代码打包位置
        pathConfig.pageBase = globalConfig.common+'standard/flight/';
        toRlsDir();
        // 修改启动服务的根路径
        pathConfig.server.root = __dirname.substring(0,__dirname.indexOf('src') )+globalConfig.serverRoot;
        console.log( '设置启动服务的根目录为:'+pathConfig.server.root );
        //修改根路径 到项目启始页的前缀
        pathConfig.server.startPath =globalConfig.common+'standard/flight/portal.html'; 
    }
    console.log('代码打包到 '+ pathConfig.basepath+pathConfig.baseDir+' 文件夹下');
});


//定义一个testLess任务（自定义任务名称）
gulp.task('flight:flightCss', function () {
    gulp.src(__dirname+'/src/sass/*.scss') //该任务针对的文件
        .pipe(sass())
        .pipe(cleanCss())
        .pipe(gulp.dest(pathConfig.get('css')))
        .pipe( browserSync.reload({stream:true}) ); //将会在src/css下生成index.css
});
gulp.task('flight:flightJs',function(){
	gulp.src(__dirname+'/src/js/*.js')
    .pipe(template({apiBase: apiBase}))
    .pipe( sourcemaps.init() ) 
	.pipe(uglify())
    .pipe( sourcemaps.write('./maps') )
	.pipe(gulp.dest(pathConfig.get('js')))
	.pipe( browserSync.reload({stream:true}) );
});
gulp.task('flight:flightHtml',function(){
	gulp.src([__dirname+'/src/*.html','!**/header.html'])
    .pipe(fileinclude({
      prefix:'@@',
      basepath:'@file'
    }))
    .pipe(template({common:commonStatic}))
	.pipe(prettify())
	.pipe(gulp.dest(pathConfig.get('html')))
	.pipe( browserSync.reload({stream:true}) );
});
gulp.task('flight:flightImages',function(){
	gulp.src(__dirname+'/src/images/**/*')
 	.pipe(gulp.dest(pathConfig.get('images')));
});
gulp.task('flight:server', function () {
    yargs.p = yargs.p || 3000;
    browserSync.init({
        server: {
            baseDir: pathConfig.server.root,
            index:'/portal.html'
        },
        port: yargs.p,
        startPath: pathConfig.server.startPath,
        browser: ["chrome"]
    });
});

gulp.task('flight:all',['flight:flightCss','flight:flightJs','flight:flightHtml','flight:flightImages']);

gulp.task('flight:watch', ['flight:all'], function () {
    gulp.watch(__dirname+'/src/sass/*.scss',['flight:flightCss']); 
    gulp.watch(__dirname+'/src/js/*.js',['flight:flightJs']);
    gulp.watch(__dirname+'/src/*.html', ['flight:flightHtml']);
    gulp.watch(__dirname+'/src/images/**/*', ['flight:flightImages']);
});

gulp.task('default',['flight:setValue','flight:flightCss','flight:flightJs','flight:flightHtml','flight:flightImages'],() => {
    if (yargs.s || yargs.ss ) {
        gulp.start('flight:server');
        console.log( '开启服务' );
    }
    if (yargs.w) {
        gulp.start('flight:watch');
    }
});

// 暴露接口
module.exports = {
  compile:function(){
    console.log('开始执行航班查询的编译!');
    yargs.pub = typeof yargs.pub ==='string' ? yargs.pub : 'rls';
    gulp.start('default');
  }
}