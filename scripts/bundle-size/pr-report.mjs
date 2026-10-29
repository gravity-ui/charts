#!/usr/bin/env node
// Measures a pull request build (run `npm run build` first) against the bundle size history
// and writes <out>: a report site (the base build and the PR build, with treemaps) and
// report.json, from which pr-comment.mjs renders the PR comment. PR builds never go into the
// history itself.
//
// In the pull_request workflow HEAD is the merge commit, so HEAD^1 is the head of the base
// branch. Without a snapshot of it (a release branch, or a main commit not measured yet), the
// closest measured ancestor is the base.
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {parseArgs} from 'node:util';

import {measure, writeSite, writeSnapshot, writeTreemapPage} from './lib.mjs';

const {values} = parseArgs({
    options: {
        out: {type: 'string'},
        history: {type: 'string'},
        pr: {type: 'string'},
        base: {type: 'string', default: 'HEAD^1'},
        // The PR head to show, since HEAD is the merge commit in CI.
        sha: {type: 'string'},
    },
});
if (!values.out || !values.history) {
    process.stderr.write(
        'Usage: node scripts/bundle-size/pr-report.mjs --out <dir> --history <url or dir> [--pr <number>] [--base <rev>] [--sha <sha>]\n',
    );
    process.exit(1);
}

const git = (...args) => execFileSync('git', args, {encoding: 'utf8'}).trim();

// A file of the published history (a URL) or of a local one (a directory); null if missing.
async function readHistoryFile(file) {
    if (/^https?:\/\//.test(values.history)) {
        const response = await fetch(`${values.history.replace(/\/$/, '')}/${file}`);
        if (response.status === 404 || response.status === 403) return null;
        if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
        return response.json();
    }
    const local = path.join(values.history, file);
    return existsSync(local) ? JSON.parse(readFileSync(local, 'utf8')) : null;
}

const history = (await readHistoryFile('history.json')) ?? {entries: []};
const bySha = new Map(history.entries.map((entry) => [entry.sha, entry]));
const ancestors = git('rev-list', '--max-count=500', values.base).split('\n');
const behind = ancestors.findIndex((sha) => bySha.has(sha));
const baseEntry = behind === -1 ? null : bySha.get(ancestors[behind]);

const label = values.pr ? `PR #${values.pr}` : 'PR';
const checks = await measure(process.cwd());
const prSummary = writeSnapshot(
    values.out,
    {
        id: 'pr',
        kind: 'pr',
        label,
        version: JSON.parse(readFileSync('package.json', 'utf8')).version,
        sha: values.sha ?? git('rev-parse', 'HEAD'),
        date: new Date().toISOString(),
        title: label,
    },
    checks,
);

const entries = [prSummary];
if (baseEntry) {
    const dir = path.join(values.out, 'snapshots', baseEntry.id);
    mkdirSync(dir, {recursive: true});
    const base = {
        ...baseEntry,
        checks: await Promise.all(
            baseEntry.checks.map(async (check) => {
                const tree = await readHistoryFile(
                    `snapshots/${baseEntry.id}/${check.slug}.modules.json`,
                );
                if (tree) writeTreemapPage(dir, baseEntry, check, tree);
                return {...check, treemap: Boolean(tree)};
            }),
        ),
    };
    writeFileSync(path.join(dir, 'summary.json'), `${JSON.stringify(base, null, 2)}\n`);
    entries.unshift(base);
}
writeSite(values.out, {entries}, {title: `@gravity-ui/charts bundle size: ${label}`});

// Plain data only: the comment is rendered by the trusted workflow.
const report = {
    base: baseEntry && {id: baseEntry.id, sha: baseEntry.sha, exact: behind === 0, behind},
    checks: prSummary.checks.map((check) => {
        const baseCheck = baseEntry?.checks.find((c) => c.name === check.name);
        const names = new Set([
            ...Object.keys(check.packages),
            ...Object.keys(baseCheck?.packages ?? {}),
        ]);
        return {
            name: check.name,
            slug: check.slug,
            base: baseCheck?.size ?? null,
            head: check.size,
            packages: [...names].map((name) => ({
                name,
                base: baseCheck?.packages[name] ?? 0,
                head: check.packages[name] ?? 0,
            })),
        };
    }),
};
writeFileSync(path.join(values.out, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
for (const check of report.checks) {
    const base = check.base === null ? 'no base' : `base ${check.base} B`;
    process.stdout.write(`${check.name}: ${check.head} B (${base})\n`);
}
