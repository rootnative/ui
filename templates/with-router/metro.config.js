const { getDefaultConfig } = require('expo/metro-config')
const { withRootNative } = require('@rootnative/web-expo/metro.cjs')

// On the web, `withRootNative` sends each `react-native` import to
// `@rootnative/web`. On iOS and Android, it changes nothing.
//
// To use react-native-web: run `npx expo install react-native-web`, remove
// `@rootnative/web-expo`, and export `getDefaultConfig(__dirname)` here.
module.exports = withRootNative(getDefaultConfig(__dirname))
