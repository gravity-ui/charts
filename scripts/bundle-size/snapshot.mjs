#!/usr/bin/env node
// Measures the current build (run `npm run build` first) and adds it to the bundle size
// history in <out>: snapshots/<sha>/, history.json and index.html.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {parseArgs} from 'node:util';

import {measure, updateHistory, writeSnapshot} from './lib.mjs';

const {values} = parseArgs({options: {out: {type: 'string'}}});
if (!values.out) {
    process.stderr.write('Usage: node scripts/bundle-size/snapshot.mjs --out <dir>\n');
    process.exit(1);
}

const git = (...args) => execFileSync('git', args, {encoding: 'utf8'}).trim();
const sha = git('rev-parse', 'HEAD');
const {version} = JSON.parse(readFileSync('package.json', 'utf8'));

const checks = await measure(process.cwd());
await writeSnapshot(
    values.out,
    {
        id: sha,
        kind: 'commit',
        version,
        sha,
        date: git('show', '-s', '--format=%cI', 'HEAD'),
        title: git('show', '-s', '--format=%s', 'HEAD'),
    },
    checks,
);
updateHistory(values.out);
for (const check of checks) {
    process.stdout.write(`${check.name}: ${check.size} B\n`);
}
