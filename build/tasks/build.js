var gulp = require('gulp');
var runSequence = require('run-sequence');
var to5 = require('gulp-babel');
var paths = require('../paths');
var compilerOptions = require('../babel-options');
var assign = Object.assign || require('object.assign');
var rollup = require("rollup").rollup;
var rollupMultiEntry = require("rollup-plugin-multi-entry");

var jsName = paths.packageName + '.js';

gulp.task("rollup", function(done) {
    rollup({
        entry:   paths.source,
        dest:    paths.output + jsName,
        plugins: [rollupMultiEntry()]
    })
    .then(function(bundle) {
        bundle.write({
            dest: paths.output + jsName
        });
        console.log('Build complete');
    })
    .catch(function(err) {
        console.log('rollup error');
        console.log(err);
    })
    .then(done, done);
});

gulp.task('build-es2015', function () {
    return gulp.src(paths.output + jsName)
        .pipe(to5(assign({}, compilerOptions.es2015())))
        .pipe(gulp.dest(paths.output + 'es2015'));
});

gulp.task('build-commonjs', function () {
    return gulp.src(paths.output + jsName)
        .pipe(to5(assign({}, compilerOptions.commonjs())))
        .pipe(gulp.dest(paths.output + 'commonjs'));
});

gulp.task('build-amd', function () {
    return gulp.src(paths.output + jsName)
        .pipe(to5(assign({}, compilerOptions.amd())))
        .pipe(gulp.dest(paths.output + 'amd'));
});

gulp.task('build-system', function () {
    return gulp.src(paths.output + jsName)
        .pipe(to5(assign({}, compilerOptions.system())))
        .pipe(gulp.dest(paths.output + 'system'));
});

gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    'rollup',
    ['build-es2015', 'build-commonjs', 'build-amd', 'build-system'],
    callback
  );
});
