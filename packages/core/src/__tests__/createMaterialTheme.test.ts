import { createMaterialTheme } from '../theme/createMaterialTheme'
import type { Colors } from '../theme/types'

const COLOR_KEYS = [
  'primary',
  'onPrimary',
  'primaryContainer',
  'onPrimaryContainer',
  'primaryFixed',
  'onPrimaryFixed',
  'primaryFixedDim',
  'onPrimaryFixedVariant',
  'secondary',
  'onSecondary',
  'secondaryContainer',
  'onSecondaryContainer',
  'secondaryFixed',
  'onSecondaryFixed',
  'secondaryFixedDim',
  'onSecondaryFixedVariant',
  'tertiary',
  'onTertiary',
  'tertiaryContainer',
  'onTertiaryContainer',
  'tertiaryFixed',
  'onTertiaryFixed',
  'tertiaryFixedDim',
  'onTertiaryFixedVariant',
  'error',
  'onError',
  'errorContainer',
  'onErrorContainer',
  'background',
  'onBackground',
  'surface',
  'surfaceDim',
  'surfaceBright',
  'surfaceContainerLowest',
  'surfaceContainerLow',
  'surfaceContainer',
  'surfaceContainerHigh',
  'surfaceContainerHighest',
  'onSurface',
  'surfaceVariant',
  'onSurfaceVariant',
  'outline',
  'outlineVariant',
  'surfaceTint',
  'shadow',
  'scrim',
  'inverseSurface',
  'inverseOnSurface',
  'inversePrimary',
] as const satisfies readonly (keyof Colors)[]

describe('createMaterialTheme', () => {
  const result = createMaterialTheme('#006A6A')

  it('returns lightTheme and darkTheme', () => {
    expect(result).toHaveProperty('lightTheme')
    expect(result).toHaveProperty('darkTheme')
  })

  it('generates all color roles for light theme', () => {
    for (const key of COLOR_KEYS) {
      expect(result.lightTheme.colors).toHaveProperty(key)
      expect(typeof result.lightTheme.colors[key]).toBe('string')
      expect(result.lightTheme.colors[key]).toMatch(/^#[0-9a-fA-F]{6,8}$/)
    }
  })

  it('generates all color roles for dark theme', () => {
    for (const key of COLOR_KEYS) {
      expect(result.darkTheme.colors).toHaveProperty(key)
      expect(typeof result.darkTheme.colors[key]).toBe('string')
    }
  })

  it('produces different colors for light and dark', () => {
    expect(result.lightTheme.colors.primary).not.toBe(
      result.darkTheme.colors.primary,
    )
    expect(result.lightTheme.colors.surface).not.toBe(
      result.darkTheme.colors.surface,
    )
  })

  it('includes shared non-color tokens', () => {
    expect(result.lightTheme.typography).toBeDefined()
    expect(result.lightTheme.shape).toBeDefined()
    expect(result.lightTheme.spacing).toBeDefined()
    expect(result.lightTheme.elevation).toBeDefined()
    expect(result.lightTheme.motion).toBeDefined()
    expect(result.lightTheme.stateLayer).toBeDefined()
  })

  it('applies custom fontFamily to all typography styles', () => {
    const custom = createMaterialTheme('#006A6A', { fontFamily: 'Inter' })
    for (const style of Object.values(custom.lightTheme.typography)) {
      expect(style.fontFamily).toBe('Inter')
    }
    for (const style of Object.values(custom.darkTheme.typography)) {
      expect(style.fontFamily).toBe('Inter')
    }
  })

  it('uses default fontFamily when not specified', () => {
    const style = result.lightTheme.typography.bodyMedium
    expect(style.fontFamily).not.toBe('Inter')
  })

  it('generates different themes for different seed colors', () => {
    const teal = createMaterialTheme('#006A6A')
    const red = createMaterialTheme('#FF0000')
    expect(teal.lightTheme.colors.primary).not.toBe(
      red.lightTheme.colors.primary,
    )
  })

  describe('contrastLevel', () => {
    it('keeps standard contrast equal to no option', () => {
      const standard = createMaterialTheme('#006A6A', {
        contrastLevel: 'standard',
      })
      expect(standard.lightTheme.colors.primary).toBe(
        result.lightTheme.colors.primary,
      )
      expect(standard.lightTheme.colors.onSurface).toBe(
        result.lightTheme.colors.onSurface,
      )
    })

    it('produces different on-color contrast at higher levels', () => {
      const standard = createMaterialTheme('#006A6A', {
        contrastLevel: 'standard',
      })
      const medium = createMaterialTheme('#006A6A', {
        contrastLevel: 'medium',
      })
      const high = createMaterialTheme('#006A6A', { contrastLevel: 'high' })

      expect(medium.lightTheme.colors.onSurfaceVariant).not.toBe(
        standard.lightTheme.colors.onSurfaceVariant,
      )
      expect(high.lightTheme.colors.onSurfaceVariant).not.toBe(
        medium.lightTheme.colors.onSurfaceVariant,
      )
    })
  })

  describe('variant', () => {
    it('defaults to tonalSpot (matches no-option output)', () => {
      const tonalSpot = createMaterialTheme('#006A6A', {
        variant: 'tonalSpot',
      })
      expect(tonalSpot.lightTheme.colors.primary).toBe(
        result.lightTheme.colors.primary,
      )
      expect(tonalSpot.darkTheme.colors.surface).toBe(
        result.darkTheme.colors.surface,
      )
    })

    it.each([
      'neutral',
      'vibrant',
      'expressive',
      'fidelity',
      'content',
      'monochrome',
      'rainbow',
      'fruitSalad',
    ] as const)('produces a distinct palette for %s', (variant) => {
      const themed = createMaterialTheme('#006A6A', { variant })
      // At least one color role must differ from the tonalSpot default.
      const themedColors = themed.lightTheme.colors as Record<string, string>
      const defaultColors = result.lightTheme.colors as Record<string, string>
      const anyDifferent = Object.keys(defaultColors).some(
        (key) => themedColors[key] !== defaultColors[key],
      )
      expect(anyDifferent).toBe(true)
    })

    it('monochrome variant produces grey primary', () => {
      const mono = createMaterialTheme('#006A6A', { variant: 'monochrome' })
      const primary = mono.lightTheme.colors.primary
      expect(primary.slice(1, 3)).toBe(primary.slice(3, 5))
      expect(primary.slice(3, 5)).toBe(primary.slice(5, 7))
    })
  })

  describe('surfaceTone (override)', () => {
    it('defaults to spec (matches no-option output)', () => {
      const spec = createMaterialTheme('#006A6A', { surfaceTone: 'spec' })
      expect(spec.lightTheme.colors.surface).toBe(
        result.lightTheme.colors.surface,
      )
    })

    it('flattens neutral chroma when set to neutral', () => {
      const neutral = createMaterialTheme('#006A6A', {
        surfaceTone: 'neutral',
      })
      const surface = neutral.lightTheme.colors.surface
      const r = surface.slice(1, 3)
      const g = surface.slice(3, 5)
      const b = surface.slice(5, 7)
      expect(r).toBe(g)
      expect(g).toBe(b)
    })

    it('keeps colorful primary/secondary when flattening surfaces', () => {
      const neutral = createMaterialTheme('#006A6A', {
        surfaceTone: 'neutral',
      })
      const primary = neutral.lightTheme.colors.primary
      // Primary channels should NOT all be equal — surface flatten must not
      // bleed into primary palette (that's what `variant: 'monochrome'` is for).
      const allEqual =
        primary.slice(1, 3) === primary.slice(3, 5) &&
        primary.slice(3, 5) === primary.slice(5, 7)
      expect(allEqual).toBe(false)
    })
  })

  describe('seedAdjustments', () => {
    it('produces a more saturated primary container when chroma is raised', () => {
      const base = createMaterialTheme('#006A6A')
      const punchy = createMaterialTheme('#006A6A', {
        seedAdjustments: { primary: 80 },
      })
      expect(punchy.lightTheme.colors.primaryContainer).not.toBe(
        base.lightTheme.colors.primaryContainer,
      )
    })

    it('overrides secondary chroma independently of primary', () => {
      const base = createMaterialTheme('#006A6A')
      const tweaked = createMaterialTheme('#006A6A', {
        seedAdjustments: { secondary: 48 },
      })
      expect(tweaked.lightTheme.colors.secondaryContainer).not.toBe(
        base.lightTheme.colors.secondaryContainer,
      )
      expect(tweaked.lightTheme.colors.primary).toBe(
        base.lightTheme.colors.primary,
      )
    })

    it('leaves colors unchanged when no overrides are provided', () => {
      const noop = createMaterialTheme('#006A6A', { seedAdjustments: {} })
      expect(noop.lightTheme.colors.primary).toBe(
        result.lightTheme.colors.primary,
      )
      expect(noop.lightTheme.colors.secondary).toBe(
        result.lightTheme.colors.secondary,
      )
    })
  })
})
