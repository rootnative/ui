const workspaceAliases = {
  '^@rootnative/core$': '<rootDir>/../core/src/index.ts',
  '^@rootnative/utils$': '<rootDir>/../utils/src/index.ts',
  '^@rootnative/utils/test$': '<rootDir>/../utils/src/test-utils/index.ts',
}

const transformIgnorePatterns = [
  'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@expo/vector-icons|react-native-safe-area-context|@material/material-color-utilities|@rootnative/inertia|react-native-worklets)/)',
]

// Two projects, because a react-native-preset suite is structurally blind to
// what react-native-web renders. The `aria-*` regression (see
// src/__tests__/web/aria.web.test.tsx) shipped with the whole native suite
// green: RNTL asserts on the React prop, so `accessibilityState` passed every
// assertion while RNW silently dropped it on the way to the DOM. The `web`
// project is the only thing here that reads real DOM attributes.
/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'native',
      preset: 'react-native',
      rootDir: __dirname,
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      setupFiles: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: workspaceAliases,
      transformIgnorePatterns,
      testPathIgnorePatterns: [
        '/node_modules/',
        '<rootDir>/src/__tests__/web/',
      ],
    },
    {
      displayName: 'web',
      rootDir: __dirname,
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/__tests__/web/**/*.test.tsx'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      setupFiles: ['<rootDir>/jest.setup.web.js'],
      transform: { '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest' },
      moduleNameMapper: {
        ...workspaceAliases,
        // The whole point of this project: resolve `react-native` the way a
        // Metro/webpack web build does, so components render to real DOM.
        '^react-native$': 'react-native-web',
      },
      transformIgnorePatterns,
    },
  ],
}
