import type {StorybookConfig} from '@storybook/react-vite';

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
};

export default config;
