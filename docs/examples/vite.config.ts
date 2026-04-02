import {resolve} from 'path';

import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig({
    plugins: [react()],
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
