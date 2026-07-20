/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // ThemeProvider mounts inertia's MotionConfig — its jest-setup supplies the
  // worklets/Reanimated mock surface (and the RN 0.81 Text override).
  setupFiles: ['@rootnative/inertia/jest-setup'],
  transformIgnorePatterns: [
    'node_modules/(?!(@material/material-color-utilities|react-native|@react-native|@react-native-community|@rootnative/inertia|react-native-worklets)/)',
  ],
}
