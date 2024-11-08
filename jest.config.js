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
    // verbose: true,
    // preset: 'ts-jest',
    // testEnvironment: 'jsdom',
    // transform: {
    //     '^.+\\.(js|ts)?$': 'ts-jest',
    // },
    // modulePathIgnorePatterns: ['<rootDir>/build/'],
    // transformIgnorePatterns: [`<rootDir>/node_modules/(?!${esModules})`],
    // moduleNameMapper: {
    //     '^.+\\.(css|scss)$': '<rootDir>/test-utils/style.mock.ts',
    // },
    // setupFiles: ['<rootDir>/test-utils/globals.mock.ts'],
    // testPathIgnorePatterns: ['.visual.'],
    ...createJsWithTsPreset(),
    transform: {
        '^.+\\.(js|ts)?$': ['ts-jest', {useESM: true}],
    },
    transformIgnorePatterns: [`<rootDir>/node_modules/(?!${esModules})`],
    testMatch: ['**/*.test.[jt]s?(x)'],
};
