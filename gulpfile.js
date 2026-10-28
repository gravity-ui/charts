const fs = require('node:fs');
const path = require('node:path');
const {Transform} = require('node:stream');

const utils = require('@gravity-ui/gulp-utils');
const {task, src, dest, series, parallel} = require('gulp');
const sass = require('gulp-dart-sass');
const rimraf = require('rimraf');

const {buildChartConfig} = require('./scripts/build-chart-config');

const {version, sideEffects} = require('./package.json');

const BUILD_DIR = path.resolve('dist');

task('clean', (done) => {
    rimraf.sync(BUILD_DIR);
    done();
});

// gulp's own source maps leave out the sources and a way back to them: this embeds the sources
// and sets `sourceRoot` from each map to `src`. The final newline puts the `sourceMappingURL`
// comment that gulp appends on a line of its own.
function completeSourceMaps(outDir) {
    return new Transform({
        objectMode: true,
        transform(file, _encoding, callback) {
            const map = file.sourceMap;
            if (map) {
                if (!file.contents.toString('utf8').endsWith('\n')) {
                    file.contents = Buffer.concat([file.contents, Buffer.from('\n')]);
                }
                map.file = path.basename(file.relative);
                map.sourceRoot = path.relative(
                    path.dirname(path.join(outDir, file.relative)),
                    file.base,
                );
                map.sourcesContent = map.sources.map((source) =>
                    fs.readFileSync(path.join(file.base, source), 'utf8'),
                );
            }
            callback(null, file);
        },
    });
}

async function compileTs(modules = false) {
    const outDir = path.resolve(BUILD_DIR, modules ? 'esm' : 'cjs');
    const tsProject = await utils.createTypescriptProject({
        compilerOptions: {
            declaration: true,
            module: modules ? 'esnext' : 'nodenext',
            moduleResolution: modules ? 'bundler' : 'nodenext',
            ...(modules ? undefined : {verbatimModuleSyntax: false}),
        },
    });

    // Local imports, including the `~core` alias, get relative paths with extensions, and
    // `.scss` imports point to the compiled `.css`.
    const transformers = [
        tsProject.customTransformers.transformScssImports,
        tsProject.customTransformers.transformLocalModules,
    ];
    return new Promise((resolve) => {
        src(
            [
                'src/**/*.{ts,tsx}',
                '!src/demo/**/*',
                '!src/**/__stories__/**/*',
                '!src/**/__tests__/**/*',
                '!src/**/__mocks__/**/*',
                '!src/**/*.test.{ts,tsx}',
                '!src/**/__snapshots__/**/*',
                '!src/setup-*.ts',
            ],
            {sourcemaps: true},
        )
            .pipe(
                tsProject({
                    customTransformers: {
                        before: transformers,
                        afterDeclarations: transformers,
                    },
                }),
            )
            .pipe(completeSourceMaps(outDir))
            // Bundlers read `sideEffects` from the closest package.json, so it repeats the root one.
            .pipe(
                utils.addVirtualFile({
                    fileName: 'package.json',
                    text: JSON.stringify({
                        version,
                        type: modules ? 'module' : 'commonjs',
                        sideEffects,
                    }),
                }),
            )
            .pipe(dest(outDir, {sourcemaps: '.'}))
            .on('end', resolve);
    });
}

task('compile-to-esm', () => {
    return compileTs(true);
});

task('compile-to-cjs', () => {
    return compileTs();
});

task('chart-config', (done) => {
    buildChartConfig();
    done();
});

task('copy-i18n', () => {
    return src(['src/**/i18n/**/*.json'])
        .pipe(dest(path.resolve(BUILD_DIR, 'esm')))
        .pipe(dest(path.resolve(BUILD_DIR, 'cjs')));
});

task('styles', () => {
    return src(['src/**/*.scss', '!src/demo/**/*', '!src/**/__stories__/**/*'])
        .pipe(sass({includePaths: ['./node_modules/']}).on('error', sass.logError))
        .pipe(dest(path.resolve(BUILD_DIR, 'esm')))
        .pipe(dest(path.resolve(BUILD_DIR, 'cjs')));
});

task('copy-docs', (done) => {
    utils.buildDocs({
        outDir: path.resolve(BUILD_DIR, 'docs'),
        sources: [
            {
                title: 'Guides',
                kind: 'markdown',
                // Include all hand-written Diplodoc pages and their subfolders.
                baseDir: 'docs/diplodoc/pages',
                outPrefix: '',
                nameFromTitle: true,
            },
        ],
    });
    done();
});

task(
    'build',
    series([
        'clean',
        parallel(['compile-to-esm', 'compile-to-cjs']),
        'chart-config',
        'copy-i18n',
        'styles',
        'copy-docs',
    ]),
);

task('default', series(['build']));
