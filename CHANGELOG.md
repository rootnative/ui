# Changelog

All `@rootnative/*` packages (`core`, `components`, `icons`, `cli`, and the
`rootnative` binary) release together with a synced version, so this is a
single changelog for the repo. Entries before the 1.0 API freeze are
best-effort — alphas can and do break things; breaking changes are listed
first in each release so upgraders can scan them.

Prior history: these packages were published as `@onlynative/*` through
`0.0.0-alpha.8`. The `@rootnative` line below starts over at `0.0.0-alpha.0`.

## Unreleased

### Changed

- `@rootnative/inertia` peer range widened to `>=0.0.3 <0.1.0` for `core` and
  `components` (floor raised past 0.0.2 — 0.0.3 is all correctness fixes:
  Presence exit ordering, endless-repeat unmount, style resting). No new API.

### Added

- `IconSource` is now exported from `@rootnative/core`, next to
  `IconResolver` / `IconRenderProps`. It was previously only exported from
  `@rootnative/utils`, which is private and unpublished, so npm consumers had
  no way to import it. `@rootnative/utils` re-exports it unchanged for
  copy-pasted CLI installs.

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

### Breaking

- **IconButton `size` values renamed**: `small` / `medium` / `large` →
  `'xs' | 's' | 'm' | 'l' | 'xl'`, with no aliases for the old names. The
  five sizes are the MD3 Expressive scale and drive container height, icon
  size, and corner radius.
- **Motion feel changed across all components**: spring tokens were replaced
  with the Expressive motion values pinned from androidx
  (`ExpressiveMotionTokens.kt`). Anything that read the old token values or
  tuned around the old feel will look different.

### Added

- **LoadingIndicator** — expressive shape-morphing activity indicator.
- Press shape-morphs for Button, FAB, IconButton, and Chip (`usePressMorph`
  — containers morph squarer on press).
- IconButton square shape option; toggle buttons invert shape when selected.
- Expressive typography and motion token definitions on the theme.

### Changed

- `@rootnative/inertia` pinned to its first stable release (0.0.2).

## 0.0.0-alpha.2 — 2026-07-21

The animation-stack release.

### Breaking

- **`@rootnative/inertia` became a required peer dependency** of `core` and
  `components`. Every animation now routes through it — components no longer
  import `react-native-reanimated` directly (it remains a transitive
  requirement via inertia).

### Added

- AppBar collapse-on-scroll behavior.
- Focus-visible treatment across interactive components (keyboard focus
  rings via `useFocusVisible`).
- `rootnative doctor` checks for `@rootnative/inertia`.
- LLM documentation surfaces: per-package `llms.txt`, `/llms-full.txt` on the
  docs site, `CLAUDE.md` pointers in scaffolded templates.

### Changed

- All components migrated from direct Reanimated usage to inertia's
  declarative/value layer; state layers unified on `useStateLayer`.

## 0.0.0-alpha.1 — 2026-07-18

The MD3 compliance release — a full audit against androidx
`compose.material3` token files, fixing every accidental deviation.

### Breaking

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
