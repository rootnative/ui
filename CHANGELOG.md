# Changelog

All `@rootnative/*` packages (`core`, `components`, `icons`, `cli`, and the
`rootnative` binary) release together with a synced version, so this is a
single changelog for the repo. These are prereleases and they break things
freely — assume every entry can require a change on upgrade, and read the
whole release rather than scanning for a label.

Prior history: these packages were published as `@onlynative/*` through
`0.0.0-alpha.8`. The `@rootnative` line below starts over at `0.0.0-alpha.0`.

## Unreleased

## 0.0.0-alpha.14 — 2026-08-22

### `Grid` takes a breakpoint map for `columns`

`columns` now accepts a map of [window size
classes](https://rootnative.github.io/ui/responsive) as well as a number, so
`<Grid columns={{ compact: 1, medium: 2, expanded: 4 }}>` replaces a
`useBreakpointValue` call at the call site. A map cascades down to the nearest
smaller breakpoint, and the required `compact` key makes a missing width a
compile error rather than an `undefined` reaching `flexBasis`.

The numeric form is unchanged, but `Grid` now reads the window width for every
consumer. A constant `columns` resolves to a stable value, so the cell style
keeps its object identity and nothing re-renders that did not before.

### `Grid.Cell` spans more than one column

A plain `Grid` child always fills one column, so an asymmetric layout meant
dropping to `Row` with a hand-written `flexBasis`. `Grid.Cell` spans a
`span` count of columns instead:

```tsx
<Grid columns={12} gap="sm">
  <Grid.Cell span={8}>{/* main */}</Grid.Cell>
  <Grid.Cell span={4}>{/* sidebar */}</Grid.Cell>
</Grid>
```

`span` takes a breakpoint map too, and clamps to the parent's column count — an
oversized span fills the row instead of overflowing it. Plain children keep
today's behaviour and still read as `span={1}`, so the two forms mix in one
grid.

`Grid` passes the column count and gutter to a cell through `cloneElement`, and
detects a cell by element type rather than by `displayName`, which a minifier
rewrites. That keeps the geometry a private contract between the two components:
it adds no React context, and the injected fields stay off `GridCellProps`. A
`Grid.Cell` rendered outside a `Grid` warns once in development and renders
full-width.

New exports: `GridCell` and `GridCellProps`.

### `Grid` is now tested against the DOM

`Grid` had no web test, so every assertion about it lived in the native
project — which asserts on the React prop and is structurally blind to what
react-native-web emits. Two things were unproven for the component's whole life:
that the percentage `flexBasis` survives the `as unknown as number` cast into a
real `flex-basis: 50%`, and that the row's negative margin stays the exact
negation of the cell padding, which is what keeps a grid from adding a
horizontal scrollbar.

`grid.web.test.tsx` pins both. One finding is worth recording, because it
contradicts what the elevation notes imply: react-native-web resolves *inline*
logical properties to physical ones at render time, so the DOM shows
`padding-left`, never `padding-inline-start`. Logical-property emission applies
to `StyleSheet`-class styles, and `Grid`'s cell styles are dynamic `useMemo`
objects. The gutter is direction-correct on web because it is symmetric, so the
web suite pins that symmetry and the native suite keeps asserting the logical
source keys.

## 0.0.0-alpha.13 — 2026-08-16

### Skeleton, a pulsing loading placeholder

New component: `Skeleton` renders a pulsing placeholder block that matches the
shape of the content it stands in for. It ships as the 29th component, with its
own subpath export (`@rootnative/components/skeleton`), a registry entry for
`rootnative add skeleton`, and an example screen.

### `@rootnative/inertia` moves to `0.0.8`

Every pin moves together: the `core` / `utils` / `components` peer ranges are
now `>=0.0.8 <0.1.0`, the dev, example, and template pins are `0.0.8` exact,
and the registry's derived floor is `>=0.0.8`. Nothing in the library consumes
the `0.0.8` additions yet — `<Stagger>` is a consumer-app feature, and the
`buildReleaseAnimation` settle callback is not reachable through `useTouchDrag`
(the one drag surface this library uses) until inertia exposes it there.

### Documentation

The CLI reference documents command usage in full, the theming page explains
which package owns the `createMaterialTheme` dependency, the Portal docs
clarify where `PortalHost` must sit, and the API reference and component pages
got a clarity pass. All of it is covered by `docs:check`, which verifies every
JSX prop in every example against the real props types.

## 0.0.0-alpha.12 — 2026-08-14

### Every animated component died on mount on native — `components` now ships ESM

On `alpha.10` and `alpha.11`, mounting any animated component on iOS or
Android — a single `<IconButton />` was enough — crashed the app with:

```
TypeError: updater is not a function (it is Object)
```

The source was never wrong, and every test was green. The build format broke
it: under `format: 'cjs'` + `splitting: true`, esbuild emits a cross-chunk hook
call as `_reanimated.useAnimatedStyle.call(void 0, cb)`. The Reanimated Babel
plugin auto-workletizes a callback **by callee name**, which resolves to
`call`, never matches, and the callback ships un-workletized — the UI thread
receives a plain object instead of a worklet and the component dies on mount.
`alpha.9` worked because CJS *without* splitting emits
`(0, import_reanimated.useAnimatedStyle)(cb)`, which the plugin does match;
`alpha.10` added `splitting: true` to fix the PortalContext duplication and
silently flipped all 30 hook calls into the broken shape.

The two constraints are coupled, and ESM is what satisfies both at once: bare
`useAnimatedStyle(cb)` calls for the Babel plugin, and one definition per
singleton for the overlays. `@rootnative/components` now builds
`format: 'esm'` with `"type": "module"`; `outExtension` pins the emitted files
back to `.js`, so every `exports` path, `typesVersions` entry, and consumer
import is unchanged. The fix was confirmed on an Android emulator, not just in
the build output.

Two new guards keep both constraints honest, because nothing else in CI can
see either failure (the tests import from `src/`, and the public API surface
is identical either way):

- `pnpm run check:worklets` asserts the emitted call shape in the built
  bundles — the only place the regression is observable.
- `pnpm run check:singletons` (existing) still asserts one definition per
  React context.

### The release path now runs the guards it was supposed to enforce

`alpha.10` and `alpha.11` shipped **through a release workflow that ran none of
the five build guards** — the worklet check existed in CI, but the publishing
path never ran it, so a green CI on main said nothing about the artifact. Both
release workflows now run the same gate list as `ci.yml` (docs check, inertia
pin check, API surface, singleton check, worklet check) and regenerate the
component registry, which had shipped two releases stale — still claiming a
`@rootnative/core` floor of `>=0.0.0-alpha.9` — because only `llms.txt` was
regenerated at release time.

## 0.0.0-alpha.11 — 2026-08-14

### Every icon threw, and safe-area insets were silently dropped

`IconButton`, and anything else rendering a string icon name, failed at runtime
under Metro with:

```
Requiring unknown module "@expo/vector-icons/MaterialCommunityIcons"
```

followed by the library's own `@expo/vector-icons is required for icon support`
error. `Layout` and `AppBar` hit the same fault one step quieter: they warned
that `react-native-safe-area-context` was not installed and rendered a plain
`View`, so every screen lost its insets. **Both packages were installed and
resolvable in every case.** Reported against `0.0.0-alpha.10` from a consumer
app; the icon path has been broken for far longer.

The source was never wrong. Both peers were loaded the way an optional
dependency normally is — a literal `require()` inside a `try`/`catch` — and
the build broke it. `splitting: true` makes esbuild compile through an ESM
intermediate, where `require` does not exist, so each call was rewritten to
esbuild's own shim and emitted as `__require.call(void 0, '…')`. Metro builds
its module graph by scanning for **literal** `require('…')` and `import`
statements, so an indirect call through an aliased binding is invisible to it:
the module never entered the graph, the call threw, and the `catch` blamed the
consumer for a package that was sitting in `node_modules`.

Listing both in tsup's `external` does not help — the shim breaks the call
before externalization is reached. Nor can `splitting` be dropped to avoid it;
that is what keeps `PortalContext` and friends single instances, and
`check:singletons` exists to defend it.

So both are now **static imports**, in `packages/utils/src/icon.ts` and
`packages/components/src/safe-area.tsx`. That is a form esbuild leaves intact
and Metro can see, and it keeps both packages external rather than inlined.

**Behavior change worth reading before you upgrade.** These two peers are now
resolved when the module loads, not when an icon first renders. Both are already
declared peer dependencies and both ship in any Expo app, so this should reach
nobody — but a consumer who genuinely omitted one now fails at import time
instead of at first icon. The old `try`/`catch` never actually bought that
tolerance: the only reason it ever ran was this bug.

Nothing changed in the public API — `api:check` reports no drift, and all 957
tests pass.

## 0.0.0-alpha.10 — 2026-08-14

Closes the last open item from the developer-experience audit, and the docs
guard that audit asked for.

### `@rootnative/inertia` floor moves to `0.0.7`

Peer range is now `>=0.0.7 <0.1.0` across `core`, `utils` and `components`.
`0.0.7` adds `Motion.FlatList` and fixes `gesture={{ pressed }}` on web for
non-`Pressable` primitives. **This library uses neither**, so the raised floor is
a judgment call rather than a technical requirement — upgrading is only forced if
you consume `@rootnative/ui`'s peer range directly.

### Snackbar bottom offset is computed, not guessed

`SnackbarProvider`'s `bottomOffset` was a raw number the consumer had to work
out and keep in sync by hand, and the documented value for a standard FAB was
**wrong**. `88` assumed the offset had to include the snackbar's own 16dp
margin; the layer already adds that margin *and* the safe-area inset, so `88`
produced 104dp of padding and pushed the snackbar 32dp above the FAB it was
supposed to clear. Measured against the rendered layer, not inferred.

Three additions, all exported from the root and from their subpaths:

- **`FAB_SIZES`** / **`FAB_ICON_SIZES`** (`@rootnative/components/fab`) — the MD3
  container and icon heights per FAB size, plus `extended` (56dp, whatever the
  `size` prop says). They were previously literals inside `createStyles`, so a
  consumer computing clearance had nothing to read.
- **`snackbarOffsetFor(height)`** (`@rootnative/components/snackbar`) — the
  offset that clears an element of `height` at the bottom edge.
  `snackbarOffsetFor(FAB_SIZES.medium)` is `72`. It takes a raw height rather
  than a `FABSize` so `snackbar` does not gain `fab` as a component dependency —
  `rootnative add snackbar` should not copy in the whole FAB for four numbers —
  and so it also covers a bottom bar.
- **`useSnackbarOffset(offset)`** — raises the offset while the calling component
  is mounted, so the constant lives next to the FAB that determines it instead of
  in the app root two files away. A mounted caller wins over the provider's prop.
  With several mounted (a navigation transition, where the outgoing screen has
  not unmounted yet) the largest applies. A pushed `0` is an override, not an
  absence.

`bottomOffset` is unchanged and still correct for an app whose screens all carry
the same bottom furniture. **On upgrade, re-check any hard-coded value**: it was
almost certainly copied from the old docs and is 16dp too large.

### ButtonGroup's props were missing from `llms.txt` entirely

Not a missing prop — the whole block. `ButtonGroupProps` is a union over
interfaces named `ButtonGroupBaseProps`, and the `llms.txt` generator admits a
local interface only when the name ends in `CommonProps`, so all four were
skipped and the generic branch found nothing to document. The section shipped
with an example and no prop list in every release to date.

Renamed to `ButtonGroupCommonProps` and gave the generator a ButtonGroup branch
that describes the three `selectionMode` arms, the same shape the AppBar branch
uses. That recovers 13 common props plus `selectionMode`, `value`,
`defaultValue`, `onValueChange` and `onItemPress`. No API change — the renamed
interface was never exported.

### `pnpm run docs:check` now verifies documentation coverage

A fifth check group, `props-coverage`. The existing checks are one-directional:
they prove a documented prop is real, never that a real prop is documented, so a
prop absent from the docs left nothing to scan. `Box.justify` was implemented,
typed and undocumented for the library's whole life with every gate green, and
ButtonGroup above is the same failure one level up.

It asserts that every prop the library declares appears in
`packages/components/llms.txt`. Scoped to props declared in the same directory as
their props type, so React Native's inherited `ViewProps` are not demanded and a
`declare module 'react-native'` augmentation is not mistaken for a library prop.
Runs in CI inside the existing Docs check step.

Its limit is documented in the source: it reads `llms.txt` as one flat set, so it
catches a prop documented nowhere, not one documented for a different component.

## 0.0.0-alpha.6 — 2026-08-10

_Note: `0.0.0-alpha.7`, `-alpha.8` and `-alpha.9` published to npm without
entries here, and `-alpha.6` above was never published. Their user-facing work —
`Card` region slots, `Typography` Emphasized variants, and `rootnative create`
scaffolding into the current directory — is recorded only in the commit history.
The gap is left as-is rather than reconstructed after the fact._

The web pass. `0.0.0-alpha.5` covered Android; this one is react-native-web,
and it is mostly test coverage over behaviour that was already correct — the
web test project went from 53 to 125 tests. One real fix, plus the tail of the
Android audit.

### Fixed

- **Layout direction is now read from the browser on web.** Every RTL branch in
  the library asked `I18nManager`, which react-native-web ships as a hardcoded
  stub (`isRTL` is always `false`). So on an RTL page the *layout* mirrored
  correctly — react-native-web emits CSS logical properties and the browser
  resolves them — while the JavaScript still answered "LTR": the `AppBar` back
  arrow pointed the wrong way, `Menu`/`Tooltip` resolved `align="start"` to the
  wrong edge, and `Slider` ran its drag maths backwards. `selectRTL` and
  `transformOrigin` now read the document's resolved `direction` on web and keep
  using `I18nManager` on native. Native behaviour is unchanged.
- **Decorative icons no longer leak their glyph into the accessible name.** All
  22 `renderIcon` sites sit under `aria-hidden` on a `View`, so screen readers
  stop announcing private-use-area characters alongside a control's label.
- **Touch targets meet the 48dp floor.** `Button` (`xs` is 32dp tall), `Switch`
  (a 32dp track), `Avatar`, `ButtonGroup` and the other small controls size
  their `hitSlop` from their own height instead of a flat 4dp. Web is excluded
  because react-native-web does not implement `hitSlop`.
- **`rootnative add` resolves utility file names and import aliases correctly.**
  Two independent CLI bugs found by installing into a fresh project.

### Added

- `isRTLDirection()` in the shared utilities, for the places that need the
  boolean rather than a choice between two values (`Slider` threads it through
  track geometry and keyboard handling). Also added to the component registry,
  so a CLI-installed `Slider` gets it.
- `pnpm run check:inertia-pins` — fails when any `@rootnative/inertia` pin
  disagrees with the components peer range. The template pins were previously
  silent: nothing failed locally when one lagged.

### Notes

- A modifier chord (⌘R, Ctrl+C) still flips input modality to keyboard, so the
  next mouse click paints a focus ring. The cause is upstream in
  `@rootnative/inertia`, whose focus-visible tracker has no modifier guard; it
  is pinned as a known-failing test here and fixes itself once inertia ships the
  guard.

## 0.0.0-alpha.5 — 2026-08-07

### Changed

- **`Progress`: `containerColor` is now the track and `contentColor` the
  indicator; `trackColor` is gone.** It was the other way round —
  `containerColor` painted the active indicator — which contradicted the
  library-wide contract where `containerColor` is the container. This is the one
  change in this release the compiler cannot catch: `containerColor` still
  exists and only changed meaning, so old call sites render inverted.

  ```diff
  - <LinearProgress containerColor="#2E7D32" trackColor="#C8E6C9" />
  + <LinearProgress containerColor="#C8E6C9" contentColor="#2E7D32" />
  ```

- `LoadingIndicator`: `indicatorColor` → `contentColor`. `containerColor` is
  unchanged (the contained variant's circle fill), so the three progress-family
  components now share one `containerColor` / `contentColor` pair. `Tabs` and
  `NavigationBar` keep their own `indicatorColor` — there the indicator is a
  genuine third element alongside container and content.

- `Divider`: `inset` → `insetStart`, so it pairs with `insetEnd`. `ListDivider`
  takes the same props and changes with it.

- `@rootnative/core`: `TextStyle` → `TypographyToken`. The old name shadowed
  React Native's own `TextStyle` at every import site, and the two are
  structurally different — core's has five required fields.

- **`Colors` and `Typography` no longer have index signatures.**
  `theme.colors.primry` is a compile error instead of a silently-typed `string`.
  `BaseTheme` keeps its `[key: string]: unknown`, so custom tokens still ride on
  the theme root — see the note in
  [Theming](https://rootnative.github.io/ui/theming).

  Both are now `type` aliases rather than `interface`s, which is what makes a
  strict `Colors` assignable to `BaseTheme`'s `colors: Record<string, string>`
  (TypeScript gives type aliases an implicit index signature; interfaces get
  none). Consequence: they can no longer be extended by declaration merging — a
  `declare module '@rootnative/core' { interface Colors { brandRed: string } }`
  augmentation fails with `Duplicate identifier`. Put brand tokens on the theme
  root, or define your own theme interface.

- `IconResolverContext` is no longer exported from `@rootnative/core`. Use
  `ThemeProvider`'s `iconResolver` prop to write it and `useIconResolver()` to
  read it.

- **Checkbox, Radio and Switch work uncontrolled.** They were controlled-only,
  so `<Checkbox onValueChange={fn} />` fired the callback and never moved — a
  silent no-op. They now self-manage when `value` is omitted, starting from a
  new `defaultValue` prop, matching Tabs / NavigationBar / ButtonGroup /
  Slider. Passing `value` still gives you full control. A `Radio` latches when
  uncontrolled, since it is select-only.

- **`rootnative init` pins `registryVersion`** to the release tag matching the
  latest published `@rootnative/core`, instead of tracking `main`, so `add` and
  `update` fetch reproducible component source. Falls back to `main` when npm
  is unreachable or the tag has not been pushed yet. `rootnative upgrade` moves
  the pin forward, before it re-fetches any component files. Existing
  `rootnative.json` files are untouched until you run `upgrade`.

- `@rootnative/inertia` peer range widened to `>=0.0.6 <0.1.0` for `core`,
  `utils` and `components`. The floor moves past 0.0.2 for four releases of
  upstream work: 0.0.3 is all correctness fixes (Presence exit ordering,
  endless-repeat unmount, style resting), 0.0.4 is purely additive — animatable
  `boxShadow`, plus `layoutId` shared-element transitions measured in window
  coordinates with a style carry — 0.0.5 makes the 40 layout and text-metric
  style keys animatable and rejects undriven keys at compile time, and 0.0.6
  fixes two animations that never ran (`animate={{ boxShadow }}` under the
  default spring, and any colour key resting at its `'transparent'` default).

  No RootNative API change, and the floor is a correctness floor rather than a
  feature one: nothing here animates a colour key or a `boxShadow` through
  `animate`, and every colour this library moves goes through
  `useColorTransition` / `useGestureLayer`, which interpolate rather than
  spring and were never affected. 0.0.5's reduced-motion fix for
  sequence-declared step types is the one upstream change this library
  surfaced, from `LinearProgress` / `CircularProgress`.

  0.0.6 also exports `TRANSPARENT`, the seed value for a colour shared value a
  custom animated component drives itself. Unused here — `Switch` is the only
  component that calls `resolveTransition` directly and it drives a numeric
  press progress, not a colour.

### Added

- **Every component forwards React Native props to its root node.** The 11
  newest components declared closed prop interfaces, so `<Tabs onLayout={fn} />`
  was a type error while `<Card onLayout={fn} />` was not. They all extend
  `ViewProps` now. `Portal` and `SnackbarProvider` deliberately don't — they
  render no node of their own. See
  [API stability](https://rootnative.github.io/ui/api-stability).

- `IconSource` is now exported from `@rootnative/core`, next to
  `IconResolver` / `IconRenderProps`. It was previously only exported from
  `@rootnative/utils`, which is private and unpublished, so npm consumers had
  no way to import it. `@rootnative/utils` re-exports it unchanged for
  copy-pasted CLI installs.

- `api-surface.json` at the repo root snapshots every exported name, generated
  from the built `.d.ts` files and enforced by `pnpm run api:check`, so an
  accidental widening of the public surface shows up as a diff.

- New docs page: [API stability](https://rootnative.github.io/ui/api-stability)
  — what the `exports` maps cover, the React Native prop passthrough rule, the
  safe-area default asymmetry, and what is deliberately not covered
  (copy-pasted source, the vendored internal hooks, registry pinning).

### Fixed

- **Accessibility state now reaches the DOM on web.** Every stateful
  component passed `accessibilityState={{ ... }}`, which react-native-web
  0.21 no longer reads — so on web no `aria-selected` reached Tabs or
  NavigationBar, no `aria-checked` reached Checkbox / Radio / Switch / filter
  Chips, and no `aria-valuenow` reached Slider or the progress indicators. A
  screen reader on web could not tell which tab was active or whether a
  checkbox was checked. Components now emit `aria-*`, which RNW consumes
  directly and React Native normalizes back to `accessibilityState` for
  native. **Native behavior is unchanged**; this only ever affected web.

  Affected: Avatar, Button, ButtonGroup, Card, Checkbox, Chip, FAB,
  IconButton, ListItem, LoadingIndicator, Menu.Item, NavigationBar, Radio,
  Slider, Switch, Tabs, TextField, BottomSheet's drag handle, and both
  progress indicators.
- `LinearProgress` (indeterminate) no longer renders an empty track under
  reduced motion — the sliding segment used to snap to its final keyframe
  past the track's end and sit clipped. It now shows a static centered
  segment, matching the paused-arc look of `CircularProgress`.
- `CircularProgress` (indeterminate) no longer mounts its spin loop under
  reduced motion; the arc renders statically. Both indicators are now covered
  by the reduced-motion invariant suite.
- `BottomSheet.tsx` contained a literal NUL byte (a `'\0'` separator written as
  a raw `0x00`), which made `grep -r` skip the file entirely and would have
  copied the byte into projects via `rootnative add`.

## 0.0.0-alpha.4 — 2026-07-28

The 1.0 catalog release: eight new components and the shared infrastructure
they forced.

### Added

- **Dialog** — basic + fullscreen variants, compound slots (`Dialog.Icon` /
  `Dialog.Title` / `Dialog.Content` / `Dialog.Actions`), scrim,
  `dismissable`, Android back-button handling.
- **Snackbar** — imperative-only API: `SnackbarProvider` + `useSnackbar()`,
  FIFO queue with one visible at a time, `replace`, per-snackbar durations
  (an action makes it indefinite), close button, safe-area bottom inset +
  `bottomOffset` for FAB clearance.
- **Menu** — self-managing via `anchor` or controlled via `visible` +
  `onDismiss`, `Menu.Item` with leading/trailing icons and trailing text,
  anchor-relative positioning with edge flipping, `maxHeight`, scroll past
  the available height.
- **Tabs** — primary + secondary variants, fixed or `scrollable`, bar-only
  (`value` / `defaultValue` / `onValueChange`; deliberately not a navigator).
- **NavigationBar** — 80dp bar, per-item indicator pill, `labelVisibility`
  (`always | selected | never`), `selectedIcon` per item, `insetBottom`.
- **BottomSheet** — modal (scrim) + standard variants, `snapPoints` (dp or
  `%`) with velocity-based settle, drag handle, drag-to-dismiss, safe-area
  aware, Android back-button dismiss.
- **Tooltip** — plain (transient) + rich (persistent, subhead + actions)
  variants; long-press on touch, hover on web.
- **Divider** — standalone export promoted from `ListDivider` (which remains
  as an alias), plus `orientation`, `inset` / `insetEnd`, `thickness`,
  `containerColor`.
- **Portal v2** — `priority` + `PORTAL_LAYERS` z-order contract
  (sheet 100 / dialog 200 / snackbar 300 / menu 400 / tooltip 500) and named
  hosts (`hostName` + `<PortalHost name>`) with fallback to the default host.
  Existing `Portal` / `PortalHost` usage is unaffected.

### Fixed

- The CLI registry never shipped `safe-area.tsx`, so `rootnative add appbar`
  / `layout` installed a dangling `../safe-area` import and never declared
  `react-native-safe-area-context`. Shared root modules now ship flattened
  into each consuming component, and the peer is declared optional.
- Opening any overlay no longer re-renders the app tree under the
  `PortalHost` (portal registry moved to an external store).

## 0.0.0-alpha.3 — 2026-07-24

The MD3 Expressive release. The library is expressive-by-default with no
scheme knob.

### Added

- **LoadingIndicator** — expressive shape-morphing activity indicator.
- Press shape-morphs for Button, FAB, IconButton, and Chip (`usePressMorph`
  — containers morph squarer on press).
- IconButton square shape option; toggle buttons invert shape when selected.
- Expressive typography and motion token definitions on the theme.

### Changed

- **IconButton `size` values renamed**: `small` / `medium` / `large` →
  `'xs' | 's' | 'm' | 'l' | 'xl'`, with no aliases for the old names. The
  five sizes are the MD3 Expressive scale and drive container height, icon
  size, and corner radius.
- **Motion feel changed across all components**: spring tokens were replaced
  with the Expressive motion values pinned from androidx
  (`ExpressiveMotionTokens.kt`). Anything that read the old token values or
  tuned around the old feel will look different.
- `@rootnative/inertia` pinned to its first stable release (0.0.2).

## 0.0.0-alpha.2 — 2026-07-21

The animation-stack release.

### Added

- AppBar collapse-on-scroll behavior.
- Focus-visible treatment across interactive components (keyboard focus
  rings via `useFocusVisible`).
- `rootnative doctor` checks for `@rootnative/inertia`.
- LLM documentation surfaces: per-package `llms.txt`, `/llms-full.txt` on the
  docs site, `CLAUDE.md` pointers in scaffolded templates.

### Changed

- **`@rootnative/inertia` became a required peer dependency** of `core` and
  `components`. Every animation now routes through it — components no longer
  import `react-native-reanimated` directly (it remains a transitive
  requirement via inertia).
- All components migrated from direct Reanimated usage to inertia's
  declarative/value layer; state layers unified on `useStateLayer`.

## 0.0.0-alpha.1 — 2026-07-18

The MD3 compliance release — a full audit against androidx
`compose.material3` token files, fixing every accidental deviation.

### Changed

- Theme token corrections (state-layer opacities, elevation levels 4–5,
  palette, motion durations/easings) change rendered output anywhere the old
  values leaked into snapshots or overrides.

### Added

- Checkbox `indeterminate` and error states.

### Fixed

- MD3 alignment for the button family (including an IconButton
  disabled-override bug), selection controls, Card, Chip, List, progress
  indicators, Avatar interaction parity, and TextField counter/caret/error
  states.
- `package.json` `exports` maps for better module resolution in all packages.

## 0.0.0-alpha.0 — 2026-07-16

Initial publish under the `@rootnative` scope — the rename from
`@onlynative` (which had reached `0.0.0-alpha.8`). Carried over: the theme
system (`core`), ~20 component exports, the icon adapter package (`icons`),
and the scaffolding CLI (`cli` / `rootnative`).
