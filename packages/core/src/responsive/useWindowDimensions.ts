import { useSyncExternalStore } from 'react'
import { useWindowDimensions as useMeasuredWindowDimensions } from 'react-native'
import type { ScaledSize } from 'react-native'

/**
 * A store that never changes, read only for *when* React reads it.
 *
 * React calls `getServerSnapshot` during server rendering **and** through the
 * hydration pass, then `getSnapshot` for every render after. So this is
 * `true` exactly while the client is reproducing the server's markup, and
 * `false` everywhere else — including the very first render of a client-only
 * tree, which never hydrates.
 */
const subscribeToNothing = () => () => {}
const notHydrating = () => false
const isHydratingOnServer = () => true

/**
 * The window react-native-web's `Dimensions` reports on a server with no DOM
 * (`dist/exports/Dimensions/index.js`). Hydration must reproduce it exactly.
 */
const SERVER_WINDOW: ScaledSize = Object.freeze({
  width: 0,
  height: 0,
  scale: 1,
  fontScale: 1,
})

/**
 * Returns the window size, the same as `useWindowDimensions` from
 * `react-native`, but safe to use in a static web export.
 *
 * **Use this instead of the `react-native` hook for any value that reaches a
 * style or the tree.** A static export (`web.output: 'static'`) renders on a
 * server with no DOM, where react-native-web measures a 0 by 0 window. The
 * client measures the real window on its first render, so the `react-native`
 * hook disagrees with the markup it hydrates, and React 19 keeps the server's
 * style with no error. A carousel slot sized from the width, or a hero height
 * set as a fraction of it, then keeps the layout of a 0 wide window until the
 * reader resizes the window.
 *
 * This hook returns the server's 0 by 0 window while the client hydrates, and
 * the measured window on the re-render React schedules after hydration. That
 * re-render is an ordinary update, which does patch the DOM. On native, and on
 * a single-page web build, nothing hydrates, so the measured window comes back
 * from the first render with no extra pass.
 *
 * `useBreakpoint` reads this hook, so a breakpoint and a raw width cannot
 * disagree during hydration.
 *
 * @example
 * const { width } = useWindowDimensions()
 * const heroHeight = width * 0.56
 */
export function useWindowDimensions(): ScaledSize {
  const measured = useMeasuredWindowDimensions()
  const hydrating = useSyncExternalStore(
    subscribeToNothing,
    notHydrating,
    isHydratingOnServer,
  )
  return hydrating ? SERVER_WINDOW : measured
}
