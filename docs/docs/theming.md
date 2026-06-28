---
sidebar_position: 5
---

# Theming

RootNative UI ships with Material Design 3 out of the box, but the theme engine is design-system agnostic — you can customize MD3, generate branded themes from a seed color, or build an entirely custom design system.

## Material Design 3 (default)

### ThemeProvider

Wrap your app with `ThemeProvider` to supply the MD3 theme:

```tsx
import { ThemeProvider } from '@rootnative/core'

export default function App() {
  return (
    <ThemeProvider>
      {/* All components use the default light theme */}
    </ThemeProvider>
  )
}
```

### Dark mode

Pass the built-in dark theme:

```tsx
import { ThemeProvider, darkTheme } from '@rootnative/core'

<ThemeProvider theme={darkTheme}>
  {/* Dark mode */}
</ThemeProvider>
```

Switch between light and dark based on system preference:

```tsx
import { useColorScheme } from 'react-native'
import { ThemeProvider, lightTheme, darkTheme } from '@rootnative/core'

export default function App() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme

  return (
    <ThemeProvider theme={theme}>
      {/* Follows system theme */}
    </ThemeProvider>
  )
}
```

### Override specific tokens

Spread the base theme and override individual tokens:

```tsx
import { lightTheme } from '@rootnative/core'
import type { Theme } from '@rootnative/core'

const brandTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: '#006A6A',
    onPrimary: '#FFFFFF',
  },
}

<ThemeProvider theme={brandTheme}>
  {/* Components use your custom primary color */}
</ThemeProvider>
```

### Generate a theme from a seed color

`createMaterialTheme` relies on [`@material/material-color-utilities`](https://www.npmjs.com/package/@material/material-color-utilities), a required peer of `@rootnative/core`. npm and pnpm install required peers automatically; **Yarn users must add it manually** (`yarn add @material/material-color-utilities`).

It generates a complete MD3 light and dark theme from a single hex color using Google's HCT color space. All 69 color roles are derived automatically:

```tsx
import { createMaterialTheme } from '@rootnative/core/create-theme'
import { ThemeProvider } from '@rootnative/core'

const { lightTheme, darkTheme } = createMaterialTheme('#006A6A')

<ThemeProvider theme={lightTheme}>
  {/* Full MD3 palette generated from #006A6A */}
</ThemeProvider>
```

You can also pass a custom font family:

```tsx
const { lightTheme, darkTheme } = createMaterialTheme('#006A6A', {
  fontFamily: 'Inter',
})
```

This is the easiest way to create a branded theme — pick your brand color and the entire palette is generated for you. See the [Fonts](./fonts) guide for full details on loading and using custom fonts.

#### Spec-aligned options

These map directly to MD3 spec primitives. Defaults produce byte-identical output to the official `material-color-utilities` library.

| Option | Type | Default | Notes |
|--------|------|---------|-------|
| `variant` | [see below](#md3-scheme-variants) | `'tonalSpot'` | The MD3 scheme used to derive palettes. |
| `contrastLevel` | `'standard' \| 'medium' \| 'high'` | `'standard'` | MD3 contrast preset. Maps to MD3 contrast values `0 / 0.5 / 1.0`. |
| `fontFamily` | `string` | platform default | Applied to every typography style. |
| `roundness` | `number` | `1` | Corner-radius multiplier. `0` = sharp, `1` = MD3 default, `2` = doubled. |

##### MD3 scheme variants

Each variant is a spec-defined recipe in `material-color-utilities` for deriving the full palette from the seed.

| Variant | When to use |
|---------|-------------|
| `'tonalSpot'` (default) | Material You default. Low-to-medium colorfulness, tertiary hue related to source. |
| `'neutral'` | Calm, low-colorfulness theme. Quieter than tonalSpot. |
| `'vibrant'` | High colorfulness primary, distinct hue rotations. |
| `'expressive'` | Playful, source hue is intentionally shifted for variety. |
| `'fidelity'` | Closely matches the seed color (high colorfulness, no hue shift). |
| `'content'` | Designed for content-driven theming (e.g. derived from images). |
| `'monochrome'` | Pure greys. Spec-legal way to get a fully neutral theme. |
| `'rainbow'` | All hues represented across the secondary/tertiary palettes. |
| `'fruitSalad'` | Distinct vibrant hues for primary/secondary/tertiary. |

```tsx
// Spec-legal monochrome theme
createMaterialTheme('#006A6A', { variant: 'monochrome' })

// Spec-legal vibrant theme
createMaterialTheme('#006A6A', { variant: 'vibrant' })
```

##### Accessibility-friendly contrast

```tsx
const { lightTheme, darkTheme } = createMaterialTheme('#006A6A', {
  contrastLevel: 'high',
})
```

`'standard'` matches the MD3 spec exactly. `'medium'` and `'high'` widen the gap between content and container colors, useful for WCAG AAA targets or low-vision modes.

#### Explicit overrides

These deviate from the MD3 spec. **Reach for them only when no built-in `variant` covers your case** — the spec already covers most aesthetics.

| Option | Type | Default | Notes |
|--------|------|---------|-------|
| `surfaceTone` | `'spec' \| 'neutral'` | `'spec'` | `'neutral'` flattens neutral palettes to chroma `0` while keeping a colorful primary/secondary. |
| `seedAdjustments.primary` | `number` | spec-defined | HCT chroma override for the primary palette. |
| `seedAdjustments.secondary` | `number` | spec-defined | HCT chroma override for the secondary palette. |

##### `surfaceTone: 'neutral'` — colorful brand + pure-grey surfaces

```tsx
const { lightTheme, darkTheme } = createMaterialTheme('#006A6A', {
  surfaceTone: 'neutral',
})
```

Use this when you need a colorful primary/secondary (e.g. brand color) but want OLED-near-black, untinted surfaces (a "carbon" aesthetic). For a fully neutral theme prefer the spec-legal `variant: 'monochrome'`.

##### `seedAdjustments` — chroma overrides

```tsx
const { lightTheme, darkTheme } = createMaterialTheme('#006A6A', {
  seedAdjustments: { primary: 60, secondary: 32 },
})
```

Overrides the HCT chroma of the primary and secondary palettes while keeping their hues. Use this only when the spec-defined chromas come out too pastel or too vivid for your brand. Try `variant: 'vibrant'` first — it's the spec-legal answer to "containers too pastel".

### Access theme values

Use the `useTheme` hook in any component:

```tsx
import { useTheme } from '@rootnative/core'

function MyComponent() {
  const theme = useTheme()
  return (
    <View style={{ backgroundColor: theme.colors.surface }}>
      <Text style={{ color: theme.colors.onSurface }}>Hello</Text>
    </View>
  )
}
```

### Material preset

All MD3 values are also available as a grouped object:

```tsx
import { material } from '@rootnative/core'

material.lightTheme
material.darkTheme
material.defaultTopAppBarTokens
```

## Custom design systems

The theme engine supports any design system, not just MD3. Use `BaseTheme`, `defineTheme`, and `ThemeProvider` to build your own.

### BaseTheme

All themes extend `BaseTheme`:

```tsx
interface BaseTheme {
  colors: Record<string, string>
  typography: Record<string, TextStyle>
  shape: Shape
  spacing: Spacing
  stateLayer: StateLayer
  elevation: Elevation
  motion: Motion
}
```

### Define a custom theme

Use `defineTheme` for type-safe theme creation:

```tsx
import { defineTheme } from '@rootnative/core'
import type { BaseTheme } from '@rootnative/core'

interface BrandTheme extends BaseTheme {
  colors: {
    brand: string
    brandMuted: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    error: string
    success: string
    [key: string]: string
  }
  typography: {
    heading: TextStyle
    subheading: TextStyle
    body: TextStyle
    caption: TextStyle
    [key: string]: TextStyle
  }
}

const brandTheme = defineTheme<BrandTheme>({
  colors: {
    brand: '#FF6B00',
    brandMuted: '#FFF3E0',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#1A1A1A',
    textSecondary: '#757575',
    border: '#E0E0E0',
    error: '#D32F2F',
    success: '#388E3C',
  },
  typography: {
    heading: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
    subheading: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
    caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  },
  shape: { none: 0, extraSmall: 4, small: 8, medium: 12, large: 16, extraLarge: 28, full: 9999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  stateLayer: { pressed: 0.12, focused: 0.12, hovered: 0.08, disabled: 0.38 },
  elevation: {
    level0: {},
    level1: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 1 },
    level2: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
    level3: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  },
  motion: {
    duration: { short: 100, medium: 300, long: 500 },
    easing: { standard: 'ease-in-out', accelerate: 'ease-in', decelerate: 'ease-out' },
  },
})
```

### ThemeProvider

Use `ThemeProvider` for custom design systems:

```tsx
import { ThemeProvider } from '@rootnative/core'

<ThemeProvider theme={brandTheme}>
  {/* Your app */}
</ThemeProvider>
```

### Access custom theme values

Pass your theme type as a generic to `useTheme`:

```tsx
import { useTheme } from '@rootnative/core'

function MyComponent() {
  const theme = useTheme<BrandTheme>()
  // theme.colors.brand is typed as string
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={[theme.typography.body, { color: theme.colors.text }]}>
        Hello
      </Text>
    </View>
  )
}
```

## Theme structure reference

| Token group | Description |
|-------------|-------------|
| `colors` | Design-system specific color roles (`Record<string, string>`) |
| `typography` | Type scale variants (`Record<string, TextStyle>`) |
| `shape` | Corner radius tokens (none through full) |
| `spacing` | Spacing scale (xs, sm, md, lg, xl) |
| `elevation` | Shadow levels 0-3 |
| `stateLayer` | Opacity values for pressed, focused, hovered, disabled |
| `motion` | Duration and easing tokens |

## Type hierarchy

- **`BaseTheme`** — Generic base. Any design system extends this.
- **`Theme`** — MD3 theme. Extends `BaseTheme` with 69 color roles, 15 typography variants, optional `topAppBar` tokens. **`MaterialTheme`** is an identical alias — use it to disambiguate in multi-design-system codebases.

## Summary

| Goal | API |
|------|-----|
| Use MD3 defaults | `<ThemeProvider>` |
| Dark mode | `<ThemeProvider theme={darkTheme}>` |
| Override a few MD3 colors | Spread `lightTheme` and override |
| Branded MD3 theme from one color | `import { createMaterialTheme } from '@rootnative/core/create-theme'` |
| Custom font | `createMaterialTheme('#color', { fontFamily: 'Inter' })` — see [Fonts](./fonts) |
| Switch MD3 variant | `createMaterialTheme('#color', { variant: 'vibrant' })` |
| High-contrast accessibility | `createMaterialTheme('#color', { contrastLevel: 'high' })` |
| Spec-legal monochrome | `createMaterialTheme('#color', { variant: 'monochrome' })` |
| Brand color + pure-grey surfaces (override) | `createMaterialTheme('#color', { surfaceTone: 'neutral' })` |
| Custom palette chroma (override) | `createMaterialTheme('#color', { seedAdjustments: { primary: 60 } })` |
| Fully custom design system | `defineTheme` + `<ThemeProvider>` + `useTheme<T>()` |
