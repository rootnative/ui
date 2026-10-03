const transformIgnorePatterns = [
  'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo-router)/)',
]

// Two projects, for the same reason as `packages/components`: a
// react-native-preset suite sees the React prop, never the DOM. `Heading` has
// one job, to render `<h2>` and not `<div>`, and only the `web` project can
// see which one react-native-web wrote.
/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: 'native',
      preset: '@react-native/jest-preset',
      rootDir: __dirname,
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      setupFiles: ['<rootDir>/jest.setup.js'],
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
        '^react-native$': 'react-native-web',
      },
      transformIgnorePatterns,
    },
  ],
}
