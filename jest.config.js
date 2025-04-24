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
        '^.+\\.(js|ts)?$': ['ts-jest', {useESM: true}],
    },
    transformIgnorePatterns: [`<rootDir>/node_modules/(?!${esModules})`],
    testMatch: ['**/*.test.[jt]s?(x)'],
    testPathIgnorePatterns: ['.visual.'],
};
