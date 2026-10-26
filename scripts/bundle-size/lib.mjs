import {spawnSync} from 'node:child_process';
import {
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    realpathSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';

import {renderPage} from './page.mjs';

const require = createRequire(import.meta.url);
const SIZE_LIMIT_BIN = path.join(
    path.dirname(require.resolve('size-limit/package.json')),
    'bin.js',
);
// The esbuild copy that @size-limit/esbuild runs, so the metafile describes the measured bundle.
const esbuild = require(
    require.resolve('esbuild', {
        paths: [path.dirname(require.resolve('@size-limit/esbuild/package.json'))],
    }),
);
const {visualizer} = require('esbuild-visualizer');

export const OWN_PACKAGE = '@gravity-ui/charts';

// Runs the size-limit checks of `root` (a directory with `.size-limit.js`, `dist` and
// `node_modules`) and bundles every check again with metafile to see what it consists of.
// Sizes come from size-limit itself, so they match the CI check.
export async function measure(root) {
    const checks = require(path.join(root, '.size-limit.js'));
    // size-limit exits with 1 when a check exceeds its limit, which still prints the results.
    const run = spawnSync(process.execPath, [SIZE_LIMIT_BIN, '--json'], {
        cwd: root,
        encoding: 'utf8',
    });
    let results;
    try {
        results = JSON.parse(run.stdout);
    } catch {
        throw new Error(`size-limit failed in ${root}:\n${run.stdout}\n${run.stderr}`);
    }

    return Promise.all(
        checks.map(async (check) => {
            const result = results.find((r) => r.name === check.name);
            const metafile = await bundle(root, check);
            return {
                name: check.name,
                slug: slugify(check.name),
                size: result.size,
                packages: groupByPackage(metafile),
                metafile,
            };
        }),
    );
}

// Mirrors the build of @size-limit/esbuild (get-config.js and processImport).
async function bundle(measuredRoot, check) {
    // esbuild resolves absWorkingDir through symlinks (such as /var on macOS), so outdir
    // has to be resolved too for the output paths to stay relative.
    const root = realpathSync(measuredRoot);
    // The entry and the (never written) output live in root, so the treemap shows paths
    // relative to root.
    const entry = path.join(root, `.size-limit-${slugify(check.name)}.js`);
    try {
        let entryPoints = (Array.isArray(check.path) ? check.path : [check.path]).map((p) =>
            path.resolve(root, p),
        );
        if (check.import) {
            const imports =
                typeof check.import === 'string' ? {[check.path]: check.import} : check.import;
            const loader = Object.entries(imports)
                .map(([file, names]) => {
                    const list = names.replace(/[{}]/g, '').trim();
                    return `import ${names} from ${JSON.stringify(path.resolve(root, file))}\nconsole.log(${list})\n`;
                })
                .join('');
            writeFileSync(entry, loader);
            entryPoints = [entry];
        }
        const result = await esbuild.build({
            absWorkingDir: root,
            allowOverwrite: true,
            bundle: true,
            entryPoints,
            external: check.ignore,
            logLevel: 'silent',
            metafile: true,
            minifyIdentifiers: true,
            minifySyntax: true,
            minifyWhitespace: true,
            outdir: root,
            treeShaking: true,
            write: false,
        });
        return result.metafile;
    } finally {
        rmSync(entry, {force: true});
    }
}

// Minified bytes per npm package; code outside node_modules belongs to charts.
export function groupByPackage(metafile) {
    const sizes = {};
    for (const output of Object.values(metafile.outputs)) {
        for (const [file, {bytesInOutput}] of Object.entries(output.inputs)) {
            const parts = file.split('node_modules/');
            let name = OWN_PACKAGE;
            if (parts.length > 1) {
                const segments = parts[parts.length - 1].split('/');
                name = segments[0].startsWith('@') ? `${segments[0]}/${segments[1]}` : segments[0];
            }
            sizes[name] = (sizes[name] || 0) + bytesInOutput;
        }
    }
    return Object.fromEntries(Object.entries(sizes).sort((a, b) => b[1] - a[1]));
}

// Writes `<out>/snapshots/<id>/`: summary.json plus a metafile and a treemap per check.
// `info` describes the measured build: id, kind ('release' | 'commit'), version, sha, date.
export async function writeSnapshot(out, info, checks) {
    const dir = path.join(out, 'snapshots', info.id);
    mkdirSync(dir, {recursive: true});
    for (const check of checks) {
        writeFileSync(
            path.join(dir, `${check.slug}.metafile.json`),
            JSON.stringify(check.metafile),
        );
        const html = await visualizer(check.metafile, {
            title: `${OWN_PACKAGE} ${info.version} ${check.name}`,
            template: 'treemap',
        });
        writeFileSync(path.join(dir, `${check.slug}.treemap.html`), html);
    }
    const summary = {
        ...info,
        checks: checks.map(({name, slug, size, packages}) => ({name, slug, size, packages})),
    };
    writeFileSync(path.join(dir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
    return summary;
}

// Merges every `<out>/snapshots/<id>/summary.json` into `<out>/history.json`, which may
// already hold entries whose snapshots are not on disk, and renders `<out>/index.html`.
export function updateHistory(out) {
    const historyPath = path.join(out, 'history.json');
    const entries = new Map();
    if (existsSync(historyPath)) {
        for (const entry of JSON.parse(readFileSync(historyPath, 'utf8')).entries) {
            entries.set(entry.id, entry);
        }
    }
    const snapshots = path.join(out, 'snapshots');
    if (existsSync(snapshots)) {
        for (const id of readdirSync(snapshots)) {
            const summaryPath = path.join(snapshots, id, 'summary.json');
            if (existsSync(summaryPath)) {
                entries.set(id, JSON.parse(readFileSync(summaryPath, 'utf8')));
            }
        }
    }
    const history = {
        // Commit dates carry a UTC offset and npm publish times are in UTC.
        entries: [...entries.values()].sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
    };
    writeFileSync(historyPath, `${JSON.stringify(history, null, 2)}\n`);
    writeFileSync(path.join(out, 'index.html'), renderPage(history));
    return history;
}

function slugify(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
