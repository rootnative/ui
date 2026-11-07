---
slug: /introduction
sidebar_position: 1
description: Design-system agnostic component library for React Native, with Material Design 3 out of the box.
---

# Root Native UI

Root Native UI is a component library for React Native that follows your design system. Material Design 3 is the default.

It runs on iOS, Android, and the web (through `react-native-web`), on the Expo SDK 58 runtime. See [Installation](./installation#platforms) for the platform table.

## Features

- A theme engine for any design system: use MD3, make your own, or mix both
- [Material Design 3](https://m3.material.io/) built in, with a light and a dark theme
- A full MD3 theme from one seed color
- Full TypeScript support with strict types
- Accessible by default: each component sets its role, its label, and its state, and each animation obeys the OS [reduce-motion setting](./motion#reduced-motion)
- Tree-shakeable, with one subpath export per component
- [Responsive layout hooks](./responsive) (`useBreakpoint`, `useBreakpointValue`, `useWindowDimensions`) on the MD3 window size classes

## Get started

- **New project**: [Quick Start](./quick-start) makes a ready-to-run Expo app with `npx rootnative create`.
- **Existing project**: [Installation](./installation) adds Root Native UI to your React Native or Expo app.

## Components

### Layout

| Component | Description |
|-----------|-------------|
| [Box](./components/box) | A theme-aware View with spacing shorthand props |
| [Row](./components/row) | A horizontal layout with wrap and invert support |
| [Column](./components/column) | A vertical layout with invert support |
| [Grid](./components/grid) | An equal-width multi-column grid |
| [Layout](./components/layout) | A safe-area wrapper with the theme background |

### Inputs

| Component | Description |
|-----------|-------------|
| [Button](./components/button) | Actions and choices with one tap |
| [ButtonGroup](./components/button-group) | Connected buttons with single or multi selection |
| [Checkbox](./components/checkbox) | Selection controls for multiple choices |
| [Chip](./components/chip) | Compact elements for filters and selections |
| [FAB](./components/fab) | A floating action button for the primary action of the screen |
| [IconButton](./components/icon-button) | Icon-only actions |
| [Radio](./components/radio) | Selection controls for one choice |
| [SearchBar](./components/search-bar) | An MD3 search bar with a clear button and trailing actions |
| [Slider](./components/slider) | Selects a value or a range from a continuous track |
| [Switch](./components/switch) | Toggle controls for on/off settings |
| [TextField](./components/text-field) | A text input with labels and validation |

### Data Display

| Component | Description |
|-----------|-------------|
| [Avatar](./components/avatar) | An image, initials, or an icon that represents a person |
| [Card](./components/card) | Contained surfaces for related content |
| [Divider](./components/divider) | A thin horizontal or vertical rule that groups content |
| [Icon](./components/icon) | Any icon source, rendered through the theme resolver |
| [List](./components/list) | Vertically arranged items with text and icons |
| [LoadingIndicator](./components/loading-indicator) | The MD3 Expressive shape-morphing loading indicator |
| [Progress](./components/progress) | Linear and circular progress indicators (determinate / indeterminate) |
| [Typography](./components/typography) | Text in the MD3 type scale |

### Surfaces

| Component | Description |
|-----------|-------------|
| [AppBar](./components/appbar) | Top navigation with a title and actions |
| [BottomAppBar](./components/bottom-app-bar) | An 80dp bottom bar with icon actions and a flat FAB |
| [BottomSheet](./components/bottom-sheet) | Draggable modal and standard sheets with snap points |
| [Dialog](./components/dialog) | Basic and full-screen modal dialogs |
| [KeyboardAvoidingWrapper](./components/keyboard-avoiding-wrapper) | Keeps inputs visible when the keyboard opens |
| [Menu](./components/menu) | Anchored dropdown menus that flip and shift to stay on screen |
| [Portal](./components/portal) | Renders content above the rest of the tree |
| [SideSheet](./components/side-sheet) | Modal and standard sheets at the side, with a headline and actions |
| [Snackbar](./components/snackbar) | Queued transient messages with an optional action |
| [Tooltip](./components/tooltip) | Plain and rich tooltips on hover or a long press |

### Navigation

| Component | Description |
|-----------|-------------|
| [Tabs](./components/tabs) | Primary and secondary tab rows, fixed or scrollable |
| [NavigationBar](./components/navigation-bar) | An 80dp bottom destination bar with an animated indicator pill |
| [NavigationRail](./components/navigation-rail) | An 80dp side rail of destinations with an optional menu and FAB header |
| [NavigationDrawer](./components/navigation-drawer) | A modal or standard side panel of destinations with sections and badges |
