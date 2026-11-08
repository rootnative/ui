---
sidebar_position: 9
description: Adapt a layout to the current window width with two hooks built on Material Design 3 window size classes.
---

# Responsive

Two hooks from `@rootnative/core` adapt a layout to the current window width, with the Material Design 3 [window size classes](https://m3.material.io/foundations/layout/applying-layout/window-size-classes). A third hook, [`useWindowDimensions()`](#usewindowdimensions), returns the raw window size. All three read `useWindowDimensions()` from React Native, so they update on rotation, on a browser resize, and on split-screen and foldable transitions: wherever RN reports a new width.

Nothing else in the library depends on them. A component sizes itself from its own props. These hooks are for *your* layout decisions.

## Breakpoints

| Breakpoint | Width | Typical device |
|------------|-------|----------------|
| `compact` | 0–599 | Phone in portrait |
| `medium` | 600–839 | Phone in landscape, small tablet in portrait |
| `expanded` | 840–1199 | Tablet in landscape, small desktop window |
| `large` | 1200–1599 | Desktop |
| `extraLarge` | 1600+ | Large desktop, external display |

The numbers are exported as `breakpoints`, so you can reuse the same thresholds in a media query or a plain width comparison, without a hardcoded copy:

```tsx
import { breakpoints } from '@rootnative/core'

breakpoints.medium // 600
```

Each name is the *lower* bound, and the match is inclusive: a window exactly 600dp wide is `medium`, not `compact`. `compact` starts at 0, so there is always a match.

## `useBreakpoint()`

Returns the name of the current breakpoint.

```tsx
import { useBreakpoint } from '@rootnative/core'
import { NavigationBar } from '@rootnative/components/navigation-bar'

function Shell({ children }) {
  const breakpoint = useBreakpoint()

  return (
    <>
      {children}
      {breakpoint === 'compact' ? <NavigationBar items={items} /> : null}
    </>
  )
}
```

Use this hook when the *shape* of the tree changes: a different component, or a branch that renders or not. When only a value changes, the next hook is less code.

## `useBreakpointValue(values)`

Returns one value per breakpoint. A missing breakpoint falls back to the nearest smaller entry that you set.

```tsx
import { useBreakpointValue } from '@rootnative/core'
import { Grid } from '@rootnative/components/layout'

function PhotoGrid({ photos }) {
  const columns = useBreakpointValue({ compact: 1, medium: 2, expanded: 4 })

  return <Grid columns={columns}>{photos.map(renderPhoto)}</Grid>
}
```

That map resolves to 1 column on a phone, 2 at `medium`, and 4 at `expanded`, `large` **and** `extraLarge`. The two you left out fall back to `expanded`. Set only the breakpoints where something changes.

**`compact` is required.** The type is `Partial<Record<Breakpoint, T>> & Record<'compact', T>`, so TypeScript rejects a map without it. There is no breakpoint below `compact` to fall back to, and a hook that could return `undefined` would push a narrowing check into every call site.

The values have no constraint, so this hook is not only for numbers:

```tsx
const padding = useBreakpointValue({ compact: 16, expanded: 24 })
const direction = useBreakpointValue<'column' | 'row'>({
  compact: 'column',
  medium: 'row',
})
const variant = useBreakpointValue({ compact: 'text', medium: 'outlined' })
```

Keep the argument cheap to build. You create it again on every render, and a value such as a JSX element or a fresh object is a new reference each time. That is fine for a style number. Add a `useMemo` when the value feeds a memoized child.

## `useWindowDimensions()`

Returns the window size: `width`, `height`, `scale` and `fontScale`. It replaces the `react-native` hook of the same name, and it is safe in a static web export.

```tsx
import { useWindowDimensions } from '@rootnative/core'

function Hero() {
  const { width } = useWindowDimensions()
  const heroStyle = { height: width * 0.56 }

  return <View style={heroStyle} />
}
```

Use it when the layout needs a number, not a size class: a hero height, a carousel slot, or a column count from a card width. When a size class is enough, `useBreakpoint` is less code.

**Don't use the `react-native` hook for a value that reaches a style on a static export.** On the server it measures a 0 by 0 window, and React keeps that style when the client hydrates. The hero above would stay 0 high on a desktop screen until the reader resizes the window. The [static export note](#notes) below explains why. `useBreakpoint` reads this hook, so a breakpoint and a raw width always agree.

To keep a project on this hook, add an ESLint rule:

```js
'no-restricted-imports': [
  'error',
  {
    paths: [
      {
        name: 'react-native',
        importNames: ['useWindowDimensions'],
        message: 'Import useWindowDimensions from @rootnative/core.',
      },
    ],
  },
],
```

## Orientation

An Expo app with `"orientation": "portrait"` in `app.json` doesn't rotate, and Expo's own templates set that value. Set it to `"default"` to let the app rotate. The hooks above update on each rotate.

In landscape, the notch or the Dynamic Island moves to the left or the right side, so the side safe-area insets aren't 0 any more. Each component pads only the edges it touches:

| Component | Edges it pads | Prop and default |
|---|---|---|
| [`Layout`](./components/layout.mdx) | Left, right, bottom | `edges`, all three on |
| `AppBar` | Top, left, right | `insetTop` off, `insetSides` on |
| `NavigationBar`, `BottomAppBar` | Bottom, left, right | `insetBottom` off, `insetSides` on |
| Modal `NavigationDrawer` and `SideSheet` | Top, bottom, and the side the surface sits on | `insetTop`, `insetBottom` and `insetSides`, all on |
| `BottomSheet` | Bottom | `insetBottom` on |
| `Snackbar` | Bottom | Always |
| Full-screen `Dialog` | All four | Always |
| Full-screen `SearchView` | Top, bottom | Always |
| `Menu`, `Tooltip` | They open inside all four insets | Always |
| Any other component | None: it sits inside the `Layout` padding | — |

`Layout` owns the sides, so a screen needs the side padding in one place only. Your content inside a `Layout` keeps clear of the notch with no change. In portrait the side insets are 0, so the default costs nothing there.

The bars pad their own content by the side insets. Inside a `Layout` that pads the sides, they also pull their background out through that padding, so a bar at the screen edge stays full width. Give a bar inside content, such as a card, `insetSides={false}`.

Overlays render in the [`PortalHost`](./components/portal.mdx#setup), outside the `Layout`, so each overlay pads its own edges. Put the host outside `Layout`, or an overlay gets its insets twice.

## Types

```ts
import type { Breakpoint, BreakpointValues } from '@rootnative/core'

// 'compact' | 'medium' | 'expanded' | 'large' | 'extraLarge'
type Breakpoint

// Partial<Record<Breakpoint, T>> & Record<'compact', T>
type BreakpointValues<T>
```

`Breakpoint` is a union of the five names. Use it to type your own props (`minBreakpoint?: Breakpoint`). `BreakpointValues<T>` is what `useBreakpointValue` accepts. Declare it when you build a map somewhere other than the call site:

```tsx
import type { BreakpointValues } from '@rootnative/core'

const GUTTERS: BreakpointValues<number> = { compact: 16, expanded: 24 }

function Page() {
  const gutter = useBreakpointValue(GUTTERS)
  // ...
}
```

## Notes

- **Window width, not element width.** All three hooks measure the window. A component inside a narrow sidebar on a wide screen still reads `expanded`. For a size relative to an element, use `onLayout` or a flex layout.
- **Static export on web: handled for you.** A static export (`web.output: 'static'`) renders on a server with no DOM. There, the `Dimensions` of react-native-web is fixed at `width: 0`, so the HTML always ships the `compact` layout. React 19 does *not* repair a `className`/`style` mismatch during hydration. It adopts the server DOM, keeps it, and reports no recoverable error. So a naive hook would leave a tablet on the phone layout, with no console signal. The three hooks are hydration-safe. `useWindowDimensions` reports the 0 by 0 window of the server while the client hydrates, then switches to the measured window on the re-render that React schedules after it. `useBreakpoint` reports `compact` for the same span. The `react-native` hook is not hydration-safe. **You don't need a `useHydrated` gate at the call site**, and `Grid` inherits the same safety for its `columns` map. The visible result: a layout that depends on a breakpoint starts compact and widens a frame later. The server can't know the viewport, so make the compact variant an honest first paint. A plain (single-page) web export never hydrates, so it is correct from the first render. `ThemeProvider` reads the same hydration flag for `mode="system"`. The server has no `matchMedia`, so it renders light, and the provider keeps light while the client hydrates. So a window size and a color scheme switch on the same render.
- **These are not styling hooks.** They return plain values. A breakpoint value changes only when the window width crosses a threshold. `useWindowDimensions` changes on every resize, so a component that reads it re-renders on every resize.
