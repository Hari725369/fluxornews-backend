module.exports = {
    testEnvironment: 'node',
    verbose: true,
    testTimeout: 10000,
    roots: ['<rootDir>/tests'],
    setupFilesAfterEnv: [], // Add setup file if needed later for DB connection/teardown
};
