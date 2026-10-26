#!/usr/bin/env node
// Renders the bundle size comment of a pull request from report.json (see pr-report.mjs).
// Runs in the trusted workflow, while the report comes from the PR build, so every value is
// validated and names are reduced to characters that cannot form markdown or HTML.
import {readFileSync} from 'node:fs';
import {parseArgs} from 'node:util';

const SITE = 'https://storage.yandexcloud.net/playwright-reports/charts';
const MAX_PACKAGE_ROWS = 20;
const MIN_PACKAGE_CHANGE = 100;

const {values} = parseArgs({options: {report: {type: 'string'}, pr: {type: 'string'}}});
if (!values.report || !/^\d+$/.test(values.pr ?? '')) {
    process.stderr.write(
        'Usage: node scripts/bundle-size/pr-comment.mjs --report <report.json> --pr <number>\n',
    );
    process.exit(1);
}

function fail(message) {
    throw new Error(`Invalid report: ${message}`);
}
const bytes = (value) =>
    Number.isSafeInteger(value) && value >= 0 ? value : fail(`size ${value}`);
const name = (value) =>
    String(value)
        .replace(/[^\w@/.-]/g, '')
        .slice(0, 100) || '?';
const slug = (value) => (/^[a-z0-9-]+$/.test(value) ? value : fail(`slug ${value}`));
const sha = (value) => (/^[0-9a-f]{40}$/.test(value) ? value : fail(`sha ${value}`));

const formatBytes = (value) =>
    Math.abs(value) < 1000 ? `${Math.abs(value)} B` : `${(Math.abs(value) / 1000).toFixed(2)} kB`;
function formatChange(change, base) {
    if (change === 0) return '0';
    const sign = change > 0 ? '+' : '−';
    const percent = base ? ` (${sign}${((Math.abs(change) / base) * 100).toFixed(2)}%)` : '';
    return `${sign}${formatBytes(change)}${percent}`;
}

const report = JSON.parse(readFileSync(values.report, 'utf8'));
const base = report.base && {
    sha: sha(report.base.sha),
    exact: report.base.exact === true,
    behind: bytes(report.base.behind),
};
const checks = report.checks.map((check) => ({
    name: name(check.name),
    slug: slug(check.slug),
    base: check.base === null ? null : bytes(check.base),
    head: bytes(check.head),
    packages: check.packages.map((p) => ({
        name: name(p.name),
        base: bytes(p.base),
        head: bytes(p.head),
    })),
}));

const reportUrl = `${SITE}/pulls/${values.pr}/bundle-size`;
const lines = ['### 📦 Bundle size', ''];
if (base) {
    lines.push('| Check | Base | This PR | Change |', '| :-- | --: | --: | --: |');
    for (const check of checks) {
        const change = check.base === null ? '' : formatChange(check.head - check.base, check.base);
        const baseSize = check.base === null ? '—' : formatBytes(check.base);
        lines.push(`| ${check.name} | ${baseSize} | ${formatBytes(check.head)} | ${change} |`);
    }
} else {
    lines.push('| Check | This PR |', '| :-- | --: |');
    for (const check of checks) lines.push(`| ${check.name} | ${formatBytes(check.head)} |`);
}

for (const check of base ? checks : []) {
    const all = check.packages.filter((p) => p.head !== p.base);
    // Renamed identifiers shift every package by a few bytes after any change.
    const changed = all
        .filter((p) => Math.abs(p.head - p.base) >= MIN_PACKAGE_CHANGE)
        .sort((a, b) => Math.abs(b.head - b.base) - Math.abs(a.head - a.base));
    const minor = all.length - changed.length;
    const minorNote = minor
        ? `${minor} ${minor === 1 ? 'package' : 'packages'} changed by less than ${MIN_PACKAGE_CHANGE} B.`
        : '';
    const title = checks.length > 1 ? `${check.name}: package changes` : 'Package changes';
    if (changed.length === 0) {
        lines.push('', `${title}: none. ${minorNote}`.trim());
        continue;
    }
    lines.push(
        '',
        '<details>',
        `<summary>${title} (minified, before compression)</summary>`,
        '',
        '| Package | Base | This PR | Change |',
        '| :-- | --: | --: | --: |',
    );
    for (const p of changed.slice(0, MAX_PACKAGE_ROWS)) {
        lines.push(
            `| ${p.name} | ${formatBytes(p.base)} | ${formatBytes(p.head)} | ${formatChange(p.head - p.base)} |`,
        );
    }
    if (changed.length > MAX_PACKAGE_ROWS) {
        lines.push('', `And ${changed.length - MAX_PACKAGE_ROWS} more in the report.`);
    }
    if (minorNote) lines.push('', minorNote);
    lines.push('', '</details>');
}

lines.push('');
if (!base) {
    lines.push(
        'The history has no snapshot of the base branch yet, so there is nothing to compare with.',
    );
} else if (base.exact) {
    lines.push(`Compared with \`${base.sha.slice(0, 7)}\`, the head of the base branch.`);
} else {
    lines.push(
        `Compared with \`${base.sha.slice(0, 7)}\`, the closest measured commit: ${base.behind} commits before the head of the base branch, so the change includes theirs.`,
    );
}
const treemaps = checks.map(
    (check) =>
        `[${checks.length > 1 ? `${check.name} treemap` : 'Treemap'}](${reportUrl}/snapshots/pr/${check.slug}.treemap.html)`,
);
lines.push(
    '',
    [
        `[Report](${reportUrl}/index.html)`,
        ...treemaps,
        `[History](${SITE}/bundle-size/index.html)`,
    ].join(' · '),
);
process.stdout.write(`${lines.join('\n')}\n`);
