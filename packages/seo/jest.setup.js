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
