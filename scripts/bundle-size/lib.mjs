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
import {fileURLToPath} from 'node:url';

import {renderPage, renderTreemapPage} from './page.mjs';

const require = createRequire(import.meta.url);
const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPTS_DIR, '../..');
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
    // The entry and the (never written) output live in root, so the metafile has only paths
    // relative to root. The entry is .mjs: as a .js file under `"type": "commonjs"`, it would
    // require the build, and esbuild would wrap every module and could not tree-shake them.
    const entry = path.join(root, `.size-limit-${slugify(check.name)}.mjs`);
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

// Splits a bundled file path into its npm package and the path inside it; code outside
// node_modules is the dist/esm build of charts.
function splitPath(file) {
    const nodeModules = file.lastIndexOf('node_modules/');
    if (nodeModules === -1) {
        return [OWN_PACKAGE, ...file.replace(/^dist\/esm\//, '').split('/')];
    }
    const rest = file.slice(nodeModules + 'node_modules/'.length).split('/');
    const nameLength = rest[0].startsWith('@') ? 2 : 1;
    return [rest.slice(0, nameLength).join('/'), ...rest.slice(nameLength)];
}

function* bundledFiles(metafile) {
    for (const output of Object.values(metafile.outputs)) {
        for (const [file, {bytesInOutput}] of Object.entries(output.inputs)) {
            if (bytesInOutput && !file.startsWith('.size-limit-')) yield [file, bytesInOutput];
        }
    }
}

// Minified bytes per npm package.
export function groupByPackage(metafile) {
    const sizes = {};
    for (const [file, bytes] of bundledFiles(metafile)) {
        const [name] = splitPath(file);
        sizes[name] = (sizes[name] || 0) + bytes;
    }
    return Object.fromEntries(Object.entries(sizes).sort((a, b) => b[1] - a[1]));
}

// Module tree for the treemap: packages, then directories and files, biggest first.
// Directories with a single subdirectory are merged into one node ("date-utils/build").
export function buildModuleTree(metafile, name) {
    const root = {name, size: 0, children: new Map()};
    for (const [file, bytes] of bundledFiles(metafile)) {
        let node = root;
        node.size += bytes;
        for (const part of splitPath(file)) {
            if (!node.children.has(part)) {
                node.children.set(part, {name: part, size: 0, children: new Map()});
            }
            node = node.children.get(part);
            node.size += bytes;
        }
    }
    const finalize = (node) => {
        let children = [...node.children.values()].map(finalize).sort((a, b) => b.size - a.size);
        let nodeName = node.name;
        if (node !== root) {
            while (children.length === 1 && children[0].children) {
                nodeName = `${nodeName}/${children[0].name}`;
                children = children[0].children;
            }
        }
        return children.length
            ? {name: nodeName, size: node.size, children}
            : {name: nodeName, size: node.size};
    };
    return finalize(root);
}

// The page title and tree label of a build, such as "Chart · 1.70.0".
export function buildTitle(info, check) {
    const label = info.kind === 'release' ? info.version : (info.label ?? info.sha.slice(0, 7));
    return `${check.name} · ${label}`;
}

export function writeTreemapPage(dir, info, check, tree) {
    writeFileSync(
        path.join(dir, `${check.slug}.treemap.html`),
        renderTreemapPage({title: `${OWN_PACKAGE} ${buildTitle(info, check)}`, tree}),
    );
}

// Writes `<out>/snapshots/<id>/`: summary.json, and per check the metafile, the module tree
// and its treemap page. `info` describes the build: id, kind ('release' | 'commit' | 'pr'),
// version, sha, date and title.
export function writeSnapshot(out, info, checks) {
    const dir = path.join(out, 'snapshots', info.id);
    mkdirSync(dir, {recursive: true});
    for (const check of checks) {
        const tree = buildModuleTree(check.metafile, buildTitle(info, check));
        writeFileSync(
            path.join(dir, `${check.slug}.metafile.json`),
            JSON.stringify(check.metafile),
        );
        writeFileSync(path.join(dir, `${check.slug}.modules.json`), JSON.stringify(tree));
        writeTreemapPage(dir, info, check, tree);
    }
    const summary = {
        ...info,
        checks: checks.map(({name, slug, size, packages}) => ({
            name,
            slug,
            size,
            packages,
            treemap: true,
        })),
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
    writeSite(out, history);
    return history;
}

// Writes `<out>/index.html` for `history` and the viewer it loads.
export function writeSite(out, history, options) {
    writeFileSync(path.join(out, 'index.html'), renderPage(history, options));
    const {js, css} = bundleViewer();
    writeFileSync(path.join(out, 'viewer.js'), js);
    writeFileSync(path.join(out, 'viewer.css'), css);
}

let viewer;

// Bundles viewer.jsx with the charts build of this repository, so the pages draw their charts
// with the current @gravity-ui/charts. Run `npm run build` first.
function bundleViewer() {
    if (viewer) return viewer;
    const charts = path.join(REPO_ROOT, 'dist/esm/index.js');
    if (!existsSync(charts)) {
        throw new Error(`${charts} is missing: run \`npm run build\` first`);
    }
    const result = esbuild.buildSync({
        alias: {'@gravity-ui/charts': charts},
        bundle: true,
        define: {'process.env.NODE_ENV': '"production"'},
        entryPoints: [path.join(SCRIPTS_DIR, 'viewer.jsx')],
        format: 'iife',
        logLevel: 'silent',
        minify: true,
        outdir: path.join(SCRIPTS_DIR, 'viewer-build'),
        write: false,
    });
    const text = (ext) =>
        result.outputFiles
            .filter((file) => file.path.endsWith(ext))
            .map((file) => file.text)
            .join('\n');
    viewer = {js: text('.js'), css: text('.css')};
    return viewer;
}

function slugify(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
