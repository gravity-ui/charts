import {resolve} from 'path';

import type {PlaywrightTestConfig} from '@playwright/experimental-ct-react';
import {defineConfig, devices} from '@playwright/experimental-ct-react';

function pathFromRoot(p: string) {
    return resolve(__dirname, '../', p);
}

const reporter: PlaywrightTestConfig['reporter'] = [];

reporter.push(
    ['list'],
    [
        'html',
        {
            open: process.env.CI ? 'never' : 'on-failure',
            outputFolder: resolve(
                process.cwd(),
                process.env.IS_DOCKER ? 'playwright-report-docker' : 'playwright-report',
            ),
        },
    ],
);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
    testDir: pathFromRoot('src'),
    testMatch: '**/__tests__/**/*.visual.test.tsx',
    updateSnapshots: process.env.UPDATE_REQUEST ? 'all' : 'missing',
    snapshotPathTemplate:
        '{testDir}/{testFileDir}/../__snapshots__/{testFileName}-snapshots/{arg}{-projectName}-linux{ext}',
    /* Maximum time one test can run for. */
    timeout: 10 * 1000,
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: Boolean(process.env.CI),
    /* Retry on CI only */
    retries: process.env.CI ? 1 : 0,
    // TODO: return 8 workers after https://github.com/gravity-ui/charts/issues/424
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 4 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter,
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        testIdAttribute: 'data-qa',
        ctViteConfig: {
            resolve: {
                alias: {
                    '~core': pathFromRoot('src/core'),
                },
            },
        },
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'retain-on-first-failure',
        headless: true,
        screenshot: 'only-on-failure',
        timezoneId: 'UTC',
        ctCacheDir: process.env.IS_DOCKER ? '.cache-docker' : '.cache',
    },
    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                deviceScaleFactor: 2,
                launchOptions: {
                    ignoreDefaultArgs: ['--hide-scrollbars'],
                },
            },
            grepInvert: /@perf|@desktop-touch/,
        },
        {
            name: 'chromium-perf',
            use: {
                ...devices['Desktop Chrome'],
                deviceScaleFactor: 2,
                launchOptions: {
                    ignoreDefaultArgs: ['--hide-scrollbars'],
                },
            },
            grep: /@perf/,
            workers: 1,
        },
        {
            name: 'chromium-desktop-touch',
            use: {
                ...devices['Desktop Chrome'],
                deviceScaleFactor: 2,
                hasTouch: true,
                isMobile: false,
                launchOptions: {
                    ignoreDefaultArgs: ['--hide-scrollbars'],
                },
            },
            grep: /@desktop-touch/,
        },
        {
            name: 'webkit',
            use: {
                ...devices['Desktop Safari'],
                deviceScaleFactor: 2,
                launchOptions: {
                    ignoreDefaultArgs: ['--hide-scrollbars'],
                },
            },
            grep: /@webkit/,
        },
    ],
};

export default defineConfig(config);
