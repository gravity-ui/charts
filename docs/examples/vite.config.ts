import {resolve} from 'path';

import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

import {verifyExampleFiles} from '../scripts/verify-examples';

import meta from './src/charts/meta.json';

export default defineConfig({
    plugins: [
        react(),
        {
            name: 'verify-example-files',
            buildStart() {
                verifyExampleFiles(meta, resolve(__dirname, 'src/charts'));
            },
        },
    ],
    build: {
        outDir: resolve(__dirname, 'dist'),
        cssCodeSplit: false,
        rollupOptions: {
            input: resolve(__dirname, 'src/index.tsx'),
            output: {
                entryFileNames: 'chart-examples.js',
                assetFileNames: 'chart-examples[extname]',
                format: 'es',
                inlineDynamicImports: true,
            },
        },
    },
    resolve: {
        alias: {
            '~core': resolve(__dirname, '../../src/core'),
            '@gravity-ui/charts': resolve(__dirname, '../../src/index.ts'),
        },
    },
});
