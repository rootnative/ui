---
sidebar_position: 11
---

# API stability

What RootNative promises to keep working, and what it doesn't — stated rather
than left to be inferred.

:::info Still a prerelease

`@rootnative/*` has not reached a stable version yet, so the guarantees below
describe the shape the API is being frozen into, not a promise that is already
in force. Prereleases break things freely — read the
[changelog](https://github.com/rootnative/ui/blob/main/CHANGELOG.md) in full
when you upgrade.

:::

## What carries the semver promise

Everything reachable through a package's declared `exports`:

| Package | Covered |
|---|---|
| `@rootnative/core` | `.` and `./create-theme` |
| `@rootnative/components` | the root barrel and all 28 component subpaths |
| `@rootnative/icons` | `.` |
| `@rootnative/cli` | command names, their flags, and the shape of `rootnative.json` |

There is no deep-import escape hatch: the `exports` maps resolve only the
subpaths listed above, so nothing under `dist/` or `src/` is addressable and
none of it is API.

The exact set of exported names is snapshotted in `api-surface.json` at the repo
root and checked in CI with `pnpm run api:check`. That file is read from the
built `.d.ts` files, because what you can import is decided by the build rather
than by intent — an `export *` barrel that accidentally re-exports an internal
helper is a real widening, and the snapshot is what makes it visible.

## React Native props pass through

Every component extends React Native's own props for the element it renders —
`ViewProps`, or `PressableProps` for the interactive ones — and forwards
anything it doesn't consume to its root node. So `onLayout`, `nativeID`,
`hitSlop`, `testID`, `collapsable` and the rest work everywhere, and you don't
have to check per component.

Two components deliberately don't, because they render no node of their own:

- **`Portal`** teleports its children into a host's overlay layer. Style the
  host, or the content you teleport.
- **`SnackbarProvider`** is a provider plus an imperative host. Its `style` prop
  targets the snackbar surface.

Where "root node" is not obvious, it is the node you would expect to address:
the surface for overlays (`Dialog`, `Menu`, `Tooltip`, `BottomSheet` — not their
scrims), the row for `Tabs` / `NavigationBar` / `ButtonGroup`, and the overlay
layer for a named `PortalHost`.

## Safe-area insets are opt-in, except on BottomSheet

The defaults are not uniform, and that is intentional:

| Component | Prop | Default |
|---|---|---|
| `AppBar` | `insetTop` | `false` |
| `NavigationBar` | `insetBottom` | `false` |
| `BottomSheet` | `insetBottom` | **`true`** |

`AppBar` and `NavigationBar` default off because an ancestor very often already
applies that edge, and applying it twice is the more common bug. `BottomSheet`
defaults on because a sheet is flush to the screen edge by construction — a
sheet that ignores the home indicator is simply wrong, and there is no ancestor
that could have handled it.

## What is *not* covered

### Copy-pasted component source

`rootnative add` copies component source into your project. Those files are
yours once copied — we can't break them, because nothing resolves back to us.
The compatibility mechanism there is `rootnative update`, which diffs incoming
changes against your copy, not semver.

That includes the shared internals the CLI vendors alongside components. They are
internal to the library, flattened into each component's directory on install,
and their shape is **not** part of the promise — build on the props of the
components themselves, not on these:

`useStateLayer.ts`, `useBooleanProgress.ts`, `usePressMorph.ts`,
`elevationShadow.ts`, `useFocusTrap.ts`, `useAnchorPosition.ts` and
`safe-area.tsx`. Which of them a given component pulls is recorded in its
registry entry (`registry/components/<name>.json`, the `files` array), which is
generated from the source — so that stays accurate as components change.

A file used by more than one component is copied into each of them, so the same
hook can exist several times in your project. That is deliberate: it keeps every
installed component self-contained with relative imports, which is what lets
`rootnative update` touch one component without reasoning about what else shares
its internals. It is also why these files can't move to a shared `lib/` — that
would change paths in every project that already installed them.

### Registry pinning

`rootnative init` pins `registryVersion` in your `rootnative.json` to the
release tag matching the latest published `@rootnative/core`, so `add` and
`update` fetch reproducible source. It falls back to `main` when npm is
unreachable or the tag hasn't been pushed yet.

A pinned project doesn't pick up new component source on its own — that's the
point. `rootnative upgrade` moves the pin forward, and does so before it
re-fetches any component files.

Earlier prereleases defaulted to `main`, which meant two people running
`rootnative add button` a week apart got different code. Semver can't describe
that, so it changed.

## Peer dependency ranges

Peer ranges widen in minors and are only narrowed in a major. `react-native`
and `react` track what the supported Expo SDKs ship.

`@rootnative/inertia` is the one peer whose floor moves on correctness grounds
while it is pre-1.0; see [Motion](./motion.md).
