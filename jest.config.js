const {createJsWithTsPreset} = require('ts-jest');
const esModules = [
    '@gravity-ui/date-utils',
    'd3',
    'd3-array',
    'internmap',
    'delaunator',
    'robust-predicates',
    // ESM-only dependency of the uikit ColorPicker, loaded by the uikit root entry point
    'colors-named',
].join('|');

module.exports = {
    ...createJsWithTsPreset(),
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {useESM: true, tsconfig: 'tsconfig.jest.json'}],
        '^.+\\.js$': ['babel-jest', {presets: ['@babel/preset-env']}],
    },
    // Any node_modules, including docs/node_modules: docs tests load its typescript, which
    // takes minutes to transform.
    transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
    testMatch: ['**/*.test.[jt]s?(x)'],
    testPathIgnorePatterns: ['.visual.'],
    moduleNameMapper: {
        '\\.(css|scss)$': '<rootDir>/src/__mocks__/styleMock.js',
        '^~core/(.*)$': '<rootDir>/src/core/$1',
    },
    setupFiles: ['<rootDir>/src/setup-jsdom.ts', '<rootDir>/src/setup-plugins.ts'],
};
