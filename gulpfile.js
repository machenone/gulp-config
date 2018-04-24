var gulp = require('gulp'),
    notify = require('gulp-notify'),
    sass = require('gulp-sass'),
    rename = require("gulp-rename"),
    autoprefixer = require('autoprefixer'),
    uglify = require('gulp-uglifyjs'),
    imagemin = require('gulp-imagemin'),
    coffeescript = require('gulp-coffee'),
    sprite = require('gulp.spritesmith'),
    livereload = require('gulp-livereload'),
    connect = require('gulp-connect'),
    htmlv = require('gulp-html-validator'),
    pug = require('gulp-pug'),
    watch = require('gulp-watch'),
    postcss = require('gulp-postcss'),
    uncss = require('postcss-uncss'),
    focus = require('postcss-focus'),
    cssnano = require('cssnano'),
    clearfix = require('postcss-clearfix'),
    wiredep = require('wiredep').stream,
    imageminJpg = require('imagemin-jpeg-recompress'),
    imageminPng = require('imagemin-pngquant');
////
function wrapPipe(taskFn) {
    return function(done) {
        var onSuccess = function() {
                done();
            },
            onError = function(err) {
                done(err);

            },
            outStream = taskFn(onSuccess, onError);
        if (outStream && typeof outStream.on === 'function') {
            outStream.on('end', onSuccess);
        }
    };
}
//
/* TASKS */

gulp.task('style-main', function() {
    return gulp.src('src/sass/style.scss')
        .pipe(sass().on('error', notify.onError(function(error) {
            return 'An error occurred while compiling style files.\nLook in the console for details.\n' + error;
        })))
        .pipe(gulp.dest('dist/css'))
        .pipe(notify('The main-styles are ready!'));
});

gulp.task('style-js', function() {
    var plugins = [autoprefixer({
        browsers: ['last 10 versions'],
        cascade: false
    }), focus(), clearfix()];
    return gulp.src('src/sass/js-style.scss')
        .pipe(sass().on('error', notify.onError(function(error) {
            return 'An error occurred while compiling style files.\nLook in the console for details.\n' + error;
        })))
        .pipe(postcss(plugins))
        .pipe(gulp.dest('dist/css'))
        .pipe(notify('The js-styles are ready!'));
});
gulp.task('style-prod', function() {
    var plugins = [uncss({
        html: ['dist/*.html'],
        ignore: ['j_*', '.fade', '.fade.in', '.collapse', '.collapse.in', '.collapsing', '.alert-danger']
    }), autoprefixer({
        browsers: ['last 10 versions'],
        cascade: false
    }), focus(), clearfix(), cssnano()];
    return gulp.src('src/sass/style.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(plugins))
        .pipe(gulp.dest('dist/css/'))
        .pipe(notify('Styles are ready to go into production!'));
});

gulp.task('script', wrapPipe(function(success, error) {
    return gulp.src(['src/js/*.js'])
        // return gulp.src(['src/coffee/*.coffee'])
        // .pipe(coffeescript({ bare: true }))
        .pipe(uglify('built.js', {
            mangle: false,
            output: {
                // beautify: true
            }
        })).on('error', error)
        .pipe(gulp.dest('dist/js'))
        .pipe(notify('The scripts are ready!'))
        .pipe(connect.reload());
}));

gulp.task('images', function() {
    return watch('src/img/**/*', {})
        .pipe(imagemin(
            [imageminJpg({
                quality: 'medium'
            }), imageminPng()], { verbose: true }
        ))
        .pipe(gulp.dest('dist/img'))
        .pipe(notify('The images are ready!'))
        .pipe(connect.reload());
});

gulp.task('sprites', function() {
    return watch('src/dist/s_*.png', function() {
        var spriteData = gulp.src('dist/img/s_*.png').pipe(sprite({
            cssName: '_sprites.scss',
            algorithm: 'diagonal',
            imgName: 'spr.png'
        }));
        spriteData.img.pipe(gulp.dest('dist/css'));
        spriteData.css.pipe(gulp.dest('src/sass/assets'));
    });

});

gulp.task('sprite', function() {
    var spriteData = gulp.src('dist/img/s_*.png').pipe(sprite({
        cssName: '_sprites.scss',
        algorithm: 'diagonal',
        imgName: 'spr.png'
    }));
    spriteData.img.pipe(gulp.dest('dist/css/'));
    spriteData.css.pipe(gulp.dest('src/sass/assets/'));
});

gulp.task('html', function() {
    gulp.src('src/pug/*.pug')
        .pipe(pug({
            pretty: true
        }).on('error', notify.onError(function(error) {
            return 'An error occurred while compiling pug.\nLook in the console for details.\n' + error;
        })))
        .pipe(gulp.dest('dist/'))
        .pipe(notify('The html-files are ready!'))
        .pipe(connect.reload());
});

gulp.task('html-prod', function() {
    gulp.src('src/pug/*.pug')
        .pipe(pug({}))
        .pipe(gulp.dest('dist/'))
        .pipe(connect.reload());
});

gulp.task('connect', function() {
    connect.server({
        root: 'dist/',
        livereload: true
    });
});

gulp.task('bower', function() {
    gulp.src('dist/index.html')
        .pipe(wiredep({
            directory: "dist/bower_components"
        }))
        .pipe(gulp.dest('./dist'))
        .pipe(connect.reload());
});

/* WATCHER TASK */

gulp.task('watch', function() {
    gulp.watch(['src/pug/*.pug', 'src/pug/assets/*.pug'], ['html']);
    gulp.watch(['src/prod.marker'], ['html-prod', 'style-prod']);
    gulp.watch(['src/sass/style.scss', 'src/sass/assets/*.scss'], ['style-main']);
    gulp.watch(['src/sass/js-style.scss', 'src/sass/assets/*.scss'], ['style-js']);
    gulp.watch(['dist/img/s_*'], ['sprite']);
    gulp.watch('src/js/*.js', ['script']);
    //gulp.watch('dist/bower_components/', ['bower']);
});

gulp.task('default', ['connect', 'watch', 'images', 'sprites']);