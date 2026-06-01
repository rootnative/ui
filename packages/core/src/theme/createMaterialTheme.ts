import {
  argbFromHex,
  hexFromArgb,
  Hct,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeFruitSalad,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeRainbow,
  SchemeTonalSpot,
  SchemeVibrant,
  MaterialDynamicColors,
  DynamicScheme,
  TonalPalette,
  Variant,
} from '@material/material-color-utilities'
import { applyRoundness } from './applyRoundness'
import { lightTheme } from './light'
import { defaultTopAppBarTokens } from './topAppBar'
import type { Colors, Theme, Typography } from './types'
import { defaultTypography } from './typography'

/**
 * MD3 scheme variant. Each is a spec-defined recipe for deriving the palette
 * from the seed color. `'tonalSpot'` is the Material You default used on
 * Android 12+.
 */
export type ThemeVariant =
  | 'tonalSpot'
  | 'neutral'
  | 'vibrant'
  | 'expressive'
  | 'fidelity'
  | 'content'
  | 'monochrome'
  | 'rainbow'
  | 'fruitSalad'

export type ContrastLevel = 'standard' | 'medium' | 'high'

/**
 * Custom override (NOT part of the MD3 spec). Forces neutral palettes to
 * chroma 0 for pure-grey surfaces while keeping the variant's colorful
 * primary/secondary/tertiary palettes. Use this for an OLED-near-black /
 * carbon aesthetic. For a fully spec-legal monochrome theme prefer
 * `variant: 'monochrome'`.
 */
export type SurfaceTone = 'spec' | 'neutral'

export interface SeedAdjustments {
  /** Override HCT chroma for the primary palette. Variant defaults are spec-defined (TonalSpot uses `36`). Raise for richer container colors. NOT part of MD3 spec. */
  primary?: number
  /** Override HCT chroma for the secondary palette. Variant defaults are spec-defined (TonalSpot uses `16`). Raise for more saturated secondary containers. NOT part of MD3 spec. */
  secondary?: number
}

export interface CreateMaterialThemeOptions {
  /** MD3 scheme variant. Each is a spec-defined recipe; pick the one whose colorfulness/hue-shifting matches your brand. @default 'tonalSpot' */
  variant?: ThemeVariant
  /** Custom font family applied to all typography styles. When omitted, platform defaults are used (Roboto on Android, System on iOS). */
  fontFamily?: string
  /** Global corner-radius multiplier. `0` = sharp, `1` = default MD3, `2` = double rounding. @default 1 */
  roundness?: number
  /** MD3 contrast preset. `'standard'` matches the spec; `'medium'` and `'high'` boost on/container contrast for accessibility. @default 'standard' */
  contrastLevel?: ContrastLevel
  /** **Custom override (deviates from MD3 spec).** `'spec'` keeps the variant's neutral palette as-is. `'neutral'` flattens neutral chroma to 0 for pure-grey / OLED-near-black surfaces. Prefer `variant: 'monochrome'` for spec-legal monochrome themes. @default 'spec' */
  surfaceTone?: SurfaceTone
  /** **Custom override (deviates from MD3 spec).** Per-palette HCT chroma overrides for cases where the spec-defined variant chromas come out too pastel or too vivid for your brand. */
  seedAdjustments?: SeedAdjustments
}

const CONTRAST_VALUES: Record<ContrastLevel, number> = {
  standard: 0,
  medium: 0.5,
  high: 1.0,
}

const VARIANT_ENUM: Record<ThemeVariant, Variant> = {
  tonalSpot: Variant.TONAL_SPOT,
  neutral: Variant.NEUTRAL,
  vibrant: Variant.VIBRANT,
  expressive: Variant.EXPRESSIVE,
  fidelity: Variant.FIDELITY,
  content: Variant.CONTENT,
  monochrome: Variant.MONOCHROME,
  rainbow: Variant.RAINBOW,
  fruitSalad: Variant.FRUIT_SALAD,
}

function buildBaseScheme(
  variant: ThemeVariant,
  sourceHct: Hct,
  isDark: boolean,
  contrast: number,
): DynamicScheme {
  switch (variant) {
    case 'tonalSpot':
      return new SchemeTonalSpot(sourceHct, isDark, contrast)
    case 'neutral':
      return new SchemeNeutral(sourceHct, isDark, contrast)
    case 'vibrant':
      return new SchemeVibrant(sourceHct, isDark, contrast)
    case 'expressive':
      return new SchemeExpressive(sourceHct, isDark, contrast)
    case 'fidelity':
      return new SchemeFidelity(sourceHct, isDark, contrast)
    case 'content':
      return new SchemeContent(sourceHct, isDark, contrast)
    case 'monochrome':
      return new SchemeMonochrome(sourceHct, isDark, contrast)
    case 'rainbow':
      return new SchemeRainbow(sourceHct, isDark, contrast)
    case 'fruitSalad':
      return new SchemeFruitSalad(sourceHct, isDark, contrast)
  }
}

function buildScheme(
  variant: ThemeVariant,
  sourceHct: Hct,
  isDark: boolean,
  contrast: number,
  surfaceTone: SurfaceTone,
  seedAdjustments: SeedAdjustments | undefined,
): DynamicScheme {
  const base = buildBaseScheme(variant, sourceHct, isDark, contrast)

  const primaryChroma = seedAdjustments?.primary
  const secondaryChroma = seedAdjustments?.secondary
  const flattenNeutrals = surfaceTone === 'neutral'

  if (primaryChroma == null && secondaryChroma == null && !flattenNeutrals) {
    return base
  }

  const primaryPalette =
    primaryChroma != null
      ? TonalPalette.fromHueAndChroma(base.primaryPalette.hue, primaryChroma)
      : base.primaryPalette
  const secondaryPalette =
    secondaryChroma != null
      ? TonalPalette.fromHueAndChroma(
          base.secondaryPalette.hue,
          secondaryChroma,
        )
      : base.secondaryPalette
  const neutralPalette = flattenNeutrals
    ? TonalPalette.fromHueAndChroma(base.neutralPalette.hue, 0)
    : base.neutralPalette
  const neutralVariantPalette = flattenNeutrals
    ? TonalPalette.fromHueAndChroma(base.neutralVariantPalette.hue, 0)
    : base.neutralVariantPalette

  return new DynamicScheme({
    sourceColorHct: sourceHct,
    variant: VARIANT_ENUM[variant],
    contrastLevel: contrast,
    isDark,
    primaryPalette,
    secondaryPalette,
    tertiaryPalette: base.tertiaryPalette,
    neutralPalette,
    neutralVariantPalette,
    errorPalette: base.errorPalette,
  })
}

function extractColors(scheme: DynamicScheme): Colors {
  const c = new MaterialDynamicColors()
  return {
    primary: hexFromArgb(c.primary().getArgb(scheme)),
    onPrimary: hexFromArgb(c.onPrimary().getArgb(scheme)),
    primaryContainer: hexFromArgb(c.primaryContainer().getArgb(scheme)),
    onPrimaryContainer: hexFromArgb(c.onPrimaryContainer().getArgb(scheme)),
    primaryFixed: hexFromArgb(c.primaryFixed().getArgb(scheme)),
    onPrimaryFixed: hexFromArgb(c.onPrimaryFixed().getArgb(scheme)),
    primaryFixedDim: hexFromArgb(c.primaryFixedDim().getArgb(scheme)),
    onPrimaryFixedVariant: hexFromArgb(
      c.onPrimaryFixedVariant().getArgb(scheme),
    ),
    secondary: hexFromArgb(c.secondary().getArgb(scheme)),
    onSecondary: hexFromArgb(c.onSecondary().getArgb(scheme)),
    secondaryContainer: hexFromArgb(c.secondaryContainer().getArgb(scheme)),
    onSecondaryContainer: hexFromArgb(c.onSecondaryContainer().getArgb(scheme)),
    secondaryFixed: hexFromArgb(c.secondaryFixed().getArgb(scheme)),
    onSecondaryFixed: hexFromArgb(c.onSecondaryFixed().getArgb(scheme)),
    secondaryFixedDim: hexFromArgb(c.secondaryFixedDim().getArgb(scheme)),
    onSecondaryFixedVariant: hexFromArgb(
      c.onSecondaryFixedVariant().getArgb(scheme),
    ),
    tertiary: hexFromArgb(c.tertiary().getArgb(scheme)),
    onTertiary: hexFromArgb(c.onTertiary().getArgb(scheme)),
    tertiaryContainer: hexFromArgb(c.tertiaryContainer().getArgb(scheme)),
    onTertiaryContainer: hexFromArgb(c.onTertiaryContainer().getArgb(scheme)),
    tertiaryFixed: hexFromArgb(c.tertiaryFixed().getArgb(scheme)),
    onTertiaryFixed: hexFromArgb(c.onTertiaryFixed().getArgb(scheme)),
    tertiaryFixedDim: hexFromArgb(c.tertiaryFixedDim().getArgb(scheme)),
    onTertiaryFixedVariant: hexFromArgb(
      c.onTertiaryFixedVariant().getArgb(scheme),
    ),
    error: hexFromArgb(c.error().getArgb(scheme)),
    onError: hexFromArgb(c.onError().getArgb(scheme)),
    errorContainer: hexFromArgb(c.errorContainer().getArgb(scheme)),
    onErrorContainer: hexFromArgb(c.onErrorContainer().getArgb(scheme)),
    background: hexFromArgb(c.background().getArgb(scheme)),
    onBackground: hexFromArgb(c.onBackground().getArgb(scheme)),
    surface: hexFromArgb(c.surface().getArgb(scheme)),
    surfaceDim: hexFromArgb(c.surfaceDim().getArgb(scheme)),
    surfaceBright: hexFromArgb(c.surfaceBright().getArgb(scheme)),
    surfaceContainerLowest: hexFromArgb(
      c.surfaceContainerLowest().getArgb(scheme),
    ),
    surfaceContainerLow: hexFromArgb(c.surfaceContainerLow().getArgb(scheme)),
    surfaceContainer: hexFromArgb(c.surfaceContainer().getArgb(scheme)),
    surfaceContainerHigh: hexFromArgb(c.surfaceContainerHigh().getArgb(scheme)),
    surfaceContainerHighest: hexFromArgb(
      c.surfaceContainerHighest().getArgb(scheme),
    ),
    onSurface: hexFromArgb(c.onSurface().getArgb(scheme)),
    surfaceVariant: hexFromArgb(c.surfaceVariant().getArgb(scheme)),
    onSurfaceVariant: hexFromArgb(c.onSurfaceVariant().getArgb(scheme)),
    outline: hexFromArgb(c.outline().getArgb(scheme)),
    outlineVariant: hexFromArgb(c.outlineVariant().getArgb(scheme)),
    surfaceTint: hexFromArgb(c.surfaceTint().getArgb(scheme)),
    shadow: hexFromArgb(c.shadow().getArgb(scheme)),
    scrim: hexFromArgb(c.scrim().getArgb(scheme)),
    inverseSurface: hexFromArgb(c.inverseSurface().getArgb(scheme)),
    inverseOnSurface: hexFromArgb(c.inverseOnSurface().getArgb(scheme)),
    inversePrimary: hexFromArgb(c.inversePrimary().getArgb(scheme)),
  }
}

/**
 * Generates a complete Material Design 3 light and dark theme from a single seed color.
 * Uses Google's HCT color space and the official `material-color-utilities` schemes,
 * so all defaults are byte-identical to the MD3 spec.
 *
 * Spec-aligned options (recommended):
 *   - `variant` — pick from the 9 MD3 schemes
 *   - `contrastLevel` — `'standard' | 'medium' | 'high'` (MD3 accessibility tiers)
 *   - `fontFamily`, `roundness` — local layering on top of MD3
 *
 * Explicit overrides (deviate from MD3, use only when the spec doesn't cover your case):
 *   - `surfaceTone: 'neutral'` — pure-grey / OLED-near-black surfaces
 *   - `seedAdjustments` — per-palette HCT chroma overrides
 *
 * @param seedColor - Hex color string (e.g. '#6750A4', '#FF0000')
 * @returns Object with `lightTheme` and `darkTheme`, both typed as `Theme`
 *
 * @example
 * import { createMaterialTheme } from '@rootnative/core/create-theme'
 *
 * // Pure MD3 default (TonalSpot variant)
 * const { lightTheme, darkTheme } = createMaterialTheme('#006A6A')
 *
 * // Switch to a different MD3 variant
 * createMaterialTheme('#006A6A', { variant: 'vibrant' })
 *
 * // High-contrast accessibility preset
 * createMaterialTheme('#006A6A', { contrastLevel: 'high' })
 *
 * // Spec-legal monochrome theme
 * createMaterialTheme('#006A6A', { variant: 'monochrome' })
 *
 * // Explicit override: keep colorful primary/secondary, flatten surfaces
 * createMaterialTheme('#006A6A', { surfaceTone: 'neutral' })
 *
 * // Explicit override: punchier container chroma
 * createMaterialTheme('#006A6A', {
 *   seedAdjustments: { primary: 60, secondary: 32 },
 * })
 *
 * <ThemeProvider theme={lightTheme}>
 *   <App />
 * </ThemeProvider>
 */
export function createMaterialTheme(
  seedColor: string,
  options?: CreateMaterialThemeOptions,
): {
  lightTheme: Theme
  darkTheme: Theme
} {
  const sourceHct = Hct.fromInt(argbFromHex(seedColor))
  const {
    variant = 'tonalSpot',
    fontFamily,
    roundness = 1,
    contrastLevel = 'standard',
    surfaceTone = 'spec',
    seedAdjustments,
  } = options ?? {}

  const contrast = CONTRAST_VALUES[contrastLevel]

  const lightScheme = buildScheme(
    variant,
    sourceHct,
    false,
    contrast,
    surfaceTone,
    seedAdjustments,
  )
  const darkScheme = buildScheme(
    variant,
    sourceHct,
    true,
    contrast,
    surfaceTone,
    seedAdjustments,
  )

  const shape = roundness === 1 ? lightTheme.shape : applyRoundness(roundness)

  const typography = fontFamily
    ? (Object.fromEntries(
        Object.entries(defaultTypography).map(([key, style]) => [
          key,
          { ...style, fontFamily },
        ]),
      ) as Typography)
    : defaultTypography

  const shared = {
    typography,
    shape,
    spacing: lightTheme.spacing,
    topAppBar: defaultTopAppBarTokens,
    stateLayer: lightTheme.stateLayer,
    elevation: lightTheme.elevation,
    motion: lightTheme.motion,
  }

  return {
    lightTheme: { colors: extractColors(lightScheme), ...shared },
    darkTheme: { colors: extractColors(darkScheme), ...shared },
  }
}
