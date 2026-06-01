/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^@rootnative/core$': '<rootDir>/../core/src/index.ts',
    '^@rootnative/utils$': '<rootDir>/../utils/src/index.ts',
    '^@rootnative/utils/test$': '<rootDir>/../utils/src/test-utils/index.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@expo/vector-icons|react-native-safe-area-context|@material/material-color-utilities)/)',
  ],
}
