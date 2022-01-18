console.log('running gulp file')

var gulp = require('gulp');

//included gulp plugins
//var uglifyjs = require('uglify-es'); 
//var composer = require('gulp-uglify/composer');
//var uglify = composer(uglifyjs, console);
//var sourcemaps = require('gulp-sourcemaps');
var include = require('gulp-include');
var sass = require('gulp-sass');


//js task - combines and minimizes js files in /scripts directory
gulp.task("js", function(done) {
  gulp.src('js/*.js')
    //.pipe(sourcemaps.init())
    .pipe(include())
      .on('error', console.log)
    //.pipe(uglify({compress: {drop_console: false }}))
    //  .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
    //.pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest("public/js"));
    
    done();
});

//css task - processes sass and minimizes scss files in /sass directory
gulp.task("css", function(done) {
  gulp.src('sass/*.scss')
    //.pipe(sourcemaps.init())
  //.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(sass({outputStyle: 'nested'}).on('error', sass.logError))
    //.pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest("public/css"));
    
    done();
});


//start watchers 
gulp.task('watch', function(){
    //watch scripts folder for changes in any files
    gulp.watch('js/**/*.js', gulp.series('js')); 
    
    //watch sass folder for changes in any files
    gulp.watch('sass/**/*.scss', gulp.series('css')); 
    
});


//the one task to rule them all
gulp.task('default',
	gulp.series(
		'css',
		'js'
	)
);

