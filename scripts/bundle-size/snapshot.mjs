#!/usr/bin/env node
// Measures the current build (run `npm run build` first) and adds it to the bundle size
// history in <out>: snapshots/<id>/, history.json, index.html and the viewer.
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
const title = git('show', '-s', '--format=%s', 'HEAD');
// release-please merges "chore(main): release X.Y.Z (#N)". Such a build gets the same id as
// backfill.mjs gives to the release, so the history shows it once, by version.
const release = title.match(/^chore\(main\): release (\d+\.\d+\.\d+(?:-[\w.]+)?)(?:\s|$)/)?.[1];
const {version} = JSON.parse(readFileSync('package.json', 'utf8'));

const checks = await measure(process.cwd());
writeSnapshot(
    values.out,
    {
        id: release ? `v${release}` : sha,
        kind: release ? 'release' : 'commit',
        version: release ?? version,
        sha,
        date: git('show', '-s', '--format=%cI', 'HEAD'),
        title,
    },
    checks,
);
updateHistory(values.out);
for (const check of checks) {
    process.stdout.write(`${check.name}: ${check.size} B\n`);
}
