/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/__tests__/**',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      diagnostics: false,
    }],
    '^.+\\.js$': ['ts-jest', {
      diagnostics: false,
    }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(lodash-es)/)',
  ],
  moduleNameMapper: {
    '^lodash-es$': '<rootDir>/../../node_modules/lodash',
    '^lodash-es/(.*)$': '<rootDir>/../../node_modules/lodash/$1',
    '^@noriginmedia/norigin-spatial-navigation$': '<rootDir>/src/__mocks__/norigin-spatial-navigation.ts',
    '^@noriginmedia/norigin-spatial-navigation-core$': '<rootDir>/../../packages/core/src/index.ts'
  }
};
