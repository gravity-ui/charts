#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {argv, cwd, exit, stderr, stdout} from 'node:process';

// React 18 is the default in package.json; this script swaps the dev
// environment to React 17 or React 19 for cross-version Playwright runs.
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
    stderr.write(
        `Usage: node scripts/install-react.mjs <17|19>\nGot: ${version ?? '(nothing)'}\n`,
    );
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
