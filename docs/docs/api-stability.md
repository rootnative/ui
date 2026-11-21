---
sidebar_position: 11
description: What Root Native promises to keep working and what it does not, stated rather than left to be inferred.
---

# API stability

This page states what Root Native promises to keep working, and what it doesn't.

Versions follow modified semver: a breaking change bumps the middle digit
(`0.1.0`), and fixes and additions bump the last digit (`0.0.2`).

## What carries the semver promise

Everything that you can reach through the declared `exports` of a package:

| Package | Covered |
|---|---|
| `@rootnative/core` | `.`, `./create-theme` and `./static-export` |
| `@rootnative/components` | the root barrel, each component subpath, and `./mdi` |
| `@rootnative/icons` | `.` |
| `@rootnative/seo` | `.`, `./schema`, `./react`, `./expo-router`, `./dom`, `./expo-image` and `./node`, and the commands of `rootnative-seo` with their flags |
| `@rootnative/cli` | command names, their flags, and the shape of `rootnative.json` |

There is no deep import. The `exports` maps resolve only the subpaths listed
above. Nothing under `dist/` or `src/` is addressable, so none of it is API.

The exact set of exported names is in `api-surface.json` at the repo root, and
CI checks it with `pnpm run api:check`. The script reads that file from the
built `.d.ts` files, because the build decides what you can import, not the
intent. An `export *` barrel that re-exports an internal helper by accident is
a real widening, and the snapshot makes it visible.

## React Native props pass through

Every component extends the React Native props of the element it renders:
`ViewProps`, or `PressableProps` for the interactive ones. It forwards each
prop that it doesn't consume to its root node. So `onLayout`, `nativeID`,
`hitSlop`, `testID`, `collapsable` and the rest work everywhere, and you don't
have to check each component.

Two components don't, on purpose, because they render no node of their own:

- **`Portal`** teleports its children into the overlay layer of a host. Style
  the host, or the content you teleport.
- **`SnackbarProvider`** is a provider plus an imperative host. Its `style` prop
  targets the snackbar surface.

Where "root node" is not obvious, it is the node you would expect to address:
the surface for overlays (`Dialog`, `Menu`, `Tooltip`, `BottomSheet`,
`NavigationDrawer`, `SideSheet`, not their scrims), the row for `Tabs` /
`NavigationBar` / `ButtonGroup`, the rail for `NavigationRail`, and the overlay
layer for a named `PortalHost`.

## Where `style` lands

`style` reaches the node that you would place in a layout. The rule has
three cases, and each one is part of the promise:

| Component | Where `style` lands |
|---|---|
| A component in the flow of its parent | The outer node, which the parent lays out |
| `Button`, `IconButton`, `FAB`, `Chip`, `Switch`, and `Card` with `onPress` | The layout keys go to the outer node. Each other key goes to the pressable |
| An overlay: `Dialog`, `Menu`, `Tooltip`, `BottomSheet`, `SearchView`, and the modal `NavigationDrawer` and `SideSheet` | The surface. The component positions an overlay, so no parent lays it out |

The components in the second row put the pressable in an outer view, with
the focus ring and the shadow beside it. So the keys that place or size the
component go to the outer view: `flex`, `flexGrow`, `flexShrink`,
`flexBasis`, `alignSelf`, `width`, each margin, `position` with its offsets,
and `zIndex`. `minWidth` and `maxWidth` go with `width`, and stay on the
pressable when you set them alone. Each other key, such as `backgroundColor`
or `borderRadius`, stays on the pressable. The React Native props (`testID`,
`nativeID`, `onLayout`) go to the pressable too.

Two notes:

- **`TextField` and `SearchBar`** take the props of a text input, and they
  forward those props to the input. `style` goes to the outer node, which
  is the box around the field.
- **A standard `NavigationDrawer` or `SideSheet`** renders in place, so it
  is a component in the flow, and `style` lands on its outer node.

## Safe-area insets are opt-in, except on BottomSheet

The defaults are not uniform, and that is intentional:

| Component | Prop | Default |
|---|---|---|
| `AppBar` | `insetTop` | `false` |
| `NavigationBar` | `insetBottom` | `false` |
| `BottomAppBar` | `insetBottom` | `false` |
| `BottomSheet` | `insetBottom` | **`true`** |
| `NavigationDrawer` (modal) | `insetTop`, `insetBottom`, `insetSides` | **`true`** |
| `NavigationDrawer` (standard) | `insetTop`, `insetBottom`, `insetSides` | `false` |
| `SideSheet` (modal) | `insetTop`, `insetBottom`, `insetSides` | **`true`** |
| `SideSheet` (standard) | `insetTop`, `insetBottom`, `insetSides` | `false` |

`AppBar` and `NavigationBar` default to off, because an ancestor very often
applies that edge already, and a double inset is the more common bug.
`BottomSheet` defaults to on, because a sheet touches the screen edge by
construction. A sheet that ignores the home indicator is wrong, and no ancestor
could have applied the inset. A modal `NavigationDrawer` or `SideSheet`
defaults to on for the same reason: it spans the full screen height through a
portal. Its `insetSides` pads only the side of the screen edge it sits on. A
standard drawer or side sheet renders in place, so the `Layout` around it owns
the edges, and the insets default to off.

`Layout` is the ancestor that owns the edges. Its default `edges` are
`['left', 'right', 'bottom']`: the side insets are 0 in portrait and keep the
content clear of the notch in landscape, and the top is left to `AppBar`. The
bars (`AppBar`, `NavigationBar`, `BottomAppBar`) pad their content by the side
insets by default (`insetSides`), and inside a `Layout` that pads the sides
they pull their background back through that padding, so a bar at the edge of
a screen stays full-bleed in landscape with no extra prop. A bar nested inside
content passes `insetSides={false}`, and an `AppBar` beside a `NavigationRail`
passes `insetSides="end"`. Pass `edges` to `Layout` to change the
sides per screen. The edges that each component pads are listed under
[Orientation](./responsive.md#orientation).

## What is *not* covered

### Copy-pasted component source

`rootnative add` copies component source into your project. After the copy,
those files are yours. We can't break them, because nothing resolves back to
us. The compatibility mechanism there is `rootnative update`, which diffs the
incoming changes against your copy. Semver does not apply.

This includes the shared internals that the CLI copies with the components.
They are internal to the library, and the CLI flattens them into the directory
of each component on install. Their shape is **not** part of the promise.
Build on the props of the components, not on these files:

each file of `internal/`, such as `useStateLayer.ts`, `useMaterialTheme.ts`,
`useBooleanProgress.ts`, `useFocusTrap.ts` and `useAnchorPosition.ts`, and
the two shared modules `elevation-shadow.ts` and `safe-area.tsx`. The
registry entry of a component
(`registry/components/<name>.json`, the `files` array) records which of them
the component uses. The registry is generated from the source, so it stays
accurate when a component changes.

The CLI copies a file that more than one component uses into each of them, so
the same hook can exist several times in your project. That is intentional.
Each installed component stays self-contained, with relative imports, so
`rootnative update` can touch one component without a look at what else shares
its internals. For the same reason these files can't move to a shared `lib/`:
that would change the paths in every project that already installed them.

### Registry pinning

`rootnative init` pins `registryVersion` in your `rootnative.json` to the
release tag of the latest published `@rootnative/core`, so `add` and `update`
fetch reproducible source. It falls back to `main` when npm is unreachable or
when nobody pushed the tag yet.

A pinned project doesn't get new component source on its own. That's the
point. `rootnative upgrade` moves the pin forward, and it does so before it
fetches any component file again.

Without a pin, two people who ran `rootnative add button` a week apart would
get different code. A version can't describe that, so `init` pins one.

## Peer dependency ranges

A peer range can widen in any release. A narrower range is a breaking change,
so it bumps the middle digit. `react-native` and `react` follow what the
supported Expo SDKs ship.

`@rootnative/inertia` is the one peer whose floor moves for correctness, until
its `1.0.0`; see [Motion](./motion.md).
