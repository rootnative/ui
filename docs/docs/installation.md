---
sidebar_position: 3
description: Install RootNative UI into an existing app — peer dependencies, provider setup, and the Expo SDK 57 runtime the library targets.
---

# Installation

## Prerequisites

- Expo SDK 57 (if using Expo)
- React Native `>=0.83.0 <0.87.0` (developed and tested against 0.86.3)
- React `>=19.2.3 <20.0.0`

## Platforms

| Platform | Status |
| --- | --- |
| iOS | Supported |
| Android | Supported |
| Web | Supported through `react-native-web` 0.21. Without Expo, see [Web without Expo](./web-without-expo.md) |
| Electron, macOS, Windows, other hosts | Not tested. An Electron renderer runs the [Web without Expo](./web-without-expo.md#electron) recipe; the remaining checks are listed there |

For web, install `react-dom` and `react-native-web` too:
`npx expo install react-dom react-native-web`. Some behavior is different on
web — for example, `hitSlop` has no effect, and dialogs, menus and sheets
contain keyboard focus. See [Accessibility](./accessibility.md) for the full
list.

## Supported runtime

The library targets **one SDK band, not a floor.** Expo SDK 57 is the whole
supported range today, so `SDK 57+` is not correct: the peer ranges stop below
React Native 0.87 and below Reanimated 4.6, which the next SDK will carry.

The reason is that Reanimated and `react-native-worklets` move together, and
each pair works with one React Native band. Reanimated 4.5 needs worklets
0.10.x and React Native 0.83–0.86. A wider range would let a package manager
mix a new Reanimated with an old worklets, which cannot install. Supporting a
second SDK therefore needs a second release line, not a wider range.

The example app and the templates pin the same SDK 57 runtime.

## Install packages

<PackageManagerTabs cmd="npm install @rootnative/core @rootnative/components" />

### Peer dependencies

**npm and pnpm install the required peers for you.** Only three entries below are optional, and no package manager installs an optional peer. Yarn classic installs no peers at all, so Yarn users add the whole list by hand. Installing the full list once is the simplest path, and it makes every component and theming feature work:

<PackageManagerTabs cmd="npm install react-native-safe-area-context react-native-svg react-native-reanimated react-native-worklets @react-native-vector-icons/material-design-icons expo-font" />

On Expo, prefer `npx expo install` with the same package list so every version matches your SDK.

What each one does, and which three you can leave out:

| Package | Status | Powers | Skip when |
|---------|--------|--------|-----------|
| `react-native-reanimated` | optional | State-layer transitions and gesture-driven components (Slider, Switch) | You only use Typography, Layout, Portal, KeyboardAvoidingWrapper, or Divider — the five components with no animated value |
| `react-native-worklets` | optional | Reanimated 4's worklet runtime | You skip Reanimated |
| `react-native-safe-area-context` | **required** | Safe-area insets in AppBar, Layout, BottomSheet, NavigationBar, NavigationDrawer and Snackbar | Never |
| `@react-native-vector-icons/material-design-icons` | optional | `mdiResolver` from `@rootnative/components/mdi`, the MaterialDesignIcons resolver for string icon names (`leadingIcon="check"`). Needs `expo-font` on Expo to load the font at run time | You pass your own `iconResolver`, or you never pass a string icon name. Only the `mdi` subpath imports the package, so a bundler without Expo needs no alias — see [Web without Expo](./web-without-expo.md#5-choose-an-icon-set) |
| `react-native-svg` | **required** | CircularProgress and LoadingIndicator | Never |
| `@rootnative/inertia` | **required** | Every animation in the library — [motion tokens](./motion), state layers, gesture-driven components | Never. It's a required peer of both `@rootnative/core` and `@rootnative/components`, so npm and pnpm install it automatically — only Yarn users need to add it by hand |

> **Two of these used to be optional and no longer are.** The library imports `react-native-safe-area-context` and `react-native-svg` **statically**, and a static import cannot be skipped. A lazy `require()` in a try/catch is the natural shape for an optional peer, but it does not survive the build — see the comment in `src/safe-area.tsx`. Metro builds its module graph by scanning for literal import calls, so it fails with `Unable to resolve module` before any runtime fallback can run. Declaring them optional advertised a fallback that never executed. The icon font went the other way: it is optional because the only import of it sits behind the `@rootnative/components/mdi` subpath, which the root entry never loads. That import is `@react-native-vector-icons/material-design-icons`, the package Expo recommends in place of `@expo/vector-icons` ([Expo blog](https://expo.dev/blog/moving-away-from-expo-vector-icons)). Do not install both: the two packages register the same font and the glyphs render as `?`.

> **Importing from the root entry?** `import { Button } from '@rootnative/components'` loads every component, so all the component peers above must be installed. The skip rules apply only if you use subpath imports (`@rootnative/components/button`) exclusively.

[`createMaterialTheme`](./theming#generate-a-theme-from-a-seed-color) needs no extra install: the MD3 color engine (`@material/material-color-utilities`) is bundled inside `@rootnative/core`, behind the `@rootnative/core/create-theme` subpath. Projects that define themes by hand never load it.

`react-native-reanimated` is SDK-vetted and pre-linked in Expo Go on SDK 57 — its native code ships inside the Expo Go binary, so no custom dev client is required. You still install the JavaScript package yourself; `npx expo install` picks the version that matches your SDK. Reanimated 4 runs on `react-native-worklets`, which is why the two are installed together. RootNative never calls Reanimated directly; it animates through [`@rootnative/inertia`](./motion), which sits on top of it.

> **Expo SDK 57 bundles the worklets Babel plugin — nothing to configure.** On bare React Native, add `'react-native-worklets/plugin'` to your `babel.config.js` `plugins` (listed last).
>
> **Vite, webpack, Electron and other bundlers without Metro** skip `node_modules` by default, so the plugin never reaches the library and nothing animates. [Web without Expo](./web-without-expo.md) has the include list and the full config.

If you pass **string icon names** (e.g. `leadingIcon="check"`), register a resolver on `ThemeProvider`. For [`MaterialDesignIcons`](https://pictogrammers.com/library/mdi/) from `@react-native-vector-icons/material-design-icons` (installed above), pass `mdiResolver` from `@rootnative/components/mdi`, as the setup below shows. Without a resolver a string name renders nothing and the library logs one warning. See the [Icons guide](./icons) for details.

To swap in [Lucide](https://lucide.dev), [Phosphor](https://phosphoricons.com), or another vector-icon set as the default, install `@rootnative/icons` for the pre-built adapter helpers:

<PackageManagerTabs cmd="npm install @rootnative/icons" />

## Setup

Wrap your root component with `ThemeProvider`. The `iconResolver` renders string icon names; `mdiResolver` is the MaterialDesignIcons one, and the [Icons guide](./icons) shows the others:

```tsx
import { mdiResolver } from '@rootnative/components/mdi'
import { ThemeProvider } from '@rootnative/core'

export default function App() {
  return (
    <ThemeProvider iconResolver={mdiResolver}>
      {/* Your app */}
    </ThemeProvider>
  )
}
```

### With Expo Router

```tsx
// app/_layout.tsx
import { Slot } from 'expo-router'
import { mdiResolver } from '@rootnative/components/mdi'
import { ThemeProvider } from '@rootnative/core'

export default function RootLayout() {
  return (
    <ThemeProvider iconResolver={mdiResolver}>
      <Slot />
    </ThemeProvider>
  )
}
```

> **Expo Router brings its own peer set** — `expo-linking`, `expo-constants`, `react-native-screens`, and `@expo/metro-runtime` (for web) — which Yarn classic won't install for you either. `npx expo install expo-router expo-linking expo-constants react-native-screens @expo/metro-runtime` covers all of them with SDK-matched versions.

## Importing Components

Each component has a dedicated subpath export for optimal tree-shaking:

```tsx
import { Button } from '@rootnative/components/button'
import { Card } from '@rootnative/components/card'
import { Typography } from '@rootnative/components/typography'
```

You can also import from the root entry, though subpath imports are preferred:

```tsx
import { Button, Card, Typography } from '@rootnative/components'
```
