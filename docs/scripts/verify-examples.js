const fs = require('node:fs');
const path = require('node:path');

function verifyExampleFiles(meta, sourceDir) {
    const ids = new Set();
    function visit(dir) {
        for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
            const file = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                visit(file);
            } else if (entry.name.endsWith('.tsx')) {
                ids.add(path.relative(sourceDir, file).split(path.sep).join('/').slice(0, -4));
            }
        }
    }
    visit(sourceDir);
    for (const id of ids) {
        if (!Object.hasOwn(meta, id))
            throw new Error(`Example "${id}" is missing gallery metadata`);
    }
    for (const id of Object.keys(meta)) {
        if (!ids.has(id)) throw new Error(`Example "${id}" has no component file`);
    }
}

function verifyExamples(meta, pages, buildDir) {
    const usedIds = new Set();
    for (const html of pages) {
        for (const match of html.matchAll(/<div\b[^>]*\bdata-chart-example="([^"]+)"/g)) {
            usedIds.add(match[1]);
        }
    }

    for (const id of usedIds) {
        if (!Object.hasOwn(meta, id)) {
            throw new Error(`Example "${id}" is missing gallery metadata`);
        }
    }

    for (const [id, example] of Object.entries(meta)) {
        for (const field of ['title', 'description', 'seriesType', 'docsUrl']) {
            if (typeof example[field] !== 'string' || !example[field].trim()) {
                throw new Error(`Example "${id}" is missing ${field}`);
            }
        }
        const [page, anchor] = example.docsUrl.split('#');
        const html = fs.readFileSync(path.join(buildDir, page), 'utf8');
        if (!anchor || !html.includes(`id="${anchor}"`)) {
            throw new Error(
                `Example "${id}" has a missing documentation anchor: ${example.docsUrl}`,
            );
        }
    }
}

module.exports = {verifyExamples, verifyExampleFiles};
