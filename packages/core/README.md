# @rootnative/core

Design-system agnostic theme engine for [RootNative UI](https://github.com/rootnative/ui) — a React Native component library. Ships with Material Design 3 out of the box.

## Install

```bash
pnpm add @rootnative/core
```

Peer dependencies: `react >=19`, `react-native >=0.81`

## Quick start (Material Design 3)

Wrap your app root with `ThemeProvider`:

```tsx
import { ThemeProvider } from '@rootnative/core'

export default function App() {
  return (
    <ThemeProvider>
      {/* Your app */}
    </ThemeProvider>
  )
}
```

## API

### ThemeProvider

Provides the theme context to all child components. Works with any design system — Material Design 3 or custom themes. Defaults to the MD3 light theme.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `BaseTheme` | `lightTheme` (MD3) | Theme object |
| `children` | `ReactNode` | — | App content |

### useTheme()

Returns the current theme from the nearest `ThemeProvider`.

```tsx
import { useTheme } from '@rootnative/core'

// MD3 (default)
const theme = useTheme()

// Custom design system
const theme = useTheme<MyTheme>()
```

### defineTheme(theme)

Type-safe helper for creating custom themes:

```tsx
import { defineTheme } from '@rootnative/core'
import type { BaseTheme } from '@rootnative/core'

const myTheme = defineTheme({
  colors: { brand: '#FF6B00', background: '#FFF', text: '#1A1A1A' },
  typography: { heading: { ... }, body: { ... } },
  shape: { ... },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  stateLayer: { ... },
  elevation: { ... },
  motion: { ... },
})
```

### createMaterialTheme(seedColor)

Generates a complete MD3 light and dark theme from a single seed color using Google's HCT color space.

```tsx
import { createMaterialTheme } from '@rootnative/core/create-theme'
import { ThemeProvider } from '@rootnative/core'

const { lightTheme, darkTheme } = createMaterialTheme('#006A6A')

<ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
```

Requires: `npm install @material/material-color-utilities`

### material preset

Grouped object with all MD3 theme values:

```tsx
import { material } from '@rootnative/core'

material.lightTheme
material.darkTheme
material.defaultTopAppBarTokens
```

### Theme type hierarchy

- `BaseTheme` — Generic base. Colors as `Record<string, string>`, typography as `Record<string, TextStyle>`, plus shape, spacing, stateLayer, elevation, motion.
- `Theme` — MD3 theme. Extends `BaseTheme` with 69 color roles, 15 typography variants, optional `topAppBar` tokens. `MaterialTheme` is an identical alias — use it to disambiguate in multi-design-system codebases.

### Theme structure

| Token group | Description |
|-------------|-------------|
| `colors` | Design-system specific color roles (`Record<string, string>`) |
| `typography` | Type scale variants (`Record<string, TextStyle>`) |
| `shape` | Corner radius tokens (none through full) |
| `spacing` | Spacing scale (xs, sm, md, lg, xl) |
| `elevation` | Shadow levels 0–3 |
| `stateLayer` | Opacity values for pressed, focused, hovered, disabled |
| `motion` | Duration and easing tokens |

### Custom MD3 theme

```tsx
import { lightTheme } from '@rootnative/core'
import type { Theme } from '@rootnative/core'

const custom: Theme = {
  ...lightTheme,
  colors: { ...lightTheme.colors, primary: '#006A6A', onPrimary: '#FFFFFF' },
}

<ThemeProvider theme={custom}>{children}</ThemeProvider>
```

### Dark theme

```tsx
import { ThemeProvider, darkTheme } from '@rootnative/core'

<ThemeProvider theme={darkTheme}>{children}</ThemeProvider>
```

### useBreakpoint()

Returns the current MD3 window size class: `'compact'` | `'medium'` | `'expanded'` | `'large'` | `'extraLarge'`.

### useBreakpointValue(values)

Returns a value based on the current breakpoint with cascade fallback.

```tsx
const columns = useBreakpointValue({ compact: 1, medium: 2, expanded: 4 })
```

## Exports

- `ThemeProvider` — Theme context provider (works with any design system, defaults to MD3)
- `useTheme` — Access current theme (generic)
- `defineTheme` — Type-safe theme creation helper
- `createMaterialTheme` — Generate MD3 themes from a seed color (import from `@rootnative/core/create-theme`)
- `material` — MD3 preset object (`lightTheme`, `darkTheme`, `defaultTopAppBarTokens`)
- `useBreakpoint` — Current window size class
- `useBreakpointValue` — Responsive values
- `lightTheme` / `darkTheme` — Built-in MD3 themes
- `BaseTheme`, `Theme`, `MaterialTheme`, `Colors`, `Typography`, `Shape`, `Spacing`, `Elevation`, `StateLayer`, `Motion` — Types

## Docs

https://rootnative.github.io/ui/

## License

MIT
