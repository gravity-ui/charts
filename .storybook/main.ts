import path from 'node:path';
import {fileURLToPath} from 'node:url';

import type {StorybookConfig} from '@storybook/react-vite';

// eslint-disable-next-line
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
    addons: ['@storybook/addon-docs'],
    framework: '@storybook/react-vite',
    typescript: {
        check: false,
        reactDocgen: 'react-docgen-typescript',
    },
    core: {
        disableTelemetry: true,
    },
    async viteFinal(config) {
        config.resolve ??= {};
        config.resolve.alias = {
            ...((config.resolve.alias as Record<string, string>) ?? {}),
            '~core': path.resolve(__dirname, '../src/core'),
        };
        return config;
    },
};

export default config;
