const fs = require('node:fs');
const path = require('node:path');

const buildDir = path.resolve(process.argv[2] || '../dist-docs');

function getHtmlFiles(dir, files = []) {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        const entryPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            getHtmlFiles(entryPath, files);
        } else if (path.extname(entry.name) === '.html') {
            files.push(entryPath);
        }
    }

    return files;
}

function getAttribute(tag, name) {
    return tag.match(new RegExp(`\\b${name}="([^"]+)"`, 'i'))?.[1];
}

function isLocalReference(reference) {
    return reference && !reference.startsWith('//') && !/^[a-z][a-z\d+.-]*:/i.test(reference);
}

if (!fs.existsSync(buildDir)) {
    throw new Error(`Documentation build directory does not exist: ${buildDir}`);
}

const missing = new Set();
let checked = 0;

for (const htmlPath of getHtmlFiles(buildDir)) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const htmlUrl = new URL(path.relative(buildDir, htmlPath), 'https://docs.local/');
    const baseTag = html.match(/<base\b[^>]*>/i)?.[0];
    const baseUrl = new URL(getAttribute(baseTag || '', 'href') || htmlUrl.href, htmlUrl);
    const assetTags = html.match(/<(?:script|link)\b[^>]*>/gi) || [];

    for (const tag of assetTags) {
        const reference = getAttribute(tag, /^<script\b/i.test(tag) ? 'src' : 'href');

        if (!isLocalReference(reference)) {
            continue;
        }

        checked += 1;
        const assetUrl = new URL(reference, baseUrl);
        const assetPath = path.join(buildDir, decodeURIComponent(assetUrl.pathname));

        if (!fs.existsSync(assetPath)) {
            missing.add(reference);
        }
    }
}

if (missing.size) {
    console.error(`[docs-verify-build] Missing ${missing.size} local asset(s):`);
    missing.forEach((item) => console.error(`  - ${item}`));
    process.exitCode = 1;
} else {
    console.info(`[docs-verify-build] Verified ${checked} local asset reference(s).`);
}
