// Explicit re-exports, not `export *`. The wildcard form meant anything added
// to a sub-barrel became public API by accident; from 1.0 the public surface is
// chosen here, in one place, and widening it is a deliberate edit.
export type {
  BaseTheme,
  Colors,
  Elevation,
  ElevationLevel,
  FontWeight,
  MaterialTheme,
  Motion,
  MotionSpring,
  ShadowOffset,
  Shape,
  Spacing,
  StateLayer,
  Theme,
  TopAppBarTokens,
  Typography,
  TypographyToken,
} from './theme'
export {
  applyRoundness,
  darkTheme,
  defaultTopAppBarTokens,
  defineTheme,
  lightTheme,
  motionTransitions,
} from './theme'

export { ThemeProvider, useIconResolver, useTheme } from './provider'
export type {
  IconRenderProps,
  IconResolver,
  IconSource,
  ThemeProviderProps,
} from './provider'

export { breakpoints, useBreakpoint, useBreakpointValue } from './responsive'
export type { Breakpoint, BreakpointValues } from './responsive'

export { material } from './presets'
