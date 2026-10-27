#!/usr/bin/env node
// Measures the last <count> published releases with the current .size-limit.js and adds them
// to the bundle size history in <out>. Each release is measured from its npm tarball, with the
// dependencies locked in package-lock.json at its git tag.
import {execFileSync} from 'node:child_process';
import {copyFileSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {parseArgs} from 'node:util';

import {OWN_PACKAGE, measure, updateHistory, writeSnapshot} from './lib.mjs';

const {values} = parseArgs({
    options: {out: {type: 'string'}, count: {type: 'string', default: '20'}},
});
if (!values.out) {
    process.stderr.write('Usage: node scripts/bundle-size/backfill.mjs --out <dir> [--count 20]\n');
    process.exit(1);
}

const run = (cmd, args, options) => execFileSync(cmd, args, {encoding: 'utf8', ...options});
const npmView = (field) => JSON.parse(run('npm', ['view', OWN_PACKAGE, field, '--json']));
const versions = npmView('versions')
    .filter((v) => !v.includes('-'))
    .slice(-Number(values.count));
const publishTimes = npmView('time');
const config = path.resolve('.size-limit.js');

for (const version of versions) {
    const tag = `v${version}`;
    const root = mkdtempSync(path.join(tmpdir(), `bundle-size-${version}-`));
    try {
        const archive = execFileSync('git', ['archive', tag, 'package.json', 'package-lock.json']);
        execFileSync('tar', ['-x', '-C', root], {input: archive});
        run('npm', ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], {
            cwd: root,
        });
        run('npm', ['pack', `${OWN_PACKAGE}@${version}`, '--pack-destination', root], {cwd: root});
        const tarball = readdirSync(root).find((f) => f.endsWith('.tgz'));
        run('tar', ['-xzf', tarball, '--strip-components=1', 'package/dist'], {cwd: root});
        copyFileSync(config, path.join(root, '.size-limit.js'));
        // size-limit loads the plugins listed in package.json.
        const pkgPath = path.join(root, 'package.json');
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        pkg.devDependencies = {'@size-limit/esbuild': '*', '@size-limit/file': '*'};
        writeFileSync(pkgPath, JSON.stringify(pkg));

        const checks = await measure(root);
        writeSnapshot(
            values.out,
            {
                id: tag,
                kind: 'release',
                version,
                sha: run('git', ['rev-parse', `${tag}^{commit}`]).trim(),
                date: publishTimes[version],
                title: run('git', ['show', '-s', '--format=%s', tag]).trim(),
            },
            checks,
        );
        process.stdout.write(
            `${version}: ${checks.map((c) => `${c.name} ${c.size} B`).join(', ')}\n`,
        );
    } finally {
        rmSync(root, {recursive: true, force: true});
    }
}
updateHistory(values.out);
