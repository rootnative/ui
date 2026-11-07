---
sidebar_position: 5
description: Customize MD3, generate a branded theme from a seed color, or replace the design system entirely — the theme engine is design-system agnostic.
---

# Theming

Root Native UI ships with Material Design 3, but the theme engine works with any design system. You can change MD3, make a branded theme from a seed color, or build your own design system.

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

`ThemeProvider` also takes `iconResolver`, which renders string icon names
such as `leadingIcon="check"`. Pass `mdiResolver` from
`@rootnative/components/mdi` for MaterialDesignIcons, or your own resolver.
See the [Icons guide](./icons). The examples on this page leave it out
because they show the theme props only.

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

On a static web export (`web.output: 'static'`), the server cannot read the
system setting, so it renders the light theme. The provider keeps the light
theme while the client hydrates, then switches to the system setting on the
render after hydration. A reader with a dark system setting sees the light
theme until hydration ends, which takes seconds on a phone. You don't need a
hydration gate around `mode`. The
[static export note](./responsive.md#notes) explains why the provider waits.
To hide the light page from that reader, see
[The first paint of a static export](#the-first-paint-of-a-static-export).

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
| `mode` | `'system' \| 'light' \| 'dark'` | The mode you asked for. `'system'` means "follow the OS" |
| `scheme` | `'light' \| 'dark'` | The scheme on screen, with `'system'` resolved |
| `setMode` | `(mode) => void` | Switches the mode. Saves it when `storage` is set |
| `isReady` | `boolean` | `false` until a saved mode loads. Always `true` without `storage` |

Read `scheme`, not `mode`, when you need to know which theme renders. `mode`
can be `'system'`, and that doesn't tell you. Use `scheme` to sync anything
outside the theme, most often the status bar:

```tsx
import { useThemeMode } from '@rootnative/core'
import { StatusBar } from 'expo-status-bar'

function ThemedStatusBar() {
  const { scheme } = useThemeMode()

  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
}
```

`useThemeMode()` throws when the nearest provider got a single theme, not a
pair. There is no mode to control in that case, so the hook throws instead of
a mode that the provider can't honour.

### Remembering the choice

`@rootnative/core` takes no storage dependency. Pass any object with
`getItem`/`setItem` (AsyncStorage, MMKV, or `localStorage`). The provider
saves the mode on change and restores it on launch. Both methods can be sync
or async:

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage'

<ThemeProvider
  theme={{ light: lightTheme, dark: darkTheme }}
  storage={AsyncStorage}
>
  {children}
</ThemeProvider>
```

On web, pass `localStorage` itself. `localStorage` throws in `getItem` or
`setItem` when site data is blocked, or in some private windows. The provider
catches that and keeps `defaultMode`. You need no wrapper. Guard the access
only for a static export, where the server has no `window`:

```tsx
const storage = typeof window === 'undefined' ? undefined : window.localStorage

<ThemeProvider
  theme={{ light: lightTheme, dark: darkTheme }}
  storage={storage}
>
  {children}
</ThemeProvider>
```

A storage read takes a moment, so the first frame renders with `defaultMode`
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

To drive the mode from your own state, pass `mode` and `onModeChange`. The
provider then never changes the mode on its own, and it ignores `storage`.
Your state is the source of truth, and a write behind it would restore a stale
value on the next launch.

### The first paint of a static export

The HTML of a static export holds the light theme, because the server cannot
read the system setting of the reader. react-native-web writes each theme
color into the HTML as an inline style, and CSS in the HTML shell cannot
change an inline style. So a reader with a dark system setting sees the light
page until the script downloads and hydrates. A mode that `storage` restores
loads after hydration too, so a reader who chose dark sees the same light
page.

This was measured on a page that loads 2.6 MB of script, in Chromium with a
dark color scheme:

| Profile | Time in the light theme |
|---------|-------------------------|
| Fast computer, no throttle | 1.3 s |
| CPU 4×, 6.4 Mbit/s, 150 ms latency | 5.5 s |

`@rootnative/core/static-export` hides that light page. Add its script and its
CSS to the HTML shell. With Expo Router, the shell is `app/+html.tsx`:

```tsx
import { darkTheme } from '@rootnative/core'
import {
  schemeGuardCss,
  schemeGuardScript,
} from '@rootnative/core/static-export'
import { ScrollViewStyleReset } from 'expo-router/html'
import type { PropsWithChildren } from 'react'

const SCHEME_GUARD_CSS = schemeGuardCss({
  background: darkTheme.colors.background,
})

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <ScrollViewStyleReset />
        <script dangerouslySetInnerHTML={{ __html: schemeGuardScript() }} />
        <style dangerouslySetInnerHTML={{ __html: SCHEME_GUARD_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

The guard works in three steps:

1. The script runs before the body paints. It reads the stored mode, then the
   system setting, and writes the scheme to `<html>` as
   `data-rootnative-scheme`.
2. For the dark scheme, the CSS hides `#root` and paints `background` under it.
3. On the first render after hydration, with the stored mode loaded,
   `ThemeProvider` writes `data-rootnative-theme-ready` on `<html>`. The CSS
   then stops, and the page shows in the dark theme.

A reader with a light scheme sees no change. Without JavaScript the script
does not run, so nothing is hidden. The hidden page keeps its layout, so
nothing moves when it shows.

The guard has a cost. A reader with a dark scheme sees the content when
hydration ends, not when the HTML arrives, so the Largest Contentful Paint is
later for that reader. If the theme is not ready after 8 seconds, the page
shows anyway. That limit is for a script that fails to load.

| Function | Option | Default | Meaning |
|----------|--------|---------|---------|
| `schemeGuardScript` | `storageKey` | `THEME_MODE_STORAGE_KEY` | The `localStorage` key of the stored mode. `null` reads the system setting only |
| `schemeGuardCss` | `background` | — | The color under the hidden page. Use the background of the dark theme |
| `schemeGuardCss` | `rootSelector` | `'#root'` | The element to hide. Expo hydrates into `#root` |
| `schemeGuardCss` | `timeoutMs` | `8000` | The time before the page shows anyway |

The script reads the key that `ThemeProvider` writes through `storage`. On
web, `localStorage` and AsyncStorage both keep the mode under that key. The
script cannot see a mode that the app passes as `mode` from its own state.
For that app, pass the `localStorage` key the app writes as `storageKey`, or
pass `null`. With `null`, a reader who chose light on a dark system waits for
hydration, but never sees the wrong theme.

### With Expo Router and React Navigation

A navigator draws its own screen container, and it can also draw a header, a
drawer sheet and a tab bar. It takes their colors from its own navigation
theme, not from `ThemeProvider`. When the app gives it no navigation theme, it
uses its light default. A dark Root Native theme then shows a light screen
behind any content that does not paint its own background.

Expo Router uses its own copy of React Navigation, so the same two ways apply
to both.

**1. Color the screen container.** Use this way when the header, the drawer
and the tabs are Root Native components. Only the screen background then needs
the theme. Set `contentStyle` in the `Stack` `screenOptions`:

```tsx
import { useTheme, useThemeMode } from '@rootnative/core'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

// Reads the theme, so it must be below ThemeProvider.
function ThemedStack() {
  const theme = useTheme()
  const { scheme } = useThemeMode()

  return (
    <>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    </>
  )
}
```

**2. Give the navigator a theme.** Use this way when the app keeps a navigator
header, drawer or tab bar. Map the Root Native color roles to the six navigation
colors:

```tsx
import { useTheme, useThemeMode } from '@rootnative/core'
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router'
import { useMemo, type ReactNode } from 'react'

function NavigationTheme({ children }: { children: ReactNode }) {
  const theme = useTheme()
  const { scheme } = useThemeMode()

  const navigationTheme = useMemo(
    () => ({
      ...(scheme === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme),
      colors: {
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.onSurface,
        border: theme.colors.outlineVariant,
        notification: theme.colors.error,
      },
    }),
    [scheme, theme],
  )

  return (
    <NavigationThemeProvider value={navigationTheme}>
      {children}
    </NavigationThemeProvider>
  )
}
```

With React Navigation and no Expo Router, import `DarkTheme` and
`DefaultTheme` from `@react-navigation/native`, and pass the same object to
`<NavigationContainer theme={navigationTheme}>`.

Obey these rules:

- Keep the `useMemo`. A new theme object on each render updates the navigation
  theme context, and each component that reads it renders again.
- Put the navigation theme provider, or `NavigationContainer`, below the
  Root Native `ThemeProvider`. The mapping calls `useTheme()` and
  `useThemeMode()`, and they need the Root Native provider above them.
- `expo-router` also exports a `ThemeProvider` and a `useTheme`. Import one of
  each pair with an alias, as above.

The navigation theme needs a `dark` flag, and the MD3 theme has none. The
spread of `NavigationDarkTheme` or `NavigationDefaultTheme` supplies it, from
`scheme`. `useThemeMode()` needs a `{ light, dark }` pair and throws for a
single theme. With a single theme, you know which theme you gave, so spread the
matching navigation theme directly.

To put `NavigationDrawer` items in the `drawerContent` of a navigator drawer,
see [In a navigator drawer](./components/navigation-drawer#in-a-navigator-drawer).

### Nested providers

Put a second `ThemeProvider` inside the root one to give one part of the app
its own theme, for example the colors of an image:

```tsx
import { ThemeProvider } from '@rootnative/core'
import { createMaterialTheme } from '@rootnative/core/create-theme'
import { useMemo, type ReactNode } from 'react'

function ImageTheme({ seed, children }: { seed: string; children: ReactNode }) {
  const themes = useMemo(() => {
    const { lightTheme: light, darkTheme: dark } = createMaterialTheme(seed)
    return { light, dark }
  }, [seed])

  return <ThemeProvider theme={themes}>{children}</ThemeProvider>
}
```

A nested provider takes these values from its parent:

| Value | Rule |
|-------|------|
| Icon resolver | A nested provider with no `iconResolver` uses the resolver of its parent. |
| Mode | A nested provider with a pair, below a parent with a pair, follows the mode of the parent when it gets none of `mode`, `defaultMode` and `storage`. `useThemeMode()` below it reports the mode of the parent, and `setMode()` sets the mode of the parent. |
| Named transitions | The `MotionConfig` of the nested provider merges with the one above it, so the named transitions of the app stay. |

To give the nested part a mode of its own, pass `mode`, `defaultMode` or
`storage`. Every provider uses the same storage key, so a nested provider with
`storage` overwrites the mode that the root provider stored.

A nested provider with a single theme has no mode, so `useThemeMode()` throws
below it, as it does below a root provider with a single theme.

**An overlay carries the nested theme.** `Dialog`, `Menu`, `Tooltip`,
`BottomSheet`, `SearchView`, the modal `NavigationDrawer`, the modal
`SideSheet` and the snackbar render through a `Portal` at the `PortalHost`, which is usually above the
nested provider. `Portal` reads the theme, the mode, the icon resolver and the
named transitions where you write the overlay, and provides them again at the
host. So the overlay surface and every component in its content take the
nested theme, and a `useThemeMode()` call in a `Dialog` sets the mode of the
provider the `Dialog` is written under.

The same pair is public, for content you render at another place yourself,
for example through `createPortal` or a third-party modal:

```tsx
import { ThemeScopeProvider, useThemeScope } from '@rootnative/core'

function MyPortal({ children }: { children: ReactNode }) {
  const scope = useThemeScope()
  return createPortal(
    <ThemeScopeProvider scope={scope}>{children}</ThemeScopeProvider>,
    host,
  )
}
```

`useThemeScope()` reads the providers at the call site as one value.
`ThemeScopeProvider` provides that value to its children, as if the providers
of the call site stood there. A `ThemeProvider` below it inherits from it the
same way it inherits from a real parent.

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

`Colors` and `Typography` list the MD3 roles exactly. There is no index
signature, so `colors.primry` is a compile error, not a silent `string`. That
is intentional: `theme.colors.*` is the most-used expression in app code, and
a typo check there is worth more than an extra key on the MD3 palette.

For brand tokens that the MD3 scheme has no role for, put them on the theme
root, not inside `colors`. `BaseTheme` keeps its `[key: string]: unknown`
escape hatch:

```tsx
const brandTheme = {
  ...lightTheme,
  brand: { logoInk: '#101820', promoGradientFrom: '#FF6B00' },
}
```

Or define your own theme interface, as [Custom design systems](#custom-design-systems)
describes. A custom `Colors` type is yours to shape.

`Colors` and `Typography` are `type` aliases, not interfaces, so a
`declare module` augmentation can't widen them. That follows from the strict
types: a type alias is what lets a closed `Colors` still satisfy the
`colors: Record<string, string>` of `BaseTheme`.

:::

### Generate a theme from a seed color

`createMaterialTheme` runs on [`@material/material-color-utilities`](https://www.npmjs.com/package/@material/material-color-utilities), which is **bundled inside `@rootnative/core`**. There is nothing to install. It lives behind the `@rootnative/core/create-theme` subpath. An import of `@rootnative/core` alone never loads it, so a project that defines its themes by hand doesn't carry it.

The subpath also imports nothing from `react-native`, so it runs in plain Node. You can print a palette from a script, check a theme in CI, or feed the roles to a design-token pipeline:

```bash
node -e "import('@rootnative/core/create-theme').then(({ createMaterialTheme }) => console.log(createMaterialTheme('#006A6A').lightTheme.colors))"
```

It makes a complete MD3 light and dark theme from one hex color, with Google's HCT color space. It derives all 49 color roles for you:

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

This is the easiest way to make a branded theme: pick your brand color, and the function makes the whole palette. See the [Fonts](./fonts) guide for how to load and use custom fonts.

#### Spec-aligned options

These options map directly to MD3 spec primitives. With the defaults, the output is byte-identical to the output of the official `material-color-utilities` library.

| Option | Type | Default | Notes |
|--------|------|---------|-------|
| `variant` | [see below](#md3-scheme-variants) | `'tonalSpot'` | The MD3 scheme that derives the palettes. |
| `contrastLevel` | `'standard' \| 'medium' \| 'high'` | `'standard'` | The MD3 contrast preset. Maps to the MD3 contrast values `0 / 0.5 / 1.0`. |
| `fontFamily` | `string` | platform default | Applied to every typography style. |
| `roundness` | `number` | `1` | The corner-radius multiplier. `0` = sharp, `1` = MD3 default, `2` = doubled. |

##### MD3 scheme variants

Each variant is a spec-defined recipe in `material-color-utilities` that derives the full palette from the seed.

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

`'standard'` matches the MD3 spec exactly. `'medium'` and `'high'` widen the gap between the content and container colors, which helps with WCAG AAA targets or low-vision modes.

#### Explicit overrides

These options deviate from the MD3 spec. **Use them only when no built-in `variant` covers your case.** The spec already covers most looks.

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

Use this option when you need a colorful primary/secondary (for example a brand color), but want untinted surfaces that are near black on OLED (a "carbon" look). For a fully neutral theme, prefer the spec-legal `variant: 'monochrome'`.

##### `seedAdjustments` — chroma overrides

```tsx
const { lightTheme, darkTheme } = createMaterialTheme('#006A6A', {
  seedAdjustments: { primary: 60, secondary: 32 },
})
```

This option overrides the HCT chroma of the primary and secondary palettes, and keeps their hues. Use it only when the spec-defined chromas come out too pastel or too vivid for your brand. Try `variant: 'vibrant'` first. It's the spec-legal answer to "the containers are too pastel".

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

The [`roundness` option](#spec-aligned-options) of `createMaterialTheme` is the usual way to reshape the corners, but it's a seed-color API. When you override an existing theme instead, `applyRoundness(multiplier)` returns the same scaled `Shape` object on its own:

```tsx
import { applyRoundness, material, defineTheme } from '@rootnative/core'

const sharp = defineTheme({
  ...material.lightTheme,
  shape: applyRoundness(0), // every corner square
})
```

It scales the five intermediate tokens (`cornerExtraSmall` through `cornerExtraLarge`) and **leaves `cornerNone` at 0 and `cornerFull` at 999**. Those two are sentinels, not measurements. A scale of them would do nothing, or break the pill shapes that read `cornerFull`. It rounds each result to a whole dp. The returned object carries the multiplier as `shape.roundness`, so a theme records how far you reshaped it. No component reads it, but your own code can.

### Material preset

All MD3 values are also available in one grouped object:

```tsx
import { material } from '@rootnative/core'

material.lightTheme
material.darkTheme
material.defaultTopAppBarTokens
```

## Custom design systems

The theme engine supports any design system, not only MD3. Use `BaseTheme`, `defineTheme`, and `ThemeProvider` to build your own.

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

Use `defineTheme` to make a theme with full type checks:

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

`shape`, `stateLayer`, `elevation` and `motion` are **not** free-form
objects. Each one is a fixed interface. `shape` is `roundness` plus
`cornerNone` through `cornerFull`. `stateLayer` is the six `*Opacity` keys.
`elevation` is `level0` to `level5`, and every level needs all five shadow
fields. `motion` is a flat set of 16 `duration*`, 7 `easing*` and 6 `spring*`
tokens. If you omit or rename any of them, the type check fails, and a token
set with gaps breaks the components that read it at runtime. Spread a preset
to supply them. That is the supported way.

:::

### ThemeProvider

Use `ThemeProvider` for a custom design system too:

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
| `colors` | The color roles of the design system (`Record<string, string>`) |
| `typography` | The type scale variants (`Record<string, TypographyToken>`) |
| `shape` | The `roundness` multiplier plus the corner radius tokens (`cornerNone` through `cornerFull`) |
| `spacing` | The spacing scale (`xs`, `sm`, `md`, `lg`, `xl`) |
| `elevation` | The shadow levels `level0` through `level5` |
| `stateLayer` | The opacity values: `pressedOpacity`, `focusedOpacity`, `hoveredOpacity`, `draggedOpacity`, `disabledOpacity`, `disabledContainerOpacity` |
| `motion` | The duration, easing, and spring tokens; see [Motion](./motion) |
| `topAppBar` | MD3 only, optional. The `AppBar` geometry in dp: `horizontalPadding`, `titleStartInset`, `smallContainerHeight`, `mediumContainerHeight`, `largeContainerHeight`, `topRowHeight`, `sideSlotMinHeight`, `iconFrameSize`, `mediumTitleBottomPadding`, `largeTitleBottomPadding`; see [AppBar](./components/appbar#align-with-a-page-gutter) |

## Type hierarchy

- **`BaseTheme`**: the generic base. Any design system extends it.
- **`Theme`**: the MD3 theme. It extends `BaseTheme` with 49 color roles, 30 typography variants (15 base + 15 MD3 Expressive emphasized), and the optional `topAppBar` tokens. **`MaterialTheme`** is an identical alias. Use it to tell the themes apart in a codebase with more than one design system.

## Summary

| Goal | API |
|------|-----|
| Use MD3 defaults | `<ThemeProvider>` |
| Dark mode | `<ThemeProvider theme={darkTheme}>` |
| Follow the OS light/dark setting | `<ThemeProvider theme={{ light, dark }}>` |
| Let the user switch theme | `const { scheme, setMode } = useThemeMode()` |
| Remember the choice | `<ThemeProvider theme={{ light, dark }} storage={AsyncStorage}>` |
| Theme the navigator screens | `Stack` `contentStyle`, or a navigation theme mapped from `useTheme()`; see [With Expo Router and React Navigation](#with-expo-router-and-react-navigation) |
| Give one part of the app its own colors | A nested `<ThemeProvider theme={{ light, dark }}>`; see [Nested providers](#nested-providers) |
| No light page for dark readers of a static export | `schemeGuardScript()` and `schemeGuardCss()` in `+html.tsx`; see [The first paint of a static export](#the-first-paint-of-a-static-export) |
| Override a few MD3 colors | Spread `lightTheme` and override |
| Branded MD3 theme from one color | `import { createMaterialTheme } from '@rootnative/core/create-theme'` |
| Custom font | `createMaterialTheme('#color', { fontFamily: 'Inter' })`; see [Fonts](./fonts) |
| Switch MD3 variant | `createMaterialTheme('#color', { variant: 'vibrant' })` |
| High-contrast accessibility | `createMaterialTheme('#color', { contrastLevel: 'high' })` |
| Spec-legal monochrome | `createMaterialTheme('#color', { variant: 'monochrome' })` |
| Brand color + pure-grey surfaces (override) | `createMaterialTheme('#color', { surfaceTone: 'neutral' })` |
| Custom palette chroma (override) | `createMaterialTheme('#color', { seedAdjustments: { primary: 60 } })` |
| Fully custom design system | `defineTheme` + `<ThemeProvider>` + `useTheme<T>()` |
