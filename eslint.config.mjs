import gravityBase from '@gravity-ui/eslint-config';
import gravityClient from '@gravity-ui/eslint-config/client';
import gravityImportOrder from '@gravity-ui/eslint-config/import-order';
import gravityPrettier from '@gravity-ui/eslint-config/prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import storybook from 'eslint-plugin-storybook';
import testingLibrary from 'eslint-plugin-testing-library';
import globals from 'globals';

export default [
    // Ignores (from former .eslintignore)
    {
        ignores: [
            '**/node_modules/**',
            'storybook-static/**',
            'dist/**',
            'playwright/.cache/**',
            'playwright/.cache-docker/**',
            'playwright-report/**',
            'playwright-report-docker/**',
            'test-results/**',
        ],
    },

    // Gravity UI base configs
    ...gravityBase,
    ...gravityClient,
    ...gravityImportOrder,
    ...gravityPrettier,

    // Project-wide custom rules
    {
        plugins: {
            'jsx-a11y': jsxA11y,
        },
        rules: {
            'react/jsx-fragments': ['error', 'element'],
            'react/react-in-jsx-scope': 'off',
            'no-restricted-syntax': [
                'error',
                {
                    selector:
                        "ImportDeclaration[source.value='react'] :matches(ImportNamespaceSpecifier, ImportSpecifier)",
                    message: "Please use import React from 'react' instead.",
                },
                {
                    selector: "TSTypeReference>TSQualifiedName[left.name='React'][right.name='FC']",
                    message: "Don't use React.FC",
                },
            ],
            'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
            'jsx-a11y/no-autofocus': ['error', {ignoreNonDOM: true}],
            'valid-jsdoc': 'off',
            'no-param-reassign': 'off',
            complexity: 'off',
        },
    },

    // TypeScript-specific custom rules
    {
        files: ['**/*.ts', '**/*.mts', '**/*.cts', '**/*.tsx', '**/*.mtsx', '**/*.ctsx'],
        rules: {
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {prefer: 'type-imports', fixStyle: 'separate-type-imports'},
            ],
        },
    },

    // CJS files outside src/ (gulpfile.js, docs scripts, jest.config.js, etc.)
    {
        files: ['**/*.js', '!src/**/*'],
        languageOptions: {
            sourceType: 'script',
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-implicit-globals': 'off',
        },
    },

    // CJS mocks inside src/
    {
        files: ['src/__mocks__/**/*.js'],
        languageOptions: {
            sourceType: 'script',
            globals: {
                ...globals.node,
            },
        },
    },

    // Allow devDependencies for config files
    {
        files: ['*.js', '*.mjs', '*.cjs', 'docs/**/*.js'],
        rules: {
            'import/no-extraneous-dependencies': ['error', {devDependencies: true}],
        },
    },

    // docs/examples — built from root node_modules, all deps live in root package.json
    // @gravity-ui/charts is the package itself, resolved via vite alias — not in any package.json
    {
        files: ['docs/examples/**/*.[jt]s?(x)'],
        rules: {
            'import/no-extraneous-dependencies': 'off',
        },
    },

    // Unit test files
    {
        files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
        ...testingLibrary.configs['flat/react'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
    },

    // Visual test files
    {
        files: ['**/*.visual.test.[jt]s?(x)'],
        rules: {
            'testing-library/prefer-screen-queries': 'off',
        },
    },

    // Storybook
    ...storybook.configs['flat/recommended'],

    // Story files: custom overrides
    {
        files: ['**/__stories__/**/*.[jt]s?(x)'],
        rules: {
            'no-console': 'off',
            // false positive: @storybook/react is used for Meta/StoryFn/StoryObj types
            'storybook/no-renderer-packages': 'off',
        },
    },
];
