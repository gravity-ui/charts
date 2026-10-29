#!/usr/bin/env node
// Loads the built package in Node (run `npm run build` first): `require` of dist/cjs and
// `import` of dist/esm. Node resolves both strictly, so a missing extension, a directory import
// or a CommonJS file with ESM syntax fails here. CSS and JSON keysets are handled the way
// bundlers handle them: Node cannot import CSS, and imports JSON only with an import attribute.
// Both builds must export the same names.
import {readFileSync} from 'node:fs';
import {createRequire, registerHooks} from 'node:module';
import {resolve} from 'node:path';
import {exit, stderr, stdout} from 'node:process';
import {pathToFileURL} from 'node:url';

const ROOT = resolve(import.meta.dirname, '..');

if (!registerHooks) {
    stderr.write('check-build needs Node.js 22.15 or later (module.registerHooks).\n');
    exit(1);
}

registerHooks({
    load(url, context, nextLoad) {
        if (url.endsWith('.css')) {
            const format = context.format === 'module' ? 'module' : 'commonjs';
            return {format, source: '', shortCircuit: true};
        }
        if (url.endsWith('.json') && !context.importAttributes?.type) {
            const source = readFileSync(new URL(url), 'utf8');
            return {format: 'json', source, shortCircuit: true};
        }
        return nextLoad(url, context);
    },
});

function exportNames(module) {
    return Object.keys(module)
        .filter((name) => name !== 'default' && name !== '__esModule')
        .sort();
}

async function load(name, loadModule) {
    try {
        const names = exportNames(await loadModule());
        stdout.write(`${name}: ${names.length} exports\n`);
        return names;
    } catch (error) {
        stderr.write(`${name} failed to load: ${error.code ?? ''} ${error.message}\n`);
        return undefined;
    }
}

const require = createRequire(import.meta.url);
const cjs = await load('dist/cjs', () => require(resolve(ROOT, 'dist/cjs/index.js')));
const esm = await load('dist/esm', () => import(pathToFileURL(resolve(ROOT, 'dist/esm/index.js'))));

if (!cjs || !esm) {
    exit(1);
}
const onlyCjs = cjs.filter((name) => !esm.includes(name));
const onlyEsm = esm.filter((name) => !cjs.includes(name));
if (onlyCjs.length || onlyEsm.length || !esm.includes('Chart')) {
    stderr.write(
        `The builds export different names. Only CommonJS: ${onlyCjs.join(', ') || '-'}. ` +
            `Only ESM: ${onlyEsm.join(', ') || '-'}.\n`,
    );
    exit(1);
}
stdout.write('Both builds load and export the same names.\n');
