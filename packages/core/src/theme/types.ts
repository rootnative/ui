/**
 * Base theme interface that all design systems must implement.
 * Provides a generic contract for colors, typography, and shared tokens.
 * Extend this to create a custom design system theme.
 *
 * @example
 * interface MyTheme extends BaseTheme {
 *   colors: { brand: string; background: string; text: string }
 *   typography: { heading: TypographyToken; body: TypographyToken }
 * }
 */
export interface BaseTheme {
  colors: Record<string, string>
  typography: Record<string, TypographyToken>
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
export type Colors = {
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

/**
 * Material Design 3 type scale with 15 roles across 5 categories (display,
 * headline, title, body, label), plus the 15 MD3 Expressive emphasized
 * variants. Emphasized styles keep the base size/line-height and step the
 * weight up (regular→medium, medium→bold); a few also adjust tracking. The
 * spec additionally varies width/grade on variable fonts, which React Native
 * cannot express — weight (+tracking) is the documented approximation.
 */
export type Typography = {
  displayLarge: TypographyToken
  displayMedium: TypographyToken
  displaySmall: TypographyToken
  headlineLarge: TypographyToken
  headlineMedium: TypographyToken
  headlineSmall: TypographyToken
  titleLarge: TypographyToken
  titleMedium: TypographyToken
  titleSmall: TypographyToken
  bodyLarge: TypographyToken
  bodyMedium: TypographyToken
  bodySmall: TypographyToken
  labelLarge: TypographyToken
  labelMedium: TypographyToken
  labelSmall: TypographyToken
  displayLargeEmphasized: TypographyToken
  displayMediumEmphasized: TypographyToken
  displaySmallEmphasized: TypographyToken
  headlineLargeEmphasized: TypographyToken
  headlineMediumEmphasized: TypographyToken
  headlineSmallEmphasized: TypographyToken
  titleLargeEmphasized: TypographyToken
  titleMediumEmphasized: TypographyToken
  titleSmallEmphasized: TypographyToken
  bodyLargeEmphasized: TypographyToken
  bodyMediumEmphasized: TypographyToken
  bodySmallEmphasized: TypographyToken
  labelLargeEmphasized: TypographyToken
  labelMediumEmphasized: TypographyToken
  labelSmallEmphasized: TypographyToken
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

export interface TypographyToken {
  fontFamily: string
  fontSize: number
  fontWeight: FontWeight
  lineHeight: number
  letterSpacing: number
}

/** Corner radius tokens from none (0) to full (999 for pill shapes). */
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

/**
 * Layout tokens of the MD3 top app bar, in dp. `AppBar` follows the Compose
 * `TopAppBarLayout` geometry: each side slot and the title carry
 * `horizontalPadding`. So the title starts at
 * `max(titleStartInset, horizontalPadding + leading width) + horizontalPadding`
 * from the start edge (16 with no leading content, 56 after a 48dp navigation
 * icon), and the last action ends `horizontalPadding` (4) from the end edge.
 * No pair of values puts the title and the actions on one wider gutter. Pad
 * the bar with `style` for that (AppBar docs, "Align with a Page Gutter").
 */
export interface TopAppBarTokens {
  /** Padding at each end of the top row, and on each side of the title. Default 4. */
  horizontalPadding: number
  /**
   * Smallest start position of the title's own padding, used when the
   * leading slot is narrower. With `horizontalPadding`, also the start inset
   * of the title row of a `medium` or `large` bar. Default 12.
   */
  titleStartInset: number
  /** Height of a `small` or `center-aligned` bar, and of a collapsed `medium` or `large` bar. Default 64. */
  smallContainerHeight: number
  /** Height of a `medium` bar with no subtitle. A subtitle adds 24. Default 112. */
  mediumContainerHeight: number
  /** Height of a `large` bar with no subtitle. A subtitle adds 32. Default 152. */
  largeContainerHeight: number
  /** Height of the row that holds the navigation icon and the actions. Default 64. */
  topRowHeight: number
  /** Smallest height of the leading and trailing slots. Default 48. */
  sideSlotMinHeight: number
  /**
   * Width of the frame around the navigation icon, and the smallest width of
   * custom slot content, so a 40dp `IconButton` takes the 48dp footprint of
   * an MD3 icon button. Default 48.
   */
  iconFrameSize: number
  /** Space under the title of a `medium` bar. Default 24. */
  mediumTitleBottomPadding: number
  /** Space under the title of a `large` bar. Default 28. */
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
   * Spring for fast spatial transitions — small-element position/size/corner
   * morphs that track user input snappily (Switch thumb, Slider press-grow,
   * press shape-morphs). Pronounced overshoot (damping ratio 0.6). Named
   * after the MD3 Expressive motion-physics token scheme
   * (fast/default/slow × spatial/effects).
   */
  springFastSpatial: MotionSpring
  /**
   * Spring for default spatial transitions — standard-size element morphs
   * with a softer, bouncier settle (Checkbox and Radio marks). Damping
   * ratio 0.8.
   */
  springDefaultSpatial: MotionSpring
  /**
   * Spring for slow spatial transitions — large-element position/size/corner
   * morphs (full-screen or container-scale movement). Damping ratio 0.8 at
   * low stiffness.
   */
  springSlowSpatial: MotionSpring
  /**
   * Spring for fast effects transitions — small-element color/opacity
   * feedback (state layers). Critically damped (damping ratio 1.0) — effects
   * springs never overshoot.
   */
  springFastEffects: MotionSpring
  /**
   * Spring for default effects transitions — standard color/opacity changes.
   * Critically damped.
   */
  springDefaultEffects: MotionSpring
  /**
   * Spring for slow effects transitions — large-surface color/opacity
   * changes. Critically damped.
   */
  springSlowEffects: MotionSpring
}
