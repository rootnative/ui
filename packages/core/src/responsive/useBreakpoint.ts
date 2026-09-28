import { useWindowDimensions } from './useWindowDimensions'

/**
 * Material Design 3 window size classes.
 * @see https://m3.material.io/foundations/layout/applying-layout/window-size-classes
 */
export type Breakpoint =
  | 'compact'
  | 'medium'
  | 'expanded'
  | 'large'
  | 'extraLarge'

export const breakpoints = {
  compact: 0,
  medium: 600,
  expanded: 840,
  large: 1200,
  extraLarge: 1600,
} as const

function getBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints.extraLarge) return 'extraLarge'
  if (width >= breakpoints.large) return 'large'
  if (width >= breakpoints.expanded) return 'expanded'
  if (width >= breakpoints.medium) return 'medium'
  return 'compact'
}

/**
 * Returns the current Material Design 3 window size class based on viewport width.
 * Reactively updates when the window is resized.
 *
 * **Hydration-safe by construction.** A static export renders on a server with
 * no DOM, where react-native-web's `Dimensions` is hard-wired to `width: 0`,
 * so every breakpoint resolves to `compact` and that is what ships in the
 * HTML. On the client `Dimensions` reports the real width immediately, so
 * without care the first client render disagrees with the markup it is
 * hydrating — and **React does not repair that**. Measured against React
 * 19.2.3: a `className` / `style` mismatch is adopted from the server DOM,
 * left on screen, and reported through *zero* recoverable errors. A tablet
 * gets the phone layout, permanently, with no console signal.
 *
 * So this hook reports `compact` for as long as the client is hydrating,
 * matching the markup exactly, and switches to the measured breakpoint on the
 * re-render React schedules once hydration finishes. The correction is an
 * ordinary update, which *does* patch the DOM. The guard lives in this
 * package's `useWindowDimensions`, which this hook reads. Use that hook, not
 * the `react-native` one, when a layout needs the raw width.
 *
 * **It costs nothing where there is no hydration.** On native, and on a
 * single-page web build, `getServerSnapshot` is never called, so the measured
 * breakpoint is returned from the first render with no extra pass. Consumers
 * need no `useHydrated` gate of their own, and neither does `Grid`, which
 * resolves a breakpoint map internally and gives a consumer nowhere to put
 * one.
 *
 * @example
 * const breakpoint = useBreakpoint()
 * const columns = breakpoint === 'compact' ? 2 : 4
 */
export function useBreakpoint(): Breakpoint {
  // The hydration width is 0, which resolves through the same table rather
  // than a hard-coded `'compact'`, so a change to `breakpoints` cannot make
  // the markup and the hydration pass disagree.
  const { width } = useWindowDimensions()
  return getBreakpoint(width)
}
