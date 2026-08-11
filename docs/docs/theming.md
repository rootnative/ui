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

To follow the system preference, pass both themes as a `{ light, dark }` pair.
The provider reads the OS setting and keeps following it as it changes:

```tsx
import { ThemeProvider, lightTheme, darkTheme } from '@rootnative/core'

export default function App() {
  return (
    <ThemeProvider theme={{ light: lightTheme, dark: darkTheme }}>
      {/* Follows the system theme */}
    </ThemeProvider>
  )
}
```

`createMaterialTheme()` returns a pair already, so rename on destructure:

```tsx
import { createMaterialTheme } from '@rootnative/core/create-theme'

const { lightTheme: light, darkTheme: dark } = createMaterialTheme('#006A6A')

<ThemeProvider theme={{ light, dark }}>{children}</ThemeProvider>
```

### Letting the user choose

A provider with a theme pair gives descendants `useThemeMode()`:

```tsx
import { useThemeMode } from '@rootnative/core'

function ThemeToggle() {
  const { mode, scheme, setMode } = useThemeMode()

  return (
    <Button onPress={() => setMode(scheme === 'dark' ? 'light' : 'dark')}>
      {scheme === 'dark' ? 'Light mode' : 'Dark mode'}
    </Button>
  )
}
```

The hook returns four values:

| Value | Type | Meaning |
|-------|------|---------|
| `mode` | `'system' \| 'light' \| 'dark'` | What was asked for. `'system'` means "follow the OS" |
| `scheme` | `'light' \| 'dark'` | What is actually on screen, with `'system'` resolved |
| `setMode` | `(mode) => void` | Switches mode. Persists it when `storage` is set |
| `isReady` | `boolean` | `false` until a persisted mode loads. Always `true` without `storage` |

Read `scheme`, not `mode`, when you need to know which theme is rendering —
`mode` can be `'system'`, which does not tell you the answer. Use it to sync
anything that lives outside the theme, most commonly the status bar:

```tsx
import { useThemeMode } from '@rootnative/core'
import { StatusBar } from 'expo-status-bar'

function ThemedStatusBar() {
  const { scheme } = useThemeMode()

  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
}
```

`useThemeMode()` throws when the nearest provider was given a single theme
rather than a pair. There is no mode to control in that case, so the error is
raised instead of reporting a mode the provider cannot honour.

### Remembering the choice

`@rootnative/core` takes no storage dependency. Pass any object with
`getItem`/`setItem` — AsyncStorage, MMKV, or `localStorage` — and the mode is
saved on change and restored on launch. Both methods may be sync or async:

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage'

<ThemeProvider
  theme={{ light: lightTheme, dark: darkTheme }}
  storage={AsyncStorage}
>
  {children}
</ThemeProvider>
```

Reading storage takes a moment, so the first frame renders with `defaultMode`
before the saved mode arrives. Gate your splash screen on `isReady` to avoid a
visible flash:

```tsx
function Gate({ children }) {
  const { isReady } = useThemeMode()

  if (!isReady) {
    return null // or keep the splash screen up
  }

  return children
}
```

To drive mode from your own state instead, pass `mode` and `onModeChange`. The
provider then never changes mode on its own, and ignores `storage` — your state
is the source of truth, and writing behind it would restore a stale value on the
next launch.

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

:::note Color and typography keys are checked

`Colors` and `Typography` list the MD3 roles exactly — there is no index
signature, so `colors.primry` is a compile error rather than a silently-typed
`string`. That is deliberate: `theme.colors.*` is the most-touched expression in
consumer code, and typo detection there is worth more than being able to bolt an
extra key onto the MD3 palette.

To carry brand tokens the MD3 scheme has no role for, put them on the theme root
rather than inside `colors` — `BaseTheme` keeps its `[key: string]: unknown`
escape hatch:

```tsx
const brandTheme = {
  ...lightTheme,
  brand: { logoInk: '#101820', promoGradientFrom: '#FF6B00' },
}
```

Or define your own theme interface, as [Custom design systems](#custom-design-systems)
describes — a custom `Colors` type is yours to shape.

`Colors` and `Typography` are `type` aliases, not interfaces, so they cannot be
widened with a `declare module` augmentation. That is a deliberate consequence of
being strict: a type alias is what lets a closed `Colors` still satisfy
`BaseTheme`'s `colors: Record<string, string>`.

:::

### Generate a theme from a seed color

`createMaterialTheme` relies on [`@material/material-color-utilities`](https://www.npmjs.com/package/@material/material-color-utilities), an **optional** peer of `@rootnative/core` — so **no package manager installs it for you**. Add it yourself before using this API (`npm install @material/material-color-utilities`). It's optional because it lives behind the `@rootnative/core/create-theme` subpath: importing `@rootnative/core` alone never pulls it in, so projects that define themes by hand don't carry it.

It generates a complete MD3 light and dark theme from a single hex color using Google's HCT color space. All 49 color roles are derived automatically:

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

### `applyRoundness` — scale the corner tokens directly

`createMaterialTheme`'s [`roundness` option](#spec-aligned-options) is the usual way to reshape corners, but it's a seed-color API. When you're overriding an existing theme instead, `applyRoundness(multiplier)` returns the same scaled `Shape` object on its own:

```tsx
import { applyRoundness, material, defineTheme } from '@rootnative/core'

const sharp = defineTheme({
  ...material.lightTheme,
  shape: applyRoundness(0), // every corner square
})
```

It scales the five intermediate tokens (`cornerExtraSmall` through `cornerExtraLarge`) and **leaves `cornerNone` at 0 and `cornerFull` at 999** — those two are sentinels, not measurements, so scaling them would either do nothing or break the pill shapes that read `cornerFull`. Results are rounded to whole dp. The multiplier is echoed back on the returned object as `shape.roundness`, so a theme carries a record of how far it was reshaped — no component reads it, but your own code can.

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
  typography: Record<string, TypographyToken>
  shape: Shape
  spacing: Spacing
  stateLayer: StateLayer
  elevation: Elevation
  motion: Motion
  // Escape hatch for your own token groups — this is what lets a custom theme
  // carry extra keys and still satisfy `BaseTheme`.
  [key: string]: unknown
}
```

### Define a custom theme

Use `defineTheme` for type-safe theme creation:

```tsx
import { defineTheme, material } from '@rootnative/core'
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
    heading: TypographyToken
    subheading: TypographyToken
    body: TypographyToken
    caption: TypographyToken
    [key: string]: TypographyToken
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
  // `shape`, `spacing`, `stateLayer`, `elevation` and `motion` are required by
  // `BaseTheme` and each has a fixed token set. Spread the MD3 defaults and
  // override only what your brand changes, rather than spelling them out —
  // `motion` alone is 29 tokens, and components read every one of them.
  ...material.lightTheme,
  shape: { ...material.lightTheme.shape, roundness: 1, cornerMedium: 10 },
})
```

:::caution

`shape`, `stateLayer`, `elevation` and `motion` are **not** freely shaped
objects. Each is a fixed interface — `shape` is `roundness` plus `cornerNone`
through `cornerFull`, `stateLayer` is the six `*Opacity` keys, `elevation` is
`level0`–`level5` (every level needing all five shadow fields), and `motion` is
a flat set of 16 `duration*`, 7 `easing*` and 6 `spring*` tokens. Omitting or
renaming any of them fails to type-check, and a partially populated token set
breaks the components that read it at runtime. Spreading a preset is the
supported way to supply them.

:::

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
| `typography` | Type scale variants (`Record<string, TypographyToken>`) |
| `shape` | `roundness` multiplier plus corner radius tokens (`cornerNone` through `cornerFull`) |
| `spacing` | Spacing scale (`xs`, `sm`, `md`, `lg`, `xl`) |
| `elevation` | Shadow levels `level0` through `level5` |
| `stateLayer` | Opacity values: `pressedOpacity`, `focusedOpacity`, `hoveredOpacity`, `draggedOpacity`, `disabledOpacity`, `disabledContainerOpacity` |
| `motion` | Duration, easing, and spring tokens — see [Motion](./motion) |

## Type hierarchy

- **`BaseTheme`** — Generic base. Any design system extends this.
- **`Theme`** — MD3 theme. Extends `BaseTheme` with 49 color roles, 30 typography variants (15 base + 15 MD3 Expressive emphasized), optional `topAppBar` tokens. **`MaterialTheme`** is an identical alias — use it to disambiguate in multi-design-system codebases.

## Summary

| Goal | API |
|------|-----|
| Use MD3 defaults | `<ThemeProvider>` |
| Dark mode | `<ThemeProvider theme={darkTheme}>` |
| Follow the OS light/dark setting | `<ThemeProvider theme={{ light, dark }}>` |
| Let the user switch theme | `const { scheme, setMode } = useThemeMode()` |
| Remember the choice | `<ThemeProvider theme={{ light, dark }} storage={AsyncStorage}>` |
| Override a few MD3 colors | Spread `lightTheme` and override |
| Branded MD3 theme from one color | `import { createMaterialTheme } from '@rootnative/core/create-theme'` |
| Custom font | `createMaterialTheme('#color', { fontFamily: 'Inter' })` — see [Fonts](./fonts) |
| Switch MD3 variant | `createMaterialTheme('#color', { variant: 'vibrant' })` |
| High-contrast accessibility | `createMaterialTheme('#color', { contrastLevel: 'high' })` |
| Spec-legal monochrome | `createMaterialTheme('#color', { variant: 'monochrome' })` |
| Brand color + pure-grey surfaces (override) | `createMaterialTheme('#color', { surfaceTone: 'neutral' })` |
| Custom palette chroma (override) | `createMaterialTheme('#color', { seedAdjustments: { primary: 60 } })` |
| Fully custom design system | `defineTheme` + `<ThemeProvider>` + `useTheme<T>()` |
