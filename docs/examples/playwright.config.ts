import {resolve} from 'path';

import {defineConfig} from '@playwright/test';

// Vite's default preview port; a nested path also exercises deployment-relative assets.
const localURL = new URL('http://127.0.0.1:4173/docs-preview/');
const baseURL = process.env.DOCS_BASE_URL?.replace(/\/?$/, '/') || localURL.href;

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    workers: 2,
    forbidOnly: Boolean(process.env.CI),
    outputDir: '../../test-results/docs-examples',
    reporter: [
        ['list'],
        ['html', {open: 'never', outputFolder: resolve(__dirname, '../../playwright-report-docs')}],
    ],
    use: {
        browserName: 'chromium',
        baseURL,
        viewport: {width: 1440, height: 1000},
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    webServer: process.env.DOCS_BASE_URL
        ? undefined
        : {
              command: `npx vite preview --outDir dist-docs --host ${localURL.hostname} --port ${localURL.port} --base ${localURL.pathname} --strictPort`,
              cwd: resolve(__dirname, '../..'),
              url: localURL.href,
          },
});
