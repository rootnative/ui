---
sidebar_position: 9
description: Adapt a layout to the current window width with two hooks built on Material Design 3 window size classes.
---

# Responsive

Two hooks from `@rootnative/core` adapt a layout to the current window width, using Material Design 3's [window size classes](https://m3.material.io/foundations/layout/applying-layout/window-size-classes). Both read `useWindowDimensions()` from React Native, so they update on rotation, on a web browser resize, and on split-screen and foldable transitions — anywhere RN reports a new width.

Nothing else in the library depends on them. Components size themselves from their own props; these hooks are for *your* layout decisions.

## Breakpoints

| Breakpoint | Width | Typical device |
|------------|-------|----------------|
| `compact` | 0–599 | Phone in portrait |
| `medium` | 600–839 | Phone in landscape, small tablet in portrait |
| `expanded` | 840–1199 | Tablet in landscape, small desktop window |
| `large` | 1200–1599 | Desktop |
| `extraLarge` | 1600+ | Large desktop, external display |

The numbers are exported as `breakpoints`, so you can reuse the same thresholds in a media query or a plain width comparison rather than hardcoding them:

```tsx
import { breakpoints } from '@rootnative/core'

breakpoints.medium // 600
```

Each name is the *lower* bound and matching is inclusive — a window exactly 600dp wide is `medium`, not `compact`. `compact` starts at 0, so there is always a match.

## `useBreakpoint()`

Returns the current breakpoint name.

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

Reach for this when the *shape* of the tree changes — a different component, a branch rendered or not. When only a value changes, the next hook is less code.

## `useBreakpointValue(values)`

Returns one value per breakpoint, cascading down to the nearest smaller entry you did set.

```tsx
import { useBreakpointValue } from '@rootnative/core'
import { Grid } from '@rootnative/components/layout'

function PhotoGrid({ photos }) {
  const columns = useBreakpointValue({ compact: 1, medium: 2, expanded: 4 })

  return <Grid columns={columns}>{photos.map(renderPhoto)}</Grid>
}
```

That map resolves to 1 column on a phone, 2 at `medium`, and 4 at `expanded`, `large` **and** `extraLarge` — the two you left out cascade down to `expanded`. Only set the breakpoints where something actually changes.

**`compact` is required.** The type is `Partial<Record<Breakpoint, T>> & Record<'compact', T>`, so TypeScript rejects a map without it. There is no breakpoint below `compact` to fall back to, and a hook that could return `undefined` would push a narrowing check into every call site.

The values are unconstrained, so this is not just for numbers:

```tsx
const padding = useBreakpointValue({ compact: 16, expanded: 24 })
const direction = useBreakpointValue<'column' | 'row'>({
  compact: 'column',
  medium: 'row',
})
const variant = useBreakpointValue({ compact: 'text', medium: 'outlined' })
```

Keep the argument cheap to build. It is re-created on every render, and a value like a JSX element or a fresh object will be a new reference each time — fine for a style number, worth a `useMemo` if it feeds a memoized child.

## Types

```ts
import type { Breakpoint, BreakpointValues } from '@rootnative/core'

// 'compact' | 'medium' | 'expanded' | 'large' | 'extraLarge'
type Breakpoint

// Partial<Record<Breakpoint, T>> & Record<'compact', T>
type BreakpointValues<T>
```

`Breakpoint` is a union of the five names, useful for typing your own props (`minBreakpoint?: Breakpoint`). `BreakpointValues<T>` is what `useBreakpointValue` accepts — declare it when you want to build a map somewhere other than the call site:

```tsx
import type { BreakpointValues } from '@rootnative/core'

const GUTTERS: BreakpointValues<number> = { compact: 16, expanded: 24 }

function Page() {
  const gutter = useBreakpointValue(GUTTERS)
  // ...
}
```

## Notes

- **Window width, not element width.** Both hooks measure the window. A component inside a narrow sidebar on a wide screen still reads `expanded`. For element-relative sizing use `onLayout` or a flex layout.
- **Static export on web — handled for you.** A static export (`web.output: 'static'`) renders on a server with no DOM, where react-native-web's `Dimensions` is fixed at `width: 0`, so the HTML always ships the `compact` layout. React 19 does *not* repair a `className`/`style` mismatch during hydration — it adopts the server DOM, keeps it, and reports no recoverable error — so a naive hook would leave a tablet on the phone layout with no console signal. `useBreakpoint` is hydration-safe: it reports `compact` while the client hydrates, then switches to the measured breakpoint on the re-render React schedules afterwards. **You do not need a `useHydrated` gate at the call site**, and `Grid` inherits the same safety for its `columns` map. The visible consequence is that a breakpoint-dependent layout starts compact and widens a frame later; the server cannot know the viewport, so make the compact variant an honest first paint. A plain (single-page) web export never hydrates, so it is correct from the first render.
- **These are not styling hooks.** They return plain values. Nothing recomputes unless the window width crosses a threshold and React re-renders.
