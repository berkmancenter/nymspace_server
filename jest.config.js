module.exports = {
  testEnvironment: 'node',
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  maxWorkers: 1,
  restoreMocks: true,
  coveragePathIgnorePatterns: ['node_modules', 'src/config', 'src/app.js', 'tests'],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@langchain)/)' // Allow Jest to transform @langchain module
  ],
  moduleNameMapper: {
    '^@langchain/(.*)$': '<rootDir>/node_modules/@langchain/$1',
    '^js-tiktoken/lite$': '<rootDir>/node_modules/js-tiktoken/dist/lite.js'
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  setupFiles: ['<rootDir>/tests/jest.setup.js']
}
