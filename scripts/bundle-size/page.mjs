const REPO_URL = 'https://github.com/gravity-ui/charts';
const TOP_CHANGES = 3;

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

// Static HTML page: a size chart and a drill-down table per size-limit check.
export function renderPage(history) {
    const names = [...new Set(history.entries.flatMap((e) => e.checks.map((c) => c.name)))];
    const sections = names.map((name) => renderCheck(name, history.entries)).join('\n');
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>@gravity-ui/charts bundle size</title>
<style>
body { font: 14px/1.5 system-ui, sans-serif; margin: 24px auto; max-width: 1100px; padding: 0 16px; color: #222; }
h1 { font-size: 22px; } h2 { font-size: 18px; margin-top: 32px; }
.note { color: #666; }
svg { width: 100%; height: auto; }
svg .line { fill: none; stroke: #4c7bd9; stroke-width: 2; }
svg circle { fill: #4c7bd9; } svg a:hover circle { fill: #e05a2b; }
svg text { font-size: 11px; fill: #666; }
table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; padding: 4px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.nowrap { white-space: nowrap; }
.up { color: #c62828; } .down { color: #2e7d32; }
button { font: inherit; color: #1a5fd0; background: none; border: 0; padding: 0; cursor: pointer; }
tr.packages td { background: #fafafa; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2px 24px; padding: 4px 0 8px; }
.grid div { display: grid; grid-template-columns: 1fr auto 84px; gap: 8px; }
:target { background: #fff8e1; }
</style>
</head>
<body>
<h1>@gravity-ui/charts bundle size</h1>
<p class="note">Sizes are the size-limit checks: minified and brotlied, without peer dependencies.
Package breakdowns are minified bytes before compression, compared with the previous build.
The treemap shows every module of a build.</p>
${sections}
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
</body>
</html>
`;
}

function renderCheck(name, entries) {
    const rows = entries
        .map((entry) => ({entry, check: entry.checks.find((c) => c.name === name)}))
        .filter((row) => row.check);
    const body = rows
        .map((row, i) => renderRow(row, rows[i - 1]))
        .reverse()
        .join('\n');
    return `<h2>${escape(name)}</h2>
${renderChart(rows)}
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
    return `<tr id="${escape(anchor)}">
<td>${renderBuild(entry)}</td>
<td class="nowrap">${escape(entry.date.slice(0, 10))}</td>
<td class="num">${formatBytes(check.size)}</td>
<td class="num ${trend(change)}">${previous ? formatChange(change) : ''}</td>
<td>${top}</td>
<td class="nowrap"><button type="button" data-packages>packages</button> · <a href="snapshots/${escape(entry.id)}/${escape(check.slug)}.treemap.html">treemap</a></td>
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
    const title = escape(entry.title ?? '').replace(
        /\(#(\d+)\)/g,
        (_, pr) => `(<a href="${REPO_URL}/pull/${pr}">#${pr}</a>)`,
    );
    return `${title}${commit}`;
}

// Releases are told apart by version, commits between releases by sha.
function label(entry) {
    return entry.kind === 'release' ? entry.version : entry.sha.slice(0, 7);
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

function renderChart(rows) {
    if (rows.length < 2) return '';
    const width = 1000;
    const height = 220;
    const pad = {top: 16, right: 16, bottom: 28, left: 72};
    const sizes = rows.map((r) => r.check.size);
    const min = Math.min(...sizes);
    const max = Math.max(...sizes);
    const span = max - min || 1;
    const x = (i) => pad.left + (i * (width - pad.left - pad.right)) / (rows.length - 1);
    const y = (size) => pad.top + ((max - size) * (height - pad.top - pad.bottom)) / span;
    const points = rows.map((r, i) => `${x(i).toFixed(1)},${y(r.check.size).toFixed(1)}`).join(' ');
    const dots = rows
        .map(
            ({entry, check}, i) =>
                `<a href="#${escape(`${check.slug}-${entry.id}`)}"><circle cx="${x(i).toFixed(1)}" cy="${y(check.size).toFixed(1)}" r="4"><title>${escape(label(entry))} · ${formatBytes(check.size)}</title></circle></a>`,
        )
        .join('');
    const first = rows[0].entry;
    const last = rows[rows.length - 1].entry;
    return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Size by build">
<text x="${pad.left - 8}" y="${y(max) + 4}" text-anchor="end">${formatBytes(max)}</text>
<text x="${pad.left - 8}" y="${y(min) + 4}" text-anchor="end">${formatBytes(min)}</text>
<text x="${pad.left}" y="${height - 8}">${escape(label(first))}</text>
<text x="${width - pad.right}" y="${height - 8}" text-anchor="end">${escape(label(last))}</text>
<polyline class="line" points="${points}"/>
${dots}
</svg>`;
}

function diffPackages(before, after) {
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
