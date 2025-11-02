import type {StorybookConfig} from '@storybook/react-webpack5';

const config: StorybookConfig = {
    stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
    addons: [
        '@storybook/preset-scss',
        '@storybook/addon-webpack5-compiler-babel',
        '@storybook/addon-docs',
    ],
    framework: '@storybook/react-webpack5',
    typescript: {
        check: false,
        checkOptions: {},
        reactDocgen: 'react-docgen-typescript',
    },
    core: {
        disableTelemetry: true,
    },
    babel: {
        presets: [
            [
                '@babel/preset-env',
                {
                    targets: {
                        chrome: 100,
                    },
                },
            ],
            '@babel/preset-typescript',
            ['@babel/preset-react', {runtime: 'automatic'}],
        ],
    },
    features: {
        backgrounds: false,
    },
};

export default config;
