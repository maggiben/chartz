var gulp = require('gulp');
var sass = require('gulp-sass');
var bourbon = require('node-bourbon');
var cssnano = require('gulp-cssnano');
var sourcemaps = require('gulp-sourcemaps');

var path = {
  source:'public/app/src/**/*.js',
  html:'public/app/src/**/*.html',
  stylesheets:'public/sass/**/*.sass',
  css: 'public/stylesheets',
  output:'public/app/dist/',
  doc:'public/app/doc'
};


gulp.task('build', function() {
  return gulp.src(path.stylesheets)
    .pipe(sass({
      includePaths: bourbon.includePaths
    })
    .on('error', sass.logError))
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(cssnano())
    //.pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(path.css))
  //.pipe(notify({ message: 'Styles task complete', onLast: true }));
});