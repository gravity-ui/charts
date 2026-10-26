// HTML pages of the bundle size history. They load viewer.js and viewer.css from the root of
// the output (see bundleViewer in lib.mjs), which draws the charts with @gravity-ui/charts.
const REPO_URL = 'https://github.com/gravity-ui/charts';
const TOP_CHANGES = 3;
const TOP_PACKAGES = 6;

const formatBytes = (bytes) => (bytes < 1000 ? `${bytes} B` : `${(bytes / 1000).toFixed(2)} kB`);
function formatChange(bytes) {
    if (bytes > 0) return `+${formatBytes(bytes)}`;
    if (bytes < 0) return `−${formatBytes(-bytes)}`;
    return '0';
}
const escape = (value) =>
    String(value).replace(
        /[&<>"']/g,
        (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c],
    );
const json = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

const BASE_STYLE = `body { font: 14px/1.5 system-ui, sans-serif; margin: 24px auto; max-width: 1100px; padding: 0 16px; color: #222; }
h1 { font-size: 22px; } h2 { font-size: 18px; margin-top: 32px; }
button { font: inherit; color: #1a5fd0; background: none; border: 0; padding: 0; cursor: pointer; }`;

// The history (or a pull request report): charts and a drill-down table per size-limit check.
export function renderPage(history, {title = '@gravity-ui/charts bundle size'} = {}) {
    const names = [...new Set(history.entries.flatMap((e) => e.checks.map((c) => c.name)))];
    const checks = names.map((name) => collectRows(name, history.entries));
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<link rel="stylesheet" href="viewer.css">
<style>
${BASE_STYLE}
.note { color: #666; }
.chart { height: 300px; margin: 8px 0 24px; }
h3 { font-size: 14px; font-weight: 600; margin: 16px 0 0; }
table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; padding: 4px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.nowrap { white-space: nowrap; }
.up { color: #c62828; } .down { color: #2e7d32; }
tr.packages td { background: #fafafa; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2px 24px; padding: 4px 0 8px; }
.grid div { display: grid; grid-template-columns: 1fr auto 84px; gap: 8px; }
:target { background: #fff8e1; }
</style>
</head>
<body>
<h1>${escape(title)}</h1>
<p class="note">Sizes are the size-limit checks: minified and brotlied, without peer dependencies.
Package breakdowns are minified bytes before compression, compared with the previous build.
The treemap shows every module of a build.</p>
${checks.map(renderCheck).join('\n')}
<script>
function showPackages(row) {
    row.nextElementSibling.hidden = false;
}
document.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-packages]');
    if (button) {
        const packages = button.closest('tr').nextElementSibling;
        packages.hidden = !packages.hidden;
    }
});
// Opening a build from the chart also opens its packages.
function openTarget() {
    const row = location.hash && document.getElementById(location.hash.slice(1));
    if (row) showPackages(row);
}
window.addEventListener('hashchange', openTarget);
openTarget();
</script>
<script type="application/json" id="bundle-size-data">${json(checks.map(toChartData))}</script>
<script src="viewer.js"></script>
</body>
</html>
`;
}

// The module treemap of one build, stored in snapshots/<id>/.
export function renderTreemapPage({title, tree}) {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<link rel="stylesheet" href="../../viewer.css">
<style>
${BASE_STYLE}
body { max-width: none; margin: 16px; }
.crumbs { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.crumbs button:disabled { color: #222; font-weight: 600; cursor: default; }
.crumbs .sep { color: #999; } .crumbs .size { color: #666; margin-left: 12px; }
.crumbs .nested { margin-left: auto; color: #444; cursor: pointer; }
.treemap { height: calc(100vh - 80px); min-height: 480px; }
</style>
</head>
<body>
<div id="treemap-root"></div>
<script type="application/json" id="treemap-data">${json({tree})}</script>
<script src="../../viewer.js"></script>
</body>
</html>
`;
}

// Builds of one check in time order.
function collectRows(name, entries) {
    const rows = entries
        .map((entry) => ({entry, check: entry.checks.find((c) => c.name === name)}))
        .filter((row) => row.check);
    return {name, slug: rows[0].check.slug, rows};
}

// Series for viewer.jsx: totals and the biggest packages of the latest build, in kB.
function toChartData({name, slug, rows}) {
    const toKB = (bytes) => Math.round(bytes / 10) / 100;
    const latest = rows[rows.length - 1].check.packages;
    const top = Object.keys(latest).slice(0, TOP_PACKAGES);
    const other = (packages) =>
        Object.entries(packages)
            .filter(([pkg]) => !top.includes(pkg))
            .reduce((sum, [, bytes]) => sum + bytes, 0);
    return {
        name,
        slug,
        labels: rows.map(({entry}) => label(entry)),
        anchors: rows.map(({entry}) => `${slug}-${entry.id}`),
        totals: rows.map(({check}) => toKB(check.size)),
        packages: [
            ...top.map((pkg) => ({
                name: pkg,
                values: rows.map(({check}) => toKB(check.packages[pkg] ?? 0)),
            })),
            {name: 'other', values: rows.map(({check}) => toKB(other(check.packages)))},
        ],
    };
}

function renderCheck({name, slug, rows}) {
    const body = rows
        .map((row, i) => renderRow(row, rows[i - 1]))
        .reverse()
        .join('\n');
    return `<h2>${escape(name)}</h2>
<h3>Size</h3>
<div class="chart" data-check="${escape(slug)}" data-chart="total"></div>
<h3>By package</h3>
<div class="chart" data-check="${escape(slug)}" data-chart="packages"></div>
<table>
<thead><tr><th>Build</th><th>Date</th><th class="num">Size</th><th class="num">Change</th><th>Biggest package changes</th><th></th></tr></thead>
<tbody>
${body}
</tbody>
</table>`;
}

function renderRow({entry, check}, previous) {
    const anchor = `${check.slug}-${entry.id}`;
    const change = previous ? check.size - previous.check.size : 0;
    const packageChanges = previous ? diffPackages(previous.check.packages, check.packages) : [];
    const top = packageChanges
        .slice(0, TOP_CHANGES)
        .map(
            (c) =>
                `${escape(c.name)} <span class="${trend(c.change)}">${formatChange(c.change)}</span>`,
        )
        .join(', ');
    const treemap = check.treemap
        ? ` · <a href="snapshots/${escape(entry.id)}/${escape(check.slug)}.treemap.html">treemap</a>`
        : '';
    return `<tr id="${escape(anchor)}">
<td>${renderBuild(entry)}</td>
<td class="nowrap">${escape(entry.date.slice(0, 10))}</td>
<td class="num">${formatBytes(check.size)}</td>
<td class="num ${trend(change)}">${previous ? formatChange(change) : ''}</td>
<td>${top}</td>
<td class="nowrap"><button type="button" data-packages>packages</button>${treemap}</td>
</tr>
<tr class="packages" hidden><td colspan="6">${renderPackages(check, previous, packageChanges)}</td></tr>`;
}

function renderBuild(entry) {
    const commit = entry.sha
        ? ` <a href="${REPO_URL}/commit/${escape(entry.sha)}"><code>${escape(entry.sha.slice(0, 7))}</code></a>`
        : '';
    if (entry.kind === 'release') {
        return `<a href="${REPO_URL}/releases/tag/v${escape(entry.version)}">${escape(entry.version)}</a>${commit}`;
    }
    if (entry.kind === 'pr') {
        return `This pull request${commit}`;
    }
    const title = escape(entry.title ?? '').replace(
        /\(#(\d+)\)/g,
        (_, pr) => `(<a href="${REPO_URL}/pull/${pr}">#${pr}</a>)`,
    );
    return `${title}${commit}`;
}

// Releases are told apart by version, commits between releases by sha.
function label(entry) {
    if (entry.kind === 'release') return entry.version;
    if (entry.kind === 'pr') return 'PR';
    return entry.sha.slice(0, 7);
}

function renderPackages(check, previous, packageChanges) {
    const changes = new Map(packageChanges.map((c) => [c.name, c.change]));
    const items = Object.entries(check.packages).map(([pkg, bytes]) => {
        const change = changes.get(pkg) ?? 0;
        return `<div><span>${escape(pkg)}</span><span class="num">${formatBytes(bytes)}</span><span class="num ${trend(change)}">${previous && change ? formatChange(change) : ''}</span></div>`;
    });
    const removed = packageChanges
        .filter((c) => !(c.name in check.packages))
        .map(
            (c) =>
                `<div><s>${escape(c.name)}</s><span class="num"></span><span class="num down">${formatChange(c.change)}</span></div>`,
        );
    return `<div class="grid">${[...items, ...removed].join('')}</div>`;
}

export function diffPackages(before, after) {
    const names = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...names]
        .map((name) => ({name, change: (after[name] ?? 0) - (before[name] ?? 0)}))
        .filter((c) => c.change !== 0)
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}

function trend(change) {
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return '';
}
