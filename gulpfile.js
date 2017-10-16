var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var autoprefixer = require('gulp-autoprefixer');
var clean = require('gulp-clean');


APPPATH = {
    root: './app/',
    css: './app/css',
    js: './app/js'
}

SOURCEPATH = {
    sassSource: './src/scss/',
    htmlSource: './src/*.html',
    jsSource: 'src/js/**'
}

gulp.task('styles', function(){
    gulp.src(SOURCEPATH.sassSource + 'main.scss')
        .pipe(autoprefixer())
        .pipe(sass())
        .pipe(gulp.dest(APPPATH.css))
        .pipe(browserSync.reload({stream: true}));

});

gulp.task('scripts-clean', function(){
    gulp.src(APPPATH.js + '/*.js', {read: false, force: true})
        .pipe(clean())
});

gulp.task('scripts', ['scripts-clean'], function(){
    gulp.src(SOURCEPATH.jsSource)
        .pipe(gulp.dest(APPPATH.js))
})

gulp.task('copy', function(){
    gulp.src(SOURCEPATH.htmlSource)
        .pipe(gulp.dest(APPPATH.root))
});

gulp.task('serve', function(){

    browserSync.init([APPPATH.css + '/*.css', APPPATH.root + '*.html', APPPATH.js + '*.js'], {
        server: {
            baseDir: APPPATH.root
        }
    });

    gulp.watch(SOURCEPATH.sassSource + '*.scss', ['styles']);
    gulp.watch([SOURCEPATH.htmlSource], ['copy']);
    gulp.watch([SOURCEPATH.jsSource], ['scripts']);

});

gulp.task('default', ['styles', 'serve', 'copy', 'scripts', 'scripts-clean']);