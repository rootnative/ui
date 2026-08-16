---
sidebar_position: 3
---

# Installation

## Prerequisites

- React Native 0.72+
- React 18+
- Expo SDK 54+ (if using Expo)

The library is developed and tested against React Native 0.81 / React 19 / Expo
SDK 54, which is what the example app and templates pin.

## Install packages

<PackageManagerTabs cmd="npm install @rootnative/core @rootnative/components" />

### Peer dependencies

**Install these yourself.** Every package in the list below is declared as an *optional* peer dependency (so you can drop the ones you don't use), and optional peers are never auto-installed — not by npm, not by pnpm, and Yarn classic doesn't auto-install any peers at all. Install the full list once and every component and theming feature works:

<PackageManagerTabs cmd="npm install react-native-safe-area-context react-native-svg react-native-reanimated react-native-worklets @expo/vector-icons" />

On Expo, prefer `npx expo install` with the same package list so every version matches your SDK.

If you'd rather install only what you use:

| Package | Powers | Skip when |
|---------|--------|-----------|
| `react-native-reanimated` | State-layer transitions and gesture-driven components (Slider, Switch) | You only use Typography, Layout, Portal, KeyboardAvoidingWrapper, or Divider — the five components with no animated value |
| `react-native-worklets` | Reanimated 4's worklet runtime | You skip Reanimated |
| `react-native-safe-area-context` | Safe-area insets in AppBar, Layout, BottomSheet, NavigationBar and Snackbar | Always skippable — without it those components render without insets and log a one-time warning |
| `react-native-svg` | CircularProgress and LoadingIndicator | You never import Progress or LoadingIndicator |
| `@expo/vector-icons` | Default resolver for string icon names (`leadingIcon="check"`) | You pass icons as React elements or register a custom `iconResolver` — see the [Icons guide](./icons) |
| `@rootnative/inertia` | Every animation in the library — [motion tokens](./motion), state layers, gesture-driven components | Never. It's a *required* peer of both `@rootnative/core` and `@rootnative/components`, so npm and pnpm install it automatically — only Yarn users need to add it by hand |

> **Importing from the root entry?** `import { Button } from '@rootnative/components'` loads every component, so all the component peers above must be installed. The skip rules apply only if you use subpath imports (`@rootnative/components/button`) exclusively.

[`createMaterialTheme`](./theming#generate-a-theme-from-a-seed-color) needs no extra install: the MD3 color engine (`@material/material-color-utilities`) is bundled inside `@rootnative/core`, behind the `@rootnative/core/create-theme` subpath. Projects that define themes by hand never load it.

`react-native-reanimated` is SDK-vetted and pre-linked in Expo Go on SDK 54 — its native code ships inside the Expo Go binary, so no custom dev client is required. You still install the JavaScript package yourself; `npx expo install` picks the version that matches your SDK. Reanimated 4 runs on `react-native-worklets`, which is why the two are installed together. RootNative never calls Reanimated directly; it animates through [`@rootnative/inertia`](./motion), which sits on top of it.

> **Expo SDK 54 bundles the worklets Babel plugin — nothing to configure.** On bare React Native, add `'react-native-worklets/plugin'` to your `babel.config.js` `plugins` (listed last).

If you pass **string icon names** (e.g. `leadingIcon="check"`) and don't register a custom `iconResolver`, the library resolves them through [`MaterialCommunityIcons`](https://pictogrammers.com/library/mdi/) from `@expo/vector-icons` (installed above). See the [Icons guide](./icons) for details.

To swap in [Lucide](https://lucide.dev), [Phosphor](https://phosphoricons.com), or another vector-icon set as the default, install `@rootnative/icons` for the pre-built adapter helpers:

<PackageManagerTabs cmd="npm install @rootnative/icons" />

## Setup

Wrap your root component with `ThemeProvider`:

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

### With Expo Router

```tsx
// app/_layout.tsx
import { Slot } from 'expo-router'
import { ThemeProvider } from '@rootnative/core'

export default function RootLayout() {
  return (
    <ThemeProvider>
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
