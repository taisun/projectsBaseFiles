'use strict';

var gulp = require('gulp');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var sprite = require('gulp.spritesmith');
var $ = require('gulp-load-plugins')();

var rootpath = 'app/',
    paths = {
        sass: rootpath+'sass/',
        css: rootpath+'css/',
        js: rootpath+'js/',
        imgsrc: rootpath+'img/src',
        imgdest: rootpath+'img/dest'
    };

gulp.task('serve', function() {
  gulp.src('./')
    .pipe($.webserver({
      livereload: true,
      port: 9000,
    }));
});

gulp.task('sass', function () {
    var sassOption = {
        style: 'expanded'
    };
    return $.rubySass('app/sass/styles.scss', sassOption)
            .on('error', function (err) {
                $.notify.onError('Error: <%= err.message %>');
            })
            .pipe($.plumber({
                 errorHandler: $.notify.onError("Error: <%= error.message %>")
            }))
            .pipe($.autoprefixer( {browser: ['last 3 version', 'ie >= 8', 'Android 4.0']}))
            .pipe(gulp.dest('app/css'));
});

gulp.task('cssconcat', function () {
    var files = [
        'app/css/styles.css',
        'app/css/lightbox.css',
        'app/css/jquery.bxslider.css'
    ];
    return gulp.src(files)
        .pipe($.concat('main.css'))
        .pipe(gulp.dest('app/css/'));
});

gulp.task('cssmin', function () {
    return gulp.src('app/css/main.css')
        .pipe($.minifyCss({keepBreaks:true}))
        .pipe(gulp.dest('app/css/dest/'))
        .pipe($.notify("Compilation checking finish cssmin."));
});

gulp.task('hologram', function(){
        return gulp.src('config.yml')
            .pipe($.hologram())
            .pipe(reload({stream:true}));
});
gulp.task('styles', ['sass', 'hologram'], function () {
    return gulp.src('app/css/dest/styles.css')
                .pipe($.csslint())
                .pipe($.csslint.reporter())
                .pipe($.notify("Compilation checking finish cssLint."))
                .pipe(reload({stream:true}));

});
gulp.task('scripts', ['jsconcat', 'jsmin'], function () {
    return gulp.src('app/js/**/*.js')
        .pipe($.plumber({
             errorHandler: $.notify.onError("Error: <%= error.message %>")
        }))
        .pipe($.jshint())
        .pipe($.jshint.reporter(require('jshint-stylish')))
        .pipe($.plato('report', {
            jshint: {
                options: {
                    strict: true
                }
            },
            complexity: {
                trycatch: true
            }
        }))
        .pipe($.size());
});

gulp.task('jsconcat', function(){
    var jsfiles = [
        'app/js/lib/jquery.min.js',
        'app/js/lib/jquery.bxslider.min.js',
        'app/js/lib/lightbox.min.js',
        'app/js/common.js'
    ];
    return gulp.src(jsfiles)
        .pipe($.concat('main.js'))
        .pipe(gulp.dest('app/js/'));
 });
gulp.task('jsmin', function(){
    return gulp.src('app/js/main.js')
        .pipe($.uglify({preserveComments:'some'}))
        .pipe(gulp.dest('app/js/dest/'));
});
gulp.task('ts', function () {
    return gulp.src('app/ts/**/*.ts')
        .pipe($.plumber({
            errorHandler: $.nostify.onError("Error: <%= error.message %>")
        }))
        .pipe($.typescript())
        .pipe(gulp.dest('app/scripts'));
});

gulp.task('imagemin', function(){
  var srcGlob = 'app/img/src/**/';
  var dstGlob = 'app/img/dest/';
  var imageminOptions = {
    progressive: true,
    optimizationLevel: 7
  };

  return gulp.src( srcGlob )
    .pipe($.imagemin( imageminOptions ))
    .pipe(gulp.dest( dstGlob ));
});

gulp.task('sprite', function(){
  var srcGlob    = 'app/img/src/icn/*.png';
  var dstImgGlob = 'app/img/dest/';
  var dstCssGlob = 'app/css';

  var spriteOptions = {
    imgName : '../../img/dest/sprite.png',
    cssName : 'sprite.css',
    padding: 20,
    algorithm: 'binary-tree'
  };

  var spriteData = gulp.src(srcGlob)
    .pipe(sprite(spriteOptions));

  spriteData.css
    .pipe(gulp.dest(dstCssGlob));

  spriteData.img
    .pipe(gulp.dest(dstImgGlob));
});

gulp.task('build', function(){
    var list = [
        'app/docs/*.ejs',
        'app/docs/business/*.ejs',
        'app/docs/company/*.ejs',
        'app/docs/contact/*.ejs',
        'app/docs/example/*.ejs',
        'app/docs/mission/*.ejs'
    ];
    return gulp.src(list)
        .pipe($.ejs())
        .pipe(gulp.dest('app/dest/'))
        .pipe($.notify("Compilation checking build EJS."))
        .pipe(reload({stream:true}));
});

gulp.task('watch', ['serve', 'styles', 'build', 'scripts'], function () {
    var server = $.livereload();

    gulp.watch('app/sass/**/*.scss', ['styles']);
    gulp.watch('app/scripts/**/*.js', ['scripts']);
    gulp.watch('app/ts/**/*.ts', ['ts']);
    //gulp.watch('app/img/**/*.+(jpg|jpeg|png|gif|svg)', ['imagemin']);
    gulp.watch('app/sass/style.css', ['hologram']);
    gulp.watch('app/docs/*.ejs', ['build']);
    gulp.watch([
        'app/styles/**/*.css',
        'app/sass/**/*.scss',
        'app/scripts/**/*.js',
        'app/ts/**/*.ts',
        'app/img/**/*.+(jpg|jpeg|png|gif|svg)'
    ]).on('change', function (file) {
        server.changed(file.path);
    });

});