const {createJsWithTsPreset} = require('ts-jest');
const esModules = [
    '@gravity-ui/date-utils',
    'd3',
    'd3-array',
    'internmap',
    'delaunator',
    'robust-predicates',
].join('|');

module.exports = {
    ...createJsWithTsPreset(),
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {useESM: true}],
        '^.+\\.js$': ['babel-jest', {presets: ['@babel/preset-env']}],
    },
    transformIgnorePatterns: [`<rootDir>/node_modules/(?!${esModules})`],
    testMatch: ['**/*.test.[jt]s?(x)'],
    testPathIgnorePatterns: ['.visual.'],
    moduleNameMapper: {
        '\\.(css|scss)$': '<rootDir>/src/__mocks__/styleMock.js',
    },
    setupFiles: ['<rootDir>/src/setup-jsdom.ts'],
};
