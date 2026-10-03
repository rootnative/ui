// Inertia's jest-setup provides the shared mock surface this package used to
// hand-roll:
//   - the RN 0.81 Text override (default mockComponent crashes on arrow
//     function components exported by RN's Flow `component` syntax)
//   - react-native-worklets stub
//   - the Reanimated mock — STATIC RENDER with stable `useSharedValue`:
//     `useAnimatedStyle`/`useAnimatedProps` run the worklet once per render
//     and return a plain object. Mutating a shared value after mount does NOT
//     re-run the worklet.
//
// What this means for tests:
//   ✅ assert at-rest structure / role / accessibility / static styles
//   ✅ assert static color, layout that comes from props, not shared values
//   ❌ don't fire press/hover/focus and assert post-interaction styles
//      coming from `useSharedValue` + `withTiming`/`withSpring` — they will
//      silently read as the at-rest values
//
// If you need to assert a hover/press visual, derive the asserted style from
// component props instead (e.g. via `containerColor`) so it doesn't go
// through reanimated's animated style.
require('@rootnative/inertia/jest-setup')

jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const React = require('react')
  return {
    __esModule: true,
    MaterialDesignIcons: ({ name, style, ...props }) =>
      React.createElement('RCTText', { ...props, style }, name),
  }
})

jest.mock('react-native-safe-area-context', () => {
  const React = require('react')
  const ZERO = { top: 0, right: 0, bottom: 0, left: 0 }
  // Real context, default `null`, so `SafeAreaView` takes the native branch
  // outside a provider and the padding branch inside one — the same split as
  // the real package.
  const SafeAreaInsetsContext = React.createContext(null)
  return {
    SafeAreaInsetsContext,
    SafeAreaProvider: ({ children, initialMetrics }) =>
      React.createElement(
        SafeAreaInsetsContext.Provider,
        { value: initialMetrics?.insets ?? ZERO },
        children,
      ),
    SafeAreaView: ({ children, ...props }) =>
      React.createElement('View', props, children),
    useSafeAreaInsets: () => React.useContext(SafeAreaInsetsContext) ?? ZERO,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 320, height: 640 }),
  }
})
