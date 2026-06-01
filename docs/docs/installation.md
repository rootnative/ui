---
sidebar_position: 3
---

# Installation

## Prerequisites

- React Native 0.81+
- React 19+
- Expo SDK 54+ (if using Expo)

## Install packages

<PackageManagerTabs cmd="npm install @rootnative/core @rootnative/components" />

### Peer dependencies

`@rootnative/components` requires these peer dependencies:

<PackageManagerTabs cmd="npm install react-native-safe-area-context react-native-reanimated" />

`react-native-reanimated` drives state-layer transitions and gesture-driven components (Slider, Switch). It's bundled with Expo SDK 54 and works in Expo Go — no custom dev client required. You can skip it only if you exclusively use static components (Typography, Layout, Avatar).

If you pass **string icon names** (e.g. `leadingIcon="check"`) and don't register a custom `iconResolver`, the library resolves them through [`MaterialCommunityIcons`](https://pictogrammers.com/library/mdi/). Install:

<PackageManagerTabs cmd="npm install @expo/vector-icons" />

You can skip this if you only ever pass icons as React elements (`leadingIcon={<Check />}`) or register a custom resolver for a different library. See the [Icons guide](./icons) for details.

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
