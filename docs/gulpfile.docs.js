const {exec} = require('node:child_process');
const path = require('node:path');

const browserSync = require('browser-sync').create();
const {watch, series, parallel} = require('gulp');

const DIST_PATH = '../dist-docs';

function build(cb) {
    exec('npm run docs:build', (err, stdout, stderr) => {
        process.stdout.write(stdout);
        process.stdout.write(stderr);
        cb(err);
    });
}

function serve(cb) {
    browserSync.init({server: path.resolve(DIST_PATH), port: 7007});
    cb();
}

function reload(cb) {
    browserSync.reload();
    cb();
}

function watchFiles() {
    watch(['./diplodoc/**/*', './src/**/*', '../src/**/*'], series(build, reload));
}

exports.default = series(build, parallel(serve, watchFiles));
