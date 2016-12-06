var gulp = require('gulp');
var concat = require('gulp-concat');
var copy = require('gulp-copy');
var clean = require('gulp-clean');
var merge = require('merge-stream');
var less = require('gulp-less');
var rename = require('gulp-rename');

var buildPath = '../../resources/public/';

gulp.task('default', ['clean', 'build', 'merge-base', 'less']);

gulp.task('clean', function(){
   return gulp.src(buildPath, {read:false})
       .pipe(clean({force:true}));
});

gulp.task('build', ['clean'], function(){
    return gulp.src(['js/app.js',
                'js/models.js',
                'js/appController.js',
                'js/*'])
        .pipe(concat('app.js'))
        .pipe(gulp.dest(buildPath + 'js'));
});

gulp.task('merge-base', ['clean'], function(){
    return merge(
        gulp.src('lib/flatui/fonts/**/*')
            .pipe(gulp.dest(buildPath + 'fonts')),
        gulp.src('lib/flatui/img/**/*')
            .pipe(gulp.dest(buildPath + 'img')),
        gulp.src('lib/flatui/dist/js/**/*')
            .pipe(gulp.dest(buildPath + 'js')),
        gulp.src('html/**/*')
            .pipe(gulp.dest(buildPath)),
        gulp.src(['bower_components/angular/angular.*',
                    'bower_components/angular-resource/angular-resource.*',
                    'bower_components/angular-route/angular-route.*',
                    'bower_components/bootstrap/dist/js/bootstrap.min.js',
                    'bower_components/moment/min/moment.min.js',
                    'bower_components/jquery-ui/jquery-ui.js'])
            .pipe(gulp.dest(buildPath + 'js'))
    );
});

gulp.task('less', ['clean'], function(){
    return merge(
        gulp.src('bower_components/bootstrap/less/bootstrap.less')
            .pipe(less('bootstrap.css'))
            .pipe(gulp.dest(buildPath + 'css')),
        gulp.src('lib/flatui/less/flat-ui-pro.less')
            .pipe(less())
            .pipe(rename('ui.css'))
            .pipe(gulp.dest(buildPath + 'css')),
        gulp.src('less/site.less')
            .pipe(less('site.css'))
            .pipe(gulp.dest(buildPath + 'css'))
    );
});