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
- Accessible by default — proper roles, labels, and states, and the OS [reduce-motion setting](./motion#reduced-motion) is respected out of the box
- Tree-shakeable with subpath exports
- Responsive layout hooks (`useBreakpoint`, `useBreakpointValue`)

## Get started

- **New project** → [Quick Start](./quick-start) — scaffold a ready-to-run Expo app with `npx rootnative create`.
- **Existing project** → [Installation](./installation) — add RootNative UI to your React Native or Expo app.

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
| [ButtonGroup](./components/button-group) | Connected buttons with single or multi selection |
| [Checkbox](./components/checkbox) | Selection controls for multiple choices |
| [Chip](./components/chip) | Compact elements for filters and selections |
| [FAB](./components/fab) | Floating action button for the screen's primary action |
| [IconButton](./components/icon-button) | Icon-only actions |
| [Radio](./components/radio) | Selection controls for single choice options |
| [Slider](./components/slider) | Select a value or range from a continuous track |
| [Switch](./components/switch) | Toggle controls for on/off settings |
| [TextField](./components/text-field) | Text input with labels and validation |

### Data Display

| Component | Description |
|-----------|-------------|
| [Avatar](./components/avatar) | Image, initials, or icon representation of a person |
| [Card](./components/card) | Contained surfaces for related content |
| [Divider](./components/divider) | Thin horizontal or vertical rule that groups content |
| [List](./components/list) | Vertically arranged items with text and icons |
| [LoadingIndicator](./components/loading-indicator) | MD3 Expressive shape-morphing loading indicator |
| [Progress](./components/progress) | Linear and circular progress indicators (determinate / indeterminate) |
| [Typography](./components/typography) | MD3 type scale text rendering |

### Surfaces

| Component | Description |
|-----------|-------------|
| [AppBar](./components/appbar) | Top navigation with title and actions |
| [Dialog](./components/dialog) | Basic and full-screen modal dialogs |
| [KeyboardAvoidingWrapper](./components/keyboard-avoiding-wrapper) | Keeps inputs visible when the keyboard opens |
| [Menu](./components/menu) | Anchored dropdown menus that flip and shift to stay on screen |
| [Portal](./components/portal) | Render content above the rest of the tree |
| [Snackbar](./components/snackbar) | Queued transient messages with an optional action |
| [Tooltip](./components/tooltip) | Plain and rich tooltips on hover or a long press |

### Navigation

| Component | Description |
|-----------|-------------|
| [Tabs](./components/tabs) | Primary and secondary tab rows, fixed or scrollable |
