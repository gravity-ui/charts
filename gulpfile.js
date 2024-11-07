const path = require('node:path');

const {task, src, dest, series, parallel} = require('gulp');
const sass = require('gulp-dart-sass');
const replace = require('gulp-replace');
const ts = require('gulp-typescript');
const rimraf = require('rimraf');

const BUILD_DIR = path.resolve('dist');

task('clean', (done) => {
    rimraf.sync(BUILD_DIR);
    done();
});

function compileTs(modules = false) {
    const tsProject = ts.createProject('tsconfig.json', {
        declaration: true,
        ...(modules ? undefined : {verbatimModuleSyntax: false}),
        module: modules ? 'esnext' : 'NodeNext',
        moduleResolution: modules ? 'bundler' : 'NodeNext',
    });

    return src([
        'src/**/*.{ts,tsx}',
        '!src/demo/**/*',
        '!src/**/__stories__/**/*',
        '!src/**/__tests__/**/*',
        '!src/**/*.test.{ts,tsx}',
    ])
        .pipe(replace(/import '.+\.scss';/g, (match) => match.replace('.scss', '.css')))
        .pipe(tsProject())
        .pipe(dest(path.resolve(BUILD_DIR, modules ? 'esm' : 'cjs')));
}

task('compile-to-esm', () => {
    return compileTs(true);
});

task('compile-to-cjs', () => {
    return compileTs();
});

task('copy-i18n', () => {
    return src(['src/**/i18n/*.json'])
        .pipe(dest(path.resolve(BUILD_DIR, 'esm')))
        .pipe(dest(path.resolve(BUILD_DIR, 'cjs')));
});

task('styles', () => {
    return src(['src/**/*.scss', '!src/demo/**/*', '!src/**/__stories__/**/*'])
        .pipe(sass({includePaths: ['./node_modules/']}).on('error', sass.logError))
        .pipe(dest(path.resolve(BUILD_DIR, 'esm')))
        .pipe(dest(path.resolve(BUILD_DIR, 'cjs')));
});

task(
    'build',
    series(['clean', parallel(['compile-to-esm', 'compile-to-cjs']), 'copy-i18n', 'styles']),
);

task('default', series(['build']));
