const baseConfig = require('./jest.config');

module.exports = {
    ...baseConfig,
    setupFiles: [],
    testMatch: ['<rootDir>/scripts/**/*.artifact-test.js'],
    testPathIgnorePatterns: [],
};
