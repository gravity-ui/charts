#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Extracts ChartData from a running browser via CDP and creates a Storybook story.
 *
 * Prerequisites:
 *   Browser must be running with: --remote-debugging-port=9222
 *   See browser-setup.md for browser-specific instructions.
 *
 * Usage:
 *   node .agents/skills/stand-to-story/extract-chart-story.mjs <data-qa-value> [url-substring]
 *
 * Examples:
 *   node .agents/skills/stand-to-story/extract-chart-story.mjs chartkit-body-entry-abc123xyz
 *   node .agents/skills/stand-to-story/extract-chart-story.mjs chartkit-body-entry-abc123xyz dashboard
 */

import {execSync} from 'child_process';
import {mkdirSync, writeFileSync} from 'fs';
import {join} from 'path';

import {chromium} from '@playwright/test';

const [, , dataQaValue, urlSubstring] = process.argv;

if (!dataQaValue) {
    console.error('Usage: node extract-chart-story.mjs <data-qa-value> [url-substring]');
    process.exit(1);
}

// Derive a safe story name from the data-qa value
// "chartkit-body-entry-abc123xyz" -> "Story-abc123xyz"
const idPart = dataQaValue.split('-').pop();
const storyName = `Story-${idPart}`;
const storyFileName = `${storyName}.stories.tsx`;

console.log(`Connecting to Chrome on localhost:9222...`);

let browser;
try {
    browser = await chromium.connectOverCDP('http://localhost:9222');
} catch {
    console.error('Could not connect to browser on port 9222.');
    console.error(
        'Start any Chromium-based browser with: --remote-debugging-port=9222 --user-data-dir=/tmp/browser-debug',
    );
    console.error('See scripts/extract-chart-story.md for browser-specific instructions.');
    process.exit(1);
}

try {
    // Collect all pages from all contexts
    const allPages = browser.contexts().flatMap((ctx) => ctx.pages());

    if (allPages.length === 0) {
        console.error('No open pages found in Chrome.');
        process.exit(1);
    }

    // Find page by URL substring if provided, otherwise use first page
    const page = urlSubstring
        ? (allPages.find((p) => p.url().includes(urlSubstring)) ?? allPages[0])
        : allPages[0];

    console.log(`Using page: ${page.url()}`);
    console.log(`Looking for element: [data-qa="${dataQaValue}"]`);

    const result = await page.evaluate((qaValue) => {
        const wrapper = document.querySelector(`[data-qa="${qaValue}"]`);
        if (!wrapper) {
            return {error: `Element [data-qa="${qaValue}"] not found on this page`};
        }

        // Find the React fiber key (__reactFiber$xxxx)
        const fiberKey = Object.keys(wrapper).find((k) => k.startsWith('__reactFiber'));
        if (!fiberKey) {
            return {error: 'React fiber not found. Is this a React app?'};
        }

        const rootFiber = wrapper[fiberKey];

        // Serialize a value, silently dropping functions and keys whose
        // entire subtree resolves to undefined (e.g. {click: fn} → omitted).
        let droppedFunctions = 0;

        function serializeValue(val, depth = 0) {
            if (depth > 50) return undefined; // guard against circular refs
            if (val === null || val === undefined) return val;
            if (typeof val === 'function') {
                droppedFunctions++;
                return undefined;
            }
            if (typeof val !== 'object') return val;
            if (Array.isArray(val)) {
                return val.map((item) => serializeValue(item, depth + 1));
            }
            const out = {};
            for (const key of Object.keys(val)) {
                try {
                    const serialized = serializeValue(val[key], depth + 1);
                    if (serialized !== undefined) {
                        out[key] = serialized;
                    }
                } catch {
                    // skip unserializable keys
                }
            }
            // Drop empty objects that only contained functions
            return Object.keys(out).length === 0 && Object.keys(val).length > 0 ? undefined : out;
        }

        // Traverse the fiber subtree (depth-first) looking for a node
        // whose memoizedProps.data looks like ChartData (has .series)
        function findChartData(fiber) {
            let node = fiber;
            while (node) {
                const props = node.memoizedProps;
                if (props && props.data && typeof props.data === 'object' && props.data.series) {
                    return serializeValue(props.data);
                }

                // Depth-first: child first, then sibling
                if (node.child) {
                    node = node.child;
                    continue;
                }

                // Walk back up until we find a sibling
                while (node !== fiber) {
                    if (node.sibling) {
                        node = node.sibling;
                        break;
                    }
                    node = node.return;
                }

                if (node === fiber) break;
            }
            return null;
        }

        const chartData = findChartData(rootFiber);
        if (!chartData) {
            return {
                error: 'No ChartData found in fiber subtree. The chart may not be rendered yet or the data structure is unexpected.',
            };
        }

        return {data: chartData, droppedFunctions};
    }, dataQaValue);

    if (result.error) {
        console.error(`Error: ${result.error}`);
        process.exit(1);
    }

    const typedResult = /** @type {{data: object, droppedFunctions: number}} */ (result);
    let {data: chartData} = typedResult;
    const {droppedFunctions} = typedResult;

    if (droppedFunctions > 0) {
        console.warn(`Note: ${droppedFunctions} function prop(s) were dropped (not serializable).`);
    }

    const outputDir = join(process.cwd(), 'src', '__stories__', 'Reproduction');
    const rootDir = process.cwd();
    mkdirSync(outputDir, {recursive: true});
    const outputPath = join(outputDir, storyFileName);

    function buildStoryContent(data) {
        return `import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import {ChartStory} from '../ChartStory';

const meta: Meta<typeof ChartStory> = {
    title: 'Reproduction/${storyName}',
    render: ChartStory,
    component: Chart,
};

export default meta;

type Story = StoryObj<typeof ChartStory>;

export const Default: Story = {
    name: '${storyName}',
    args: {
        data: ${JSON.stringify(data, null, 4)},
    },
};
`;
    }

    // Write initial file
    writeFileSync(outputPath, buildStoryContent(chartData), 'utf8');

    // Run tsc and strip any fields that violate ChartData types (TS2353).
    // tsc exits with code 2 when there are errors, so we must not throw.
    let tscOut = '';
    try {
        tscOut = execSync('npx tsc --noEmit', {cwd: rootDir, encoding: 'utf8', stdio: 'pipe'});
    } catch (e) {
        tscOut =
            e instanceof Error && 'stdout' in e && typeof e.stdout === 'string' ? e.stdout : '';
    }

    // Only look at errors from our generated file to avoid stripping fields
    // due to unrelated TS2353 errors elsewhere in the project.
    const ourFileErrors = tscOut
        .split('\n')
        .filter((line) => line.includes(storyFileName))
        .join('\n');
    // Error format: and '"custom"' does not exist  →  capture: custom
    const unknownFields = [...ourFileErrors.matchAll(/and '"?(\w+)"?' does not exist/g)].map(
        (m) => m[1],
    );

    if (unknownFields.length > 0) {
        const toRemove = new Set(unknownFields);
        console.warn(
            `Stripping unknown fields not in ChartData types: ${[...toRemove].join(', ')}`,
        );

        function deepRemove(val) {
            if (!val || typeof val !== 'object') return val;
            if (Array.isArray(val)) return val.map(deepRemove);
            const out = {};
            for (const [k, v] of Object.entries(val)) {
                if (!toRemove.has(k)) out[k] = deepRemove(v);
            }
            return out;
        }

        chartData = deepRemove(chartData);
        writeFileSync(outputPath, buildStoryContent(chartData), 'utf8');
    }

    execSync(`npx prettier --write "${outputPath}"`, {stdio: 'ignore'});

    console.log(`\nStory created: src/__stories__/Reproduction/${storyFileName}`);
} finally {
    await browser.close();
}
