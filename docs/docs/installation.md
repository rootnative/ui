---
sidebar_position: 3
description: Install Root Native UI into an existing app — peer dependencies, provider setup, and the Expo SDK 58 runtime the library targets.
---

# Installation

## Prerequisites

- Expo SDK 58 (if you use Expo)
- React Native `>=0.88.0 <0.89.0` (developed and tested against 0.88.1)
- React `>=19.3.0 <20.0.0`

## Platforms

| Platform | Status |
| --- | --- |
| iOS | Supported |
| Android | Supported |
| Web | Supported through `react-native-web` 0.21. Without Expo, see [Web without Expo](./web-without-expo.md) |
| Electron, macOS, Windows, other hosts | Not tested. An Electron renderer runs the [Web without Expo](./web-without-expo.md#electron) recipe; that page lists the remaining checks |

For the web, also install `react-dom` and `react-native-web`:
`npx expo install react-dom react-native-web`. Some behavior is different on
the web. For example, `hitSlop` has no effect, and dialogs, menus and sheets
keep the keyboard focus inside. See [Accessibility](./accessibility.md) for the
full list.

## Supported runtime

The library targets **one SDK band, not a floor.** Expo SDK 58 is the whole
supported range today, so `SDK 58+` is not correct. The peer ranges stop below
React Native 0.89 and below Reanimated 4.8, which the next SDK will carry.

The reason: Reanimated and `react-native-worklets` move together, and each pair
works with one React Native band. Reanimated 4.7 needs worklets 0.13.x and
React Native 0.86 to 0.88, and React 19.2.3 does not pair with React Native
0.88. A wider range would let a package manager mix a new Reanimated with an
old worklets, and that pair can't install. So a second SDK needs a second
release line, not a wider range.

Each release line supports one Expo SDK band. Install the line that matches the SDK of the app.

| Expo SDK | `@rootnative/core`, `components`, `utils`, `icons`, `seo` | `@rootnative/inertia` |
| --- | --- | --- |
| 58 | `0.0.0-alpha.29` and later | `0.0.20` and later |
| 57 | `0.0.0-alpha.16` to `0.0.0-alpha.28` (`npm install @rootnative/components@0.0.0-alpha.28`) | `0.0.11` to `0.0.19` |

The example app and the templates pin the same SDK 58 runtime.

## Install packages

<PackageManagerTabs cmd="npm install @rootnative/core @rootnative/components" />

### Peer dependencies

**npm and pnpm install the required peers for you.** Only three entries below are optional, and no package manager installs an optional peer. Yarn classic installs no peers at all, so with Yarn you add the whole list by hand. The simplest path is to install the full list once. Then every component and theming feature works:

<PackageManagerTabs cmd="npm install react-native-safe-area-context react-native-svg react-native-reanimated react-native-worklets @react-native-vector-icons/material-design-icons expo-font" />

On Expo, prefer `npx expo install` with the same package list, so every version matches your SDK.

What each package does, and which three you can leave out:

| Package | Status | Powers | Skip when |
|---------|--------|--------|-----------|
| `react-native-reanimated` | optional | State-layer transitions and gesture-driven components (Slider, Switch) | You only use Typography, Layout, Portal, KeyboardAvoidingWrapper, or Divider, the five components with no animated value |
| `react-native-worklets` | optional | The worklet runtime of Reanimated 4 | You skip Reanimated |
| `react-native-safe-area-context` | **required** | Safe-area insets in AppBar, BottomAppBar, Layout, BottomSheet, NavigationBar, NavigationDrawer, SideSheet and Snackbar | Never |
| `@react-native-vector-icons/material-design-icons` | optional | `mdiResolver` from `@rootnative/components/mdi`, the MaterialDesignIcons resolver for string icon names (`leadingIcon="check"`). On Expo it needs `expo-font` to load the font at run time | You pass your own `iconResolver`, or you never pass a string icon name. Only the `mdi` subpath imports the package, so a bundler without Expo needs no alias; see [Web without Expo](./web-without-expo.md#5-choose-an-icon-set) |
| `react-native-svg` | **required** | CircularProgress and LoadingIndicator | Never |
| `@rootnative/inertia` | **required** | Every animation in the library: the [motion tokens](./motion), the state layers, and the gesture-driven components | Never. It's a required peer of both `@rootnative/core` and `@rootnative/components`, so npm and pnpm install it for you. Only with Yarn do you add it by hand |

> **Two of these used to be optional, and they are required now.** The library imports `react-native-safe-area-context` and `react-native-svg` **statically**, and you can't skip a static import. A lazy `require()` in a try/catch is the natural shape of an optional peer, but it doesn't survive the build; see the comment in `src/safe-area.tsx`. Metro builds its module graph from the literal import calls, so it fails with `Unable to resolve module` before any runtime fallback can run. The optional status advertised a fallback that never ran. The icon font went the other way. It is optional, because its only import sits behind the `@rootnative/components/mdi` subpath, which the root entry never loads. That import is `@react-native-vector-icons/material-design-icons`, the package Expo recommends in place of `@expo/vector-icons` ([Expo blog](https://expo.dev/blog/moving-away-from-expo-vector-icons)). Don't install both: the two packages register the same font, and the glyphs render as `?`.

> **Do you import from the root entry?** `import { Button } from '@rootnative/components'` loads every component, so you must install all the component peers above. The skip rules apply only when you use subpath imports (`@rootnative/components/button`) and nothing else.

[`createMaterialTheme`](./theming#generate-a-theme-from-a-seed-color) needs no extra install. `@rootnative/core` bundles the MD3 color engine (`@material/material-color-utilities`) behind the `@rootnative/core/create-theme` subpath. A project that defines its themes by hand never loads it.

`react-native-reanimated` is SDK-vetted, and Expo Go on SDK 58 links it already: its native code ships inside the Expo Go binary, so you need no custom dev client. You still install the JavaScript package yourself, and `npx expo install` picks the version that matches your SDK. Reanimated 4 runs on `react-native-worklets`, and that is why you install the two together. Root Native never calls Reanimated directly. It animates through [`@rootnative/inertia`](./motion), which sits on top of Reanimated.

> **Expo SDK 58 bundles the worklets Babel plugin, so there is nothing to configure.** On bare React Native, add `'react-native-worklets/plugin'` to the `plugins` of your `babel.config.js`, as the last entry.
>
> **Vite, webpack, Electron and other bundlers without Metro** skip `node_modules` by default, so the plugin never reaches the library and nothing animates. [Web without Expo](./web-without-expo.md) has the include list and the full config.

If you pass **string icon names** (for example `leadingIcon="check"`), register a resolver on `ThemeProvider`. For [`MaterialDesignIcons`](https://pictogrammers.com/library/mdi/) from `@react-native-vector-icons/material-design-icons` (installed above), pass `mdiResolver` from `@rootnative/components/mdi`, as the setup below shows. Without a resolver, a string name renders nothing, and the library logs one warning. See the [Icons guide](./icons) for details.

To use [Lucide](https://lucide.dev), [Phosphor](https://phosphoricons.com), or another vector-icon set as the default, install `@rootnative/icons`. It has the pre-built adapter helpers:

<PackageManagerTabs cmd="npm install @rootnative/icons" />

## Setup

Wrap your root component in `ThemeProvider`. The `iconResolver` renders string icon names. `mdiResolver` is the MaterialDesignIcons resolver, and the [Icons guide](./icons) shows the others:

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

> **Expo Router has its own peer set**: `expo-linking`, `expo-constants`, `react-native-screens`, and `@expo/metro-runtime` (for the web). Yarn classic doesn't install these either. `npx expo install expo-router expo-linking expo-constants react-native-screens @expo/metro-runtime` installs all of them with SDK-matched versions.

## Importing Components

Each component has its own subpath export, so the bundler can tree-shake the rest:

```tsx
import { Button } from '@rootnative/components/button'
import { Card } from '@rootnative/components/card'
import { Typography } from '@rootnative/components/typography'
```

You can also import from the root entry, but a subpath import is better:

```tsx
import { Button, Card, Typography } from '@rootnative/components'
```
