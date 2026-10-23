// Setup for the `web` Jest project (jsdom + react-native-web). No preset, so
// the globals react-native-web expects are defined by hand.
global.__DEV__ = true

// `expo-router/head` wraps the vendored react-helmet-async `Helmet` in a
// focus check that needs a navigation container. The test wants the renderer,
// not the router, so the mock is the same `Helmet` with the focus check
// removed. A change in the vendored copy still reaches this test.
//
// `defer: false` makes `Helmet` write the DOM in the commit instead of the
// next animation frame, so a test can read `document.head` right after
// `render` with no frame to wait for.
jest.mock('expo-router/head', () => {
  const React = require('react')
  const path = require('path')
  // expo-router 58 restricts its `exports` map, and `vendor/` is not in it,
  // so the vendored copy is reached through the package directory.
  const helmetLib = path.join(
    path.dirname(require.resolve('expo-router/package.json')),
    'vendor/react-helmet-async/lib',
  )
  const { Helmet, HelmetProvider } = require(helmetLib)
  const Head = ({ children }) =>
    React.createElement(Helmet, { defer: false }, children)
  Head.Provider = HelmetProvider
  return { __esModule: true, default: Head }
})

// The router hooks `PageHead` and `RouteHead` read. A test sets the route
// through these globals; a navigator is not part of what the test checks.
global.__seoRoute = { pathname: '/', focused: true }
jest.mock('expo-router', () => ({
  __esModule: true,
  usePathname: () => global.__seoRoute.pathname,
  useIsFocused: () => global.__seoRoute.focused,
}))

// `Picture` renders `expo-image` on native only, and the real one needs the
// native module. The stub keeps the props, so a test reads them.
jest.mock('expo-image', () => {
  const React = require('react')
  const Image = (props) => React.createElement('ExpoImage', props)
  return { __esModule: true, Image }
})
