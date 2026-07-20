/**
 * Base theme interface that all design systems must implement.
 * Provides a generic contract for colors, typography, and shared tokens.
 * Extend this to create a custom design system theme.
 *
 * @example
 * interface MyTheme extends BaseTheme {
 *   colors: { brand: string; background: string; text: string }
 *   typography: { heading: TextStyle; body: TextStyle }
 * }
 */
export interface BaseTheme {
  colors: Record<string, string>
  typography: Record<string, TextStyle>
  shape: Shape
  spacing: Spacing
  stateLayer: StateLayer
  elevation: Elevation
  motion: Motion
  [key: string]: unknown
}

/**
 * Material Design 3 theme object containing all design tokens.
 * Access via `useTheme()` hook or pass to `ThemeProvider`.
 *
 * @see https://m3.material.io/foundations/design-tokens
 */
export interface Theme extends BaseTheme {
  colors: Colors
  typography: Typography
  topAppBar?: TopAppBarTokens
}

/**
 * Alias for {@link Theme}. Both reference the same MD3 type — use
 * `MaterialTheme` when you need to distinguish from a custom `BaseTheme`
 * in codebases that support multiple design systems.
 */
export type MaterialTheme = Theme

/** Material Design 3 color roles. All values are CSS color strings (hex, rgb, etc.). */
export interface Colors {
  [key: string]: string
  primary: string
  onPrimary: string
  primaryContainer: string
  onPrimaryContainer: string
  primaryFixed: string
  onPrimaryFixed: string
  primaryFixedDim: string
  onPrimaryFixedVariant: string
  secondary: string
  onSecondary: string
  secondaryContainer: string
  onSecondaryContainer: string
  secondaryFixed: string
  onSecondaryFixed: string
  secondaryFixedDim: string
  onSecondaryFixedVariant: string
  tertiary: string
  onTertiary: string
  tertiaryContainer: string
  onTertiaryContainer: string
  tertiaryFixed: string
  onTertiaryFixed: string
  tertiaryFixedDim: string
  onTertiaryFixedVariant: string
  error: string
  onError: string
  errorContainer: string
  onErrorContainer: string
  background: string
  onBackground: string
  surface: string
  surfaceDim: string
  surfaceBright: string
  surfaceContainerLowest: string
  surfaceContainerLow: string
  surfaceContainer: string
  surfaceContainerHigh: string
  surfaceContainerHighest: string
  onSurface: string
  surfaceVariant: string
  onSurfaceVariant: string
  outline: string
  outlineVariant: string
  surfaceTint: string
  shadow: string
  scrim: string
  inverseSurface: string
  inverseOnSurface: string
  inversePrimary: string
}

/** Material Design 3 type scale with 15 roles across 5 categories (display, headline, title, body, label). */
export interface Typography {
  [key: string]: TextStyle
  displayLarge: TextStyle
  displayMedium: TextStyle
  displaySmall: TextStyle
  headlineLarge: TextStyle
  headlineMedium: TextStyle
  headlineSmall: TextStyle
  titleLarge: TextStyle
  titleMedium: TextStyle
  titleSmall: TextStyle
  bodyLarge: TextStyle
  bodyMedium: TextStyle
  bodySmall: TextStyle
  labelLarge: TextStyle
  labelMedium: TextStyle
  labelSmall: TextStyle
}

export type FontWeight =
  | 'normal'
  | 'bold'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900'

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: FontWeight
  lineHeight: number
  letterSpacing: number
}

/** Corner radius tokens from none (0) to full (9999 for pill shapes). */
export interface Shape {
  /** Global multiplier for corner radii. `0` = sharp, `1` = default MD3, `2` = double rounding. Does not affect `cornerNone` or `cornerFull`. */
  roundness: number
  cornerNone: number
  cornerExtraSmall: number
  cornerSmall: number
  cornerMedium: number
  cornerLarge: number
  cornerExtraLarge: number
  cornerFull: number
}

/** Spacing scale in density-independent pixels (dp). Use as `theme.spacing.md` or with layout components. */
export interface Spacing {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
}

export interface TopAppBarTokens {
  horizontalPadding: number
  titleStartInset: number
  smallContainerHeight: number
  mediumContainerHeight: number
  largeContainerHeight: number
  topRowHeight: number
  sideSlotMinHeight: number
  iconFrameSize: number
  mediumTitleBottomPadding: number
  largeTitleBottomPadding: number
}

/** Opacity values for interactive state feedback (press, hover, focus, drag, disabled). */
export interface StateLayer {
  pressedOpacity: number
  focusedOpacity: number
  hoveredOpacity: number
  draggedOpacity: number
  /** Opacity applied to content (text, icons) in disabled components. MD3: 38% onSurface. */
  disabledOpacity: number
  /** Opacity applied to container fills of disabled components. MD3: 12% onSurface. */
  disabledContainerOpacity: number
}

/** Shadow/elevation levels (0–5) for surface hierarchy. */
export interface Elevation {
  level0: ElevationLevel
  level1: ElevationLevel
  level2: ElevationLevel
  level3: ElevationLevel
  level4: ElevationLevel
  level5: ElevationLevel
}

export interface ElevationLevel {
  shadowColor: string
  shadowOffset: ShadowOffset
  shadowOpacity: number
  shadowRadius: number
  elevation: number
}

export interface ShadowOffset {
  width: number
  height: number
}

/**
 * Physics config for spring-driven transitions. Uses the react-spring
 * vocabulary (`tension`/`friction`/`mass`) — the same surface
 * `@rootnative/inertia` springs accept, mapped 1:1 onto Reanimated's
 * `stiffness`/`damping`/`mass`.
 */
export interface MotionSpring {
  tension: number
  friction: number
  mass: number
}

/** Duration (in ms) and easing tokens for animations following MD3 motion guidelines. */
export interface Motion {
  durationShort1: number
  durationShort2: number
  durationShort3: number
  durationShort4: number
  durationMedium1: number
  durationMedium2: number
  durationMedium3: number
  durationMedium4: number
  durationLong1: number
  durationLong2: number
  durationLong3: number
  durationLong4: number
  durationExtraLong1: number
  durationExtraLong2: number
  durationExtraLong3: number
  durationExtraLong4: number
  easingLinear: string
  easingStandard: string
  easingStandardAccelerate: string
  easingStandardDecelerate: string
  easingEmphasized: string
  easingEmphasizedAccelerate: string
  easingEmphasizedDecelerate: string
  /**
   * Spring for fast spatial transitions — selection morphs that track user
   * input snappily (Switch thumb, Slider press-grow). Slight overshoot,
   * ~0.85 damping ratio. Named after the MD3 Expressive motion-physics token
   * scheme (fast/default/slow × spatial/effects).
   */
  springFastSpatial: MotionSpring
  /**
   * Spring for default spatial transitions — selection morphs with a softer,
   * bouncier settle (Checkbox and Radio marks).
   */
  springDefaultSpatial: MotionSpring
}
