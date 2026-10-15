// Override RN's Text mock — the default mockComponent crashes on arrow function
// components exported by RN's Flow `component` syntax.
jest.mock('react-native/Libraries/Text/Text', () => {
  const React = require('react')
  const Text = React.forwardRef(({ children, ...props }, ref) =>
    React.createElement('RCTText', { ...props, ref }, children),
  )
  Text.displayName = 'Text'
  return { __esModule: true, default: Text }
})

// `PageHead` renders nothing on native, so the head module is never reached.
// The stub keeps the native project free of expo-router's module graph.
jest.mock('expo-router/head', () => ({
  __esModule: true,
  default: () => null,
}))

// `PageHead` and `RouteHead` return before they read the router on native.
// The stub keeps `expo-router` itself out of the native project too.
jest.mock('expo-router', () => ({
  __esModule: true,
  usePathname: () => '/',
  useIsFocused: () => true,
}))

// `Picture` renders `expo-image` on native only, and the real one needs the
// native module. The stub keeps the props, so a test reads them.
jest.mock('expo-image', () => {
  const React = require('react')
  const Image = (props) => React.createElement('ExpoImage', props)
  return { __esModule: true, Image }
})
