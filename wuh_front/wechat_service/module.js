var gulp = require('gulp');
var yargs = require('yargs').argv;

// 编译 航显屏
gulp.task('fids', function () {
  console.log('编译 fids ');
  var fids = require('./src/standard/fids/gulpfile');
  fids.compile();
  console.log('编译 fids  完成');
});

// 编译 航班详情
gulp.task('flight', function () {
  console.log('编译 flight ');
  var fids = require('./src/standard/flight/gulpfile');
  fids.compile();
  console.log('编译 flight  完成');
});

// 编译 重庆功能入口
gulp.task('entrance', function () {
  console.log('编译 entrance ');
  var entrance = require('./src/standard/entrance/gulpfile');
  entrance.compile();
  console.log('编译 entrance  完成');
});

module.exports = {
  task: ['fids','flight', 'entrance'] // 保持 entrance为最后一个
}