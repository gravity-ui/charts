const fs = require('node:fs');
const path = require('node:path');

const galleryGroups = require('../examples/src/charts/gallery-groups.json');

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
        const gallery = example.gallery;
        if (gallery !== undefined) {
            if (!gallery || typeof gallery !== 'object' || Array.isArray(gallery)) {
                throw new Error(`Example "${id}" has invalid gallery options`);
            }
            if (
                gallery.group !== undefined &&
                !galleryGroups.some((group) => group.id === gallery.group)
            ) {
                throw new Error(`Example "${id}" has invalid gallery.group`);
            }
            if (
                gallery.order !== undefined &&
                (!Number.isFinite(gallery.order) || gallery.order < 0)
            ) {
                throw new Error(`Example "${id}" has invalid gallery.order`);
            }
        }
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

module.exports = {verifyExamples};
