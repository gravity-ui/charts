import {resolve} from 'path';

import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

import {readExample} from './read-examples';

export default defineConfig({
    base: './',
    plugins: [
        react(),
        {
            name: 'example-source',
            load(id) {
                if (!id.endsWith('?example-source')) return undefined;
                const file = id.slice(0, -'?example-source'.length);
                this.addWatchFile(file);
                return `export default ${JSON.stringify(readExample(file).code)};`;
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
