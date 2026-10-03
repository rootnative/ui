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
  const {
    Helmet,
    HelmetProvider,
  } = require('expo-router/vendor/react-helmet-async/lib')
  const Head = ({ children }) =>
    React.createElement(Helmet, { defer: false }, children)
  Head.Provider = HelmetProvider
  return { __esModule: true, default: Head }
})
