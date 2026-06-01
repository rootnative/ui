---
slug: /introduction
sidebar_position: 1
---

# RootNative UI

Design-system agnostic component library for React Native. Ships with Material Design 3 out of the box.

## Features

- Design-system agnostic theme engine — use MD3, build your own, or mix both
- [Material Design 3](https://m3.material.io/) built-in with light and dark themes
- Generate branded MD3 themes from a single seed color
- Full TypeScript support with strict types
- Accessible by default — proper roles, labels, and states
- Tree-shakeable with subpath exports
- Responsive layout hooks (`useBreakpoint`, `useBreakpointValue`)

## Quick Start

### New project

Scaffold a new Expo project with RootNative UI pre-configured:

```bash
npx rootnative create
```

See the [Quick Start](./quick-start) guide for the full walkthrough.

### Existing project

Add RootNative UI to an existing React Native or Expo project:

<PackageManagerTabs cmd="npm install @rootnative/core @rootnative/components" />

Wrap your app with `ThemeProvider`:

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

Use a component:

```tsx
import { Button } from '@rootnative/components/button'

<Button variant="filled" onPress={() => {}}>
  Get Started
</Button>
```

## Components

### Layout

| Component | Description |
|-----------|-------------|
| [Box](./components/box) | Theme-aware View with spacing shorthand props |
| [Row](./components/row) | Horizontal layout with wrap and invert support |
| [Column](./components/column) | Vertical layout with invert support |
| [Grid](./components/grid) | Equal-width multi-column grid |
| [Layout](./components/layout) | Safe area wrapper with theme background |

### Inputs

| Component | Description |
|-----------|-------------|
| [Button](./components/button) | Actions and choices with a single tap |
| [Checkbox](./components/checkbox) | Selection controls for multiple choices |
| [Chip](./components/chip) | Compact elements for filters and selections |
| [IconButton](./components/icon-button) | Icon-only actions |
| [Radio](./components/radio) | Selection controls for single choice options |
| [Switch](./components/switch) | Toggle controls for on/off settings |
| [TextField](./components/text-field) | Text input with labels and validation |

### Data Display

| Component | Description |
|-----------|-------------|
| [Card](./components/card) | Contained surfaces for related content |
| [List](./components/list) | Vertically arranged items with text and icons |
| [Progress](./components/progress) | Linear and circular progress indicators (determinate / indeterminate) |
| [Typography](./components/typography) | MD3 type scale text rendering |

### Surfaces

| Component | Description |
|-----------|-------------|
| [AppBar](./components/appbar) | Top navigation with title and actions |
