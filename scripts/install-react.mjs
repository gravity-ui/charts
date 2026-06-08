#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {argv, cwd, exit, stderr, stdout} from 'node:process';

// React 18 is the default in package.json; this script swaps the dev
// environment to React 17 or React 19 for cross-version Playwright runs.
//
// When promoting the default React version, or adding a new edge,
// update every place the version is encoded:
//   1. package.json devDeps (react, react-dom, @types/react,
//      @types/react-dom) + regenerate package-lock.json.
//   2. SUPPORTED below — drop the entry that's now the default, add
//      any new edge.
//   3. npm scripts in package.json (playwright:react*,
//      playwright:docker:react*) — they encode REACT_VERSION.
//   4. REACT_VERSION validation in scripts/playwright-docker.sh.
//   5. Gated jobs in .github/workflows/pr-visual-tests.yml
//      (visual_tests_react_* / visual_tests_perf_react_*).
//   6. If React 17 support is dropped, also remove the
//      'react-dom/client' Vite alias in playwright/playwright.config.ts
//      and the playwright/shims/react-dom-client.ts shim.
const SUPPORTED = {
    17: {
        react: '17',
        reactDom: '17',
        typesReact: '17',
        typesReactDom: '17',
        testingLibraryReact: '12',
    },
    19: {
        react: '19',
        reactDom: '19',
        typesReact: '19',
        typesReactDom: '19',
        testingLibraryReact: '16',
    },
};

const version = argv[2];

if (!version || !SUPPORTED[version]) {
    stderr.write(`Usage: node scripts/install-react.mjs <17|19>\nGot: ${version ?? '(nothing)'}\n`);
    exit(1);
}

const pins = SUPPORTED[version];
const pkgs = [
    `react@${pins.react}`,
    `react-dom@${pins.reactDom}`,
    `@types/react@${pins.typesReact}`,
    `@types/react-dom@${pins.typesReactDom}`,
    `@testing-library/react@${pins.testingLibraryReact}`,
];

stdout.write(`Installing React ${version} set: ${pkgs.join(' ')}\n`);

// Back up package-lock.json so npm install respects pinned versions of unrelated
// deps (e.g. @playwright/test) but doesn't leave a dirty lockfile behind.
const lockfilePath = resolve(cwd(), 'package-lock.json');
let lockfileBackup;
try {
    lockfileBackup = readFileSync(lockfilePath);
} catch (err) {
    stderr.write(`Cannot read ${lockfilePath}: ${err.message}\n`);
    exit(1);
}

const result = spawnSync('npm', ['install', '--no-save', '--no-audit', '--no-fund', ...pkgs], {
    stdio: 'inherit',
});

writeFileSync(lockfilePath, lockfileBackup);

exit(result.status ?? 1);
