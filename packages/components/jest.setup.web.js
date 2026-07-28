// Setup for the `web` Jest project (jsdom + react-native-web).
//
// The native project gets all of this from the `react-native` preset. Here
// there is no preset, because the preset's resolver and test environment exist
// to make Metro-style native resolution work — the opposite of what this
// project is for. So the handful of globals RN/RNW expect are defined by hand.

global.__DEV__ = true

// react-native-web's Appearance/useColorScheme reads matchMedia; jsdom has no
// implementation of it at all.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// Same reanimated/worklets mock surface the native suite uses. Its
// `require('react-native')` resolves through this project's moduleNameMapper,
// so `Animated.View` wraps react-native-web's `View` and renders to a real div.
require('@rootnative/inertia/jest-setup')

jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const React = require('react')
  const { Text } = require('react-native')
  return {
    __esModule: true,
    default: ({ name, style, ...props }) =>
      React.createElement(Text, { ...props, style }, name),
  }
})

jest.mock('react-native-safe-area-context', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children, ...props }) =>
      React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 320, height: 640 }),
  }
})

// react-native-svg resolves to its native CommonJS build under Jest (there is
// no `browser` condition here), which reaches for NativeModules. The DOM
// assertions in this project are about `aria-*` on the wrapping views, never
// about SVG geometry, so a structural stub is enough.
jest.mock('react-native-svg', () => {
  const React = require('react')
  const { View } = require('react-native')
  const stub = (name) => {
    const Component = ({ children, ...props }) =>
      React.createElement(View, props, children)
    Component.displayName = name
    return Component
  }
  const Svg = stub('Svg')
  return {
    __esModule: true,
    default: Svg,
    Svg,
    Circle: stub('Circle'),
    Ellipse: stub('Ellipse'),
    G: stub('G'),
    Path: stub('Path'),
    Rect: stub('Rect'),
    Line: stub('Line'),
    Polygon: stub('Polygon'),
    Polyline: stub('Polyline'),
    Defs: stub('Defs'),
    ClipPath: stub('ClipPath'),
    LinearGradient: stub('LinearGradient'),
    RadialGradient: stub('RadialGradient'),
    Stop: stub('Stop'),
    Mask: stub('Mask'),
    Text: stub('Text'),
  }
})
