# Changelog

All `@rootnative/*` packages (`core`, `components`, `icons`, `cli`, `seo`,
and the `rootnative` binary) release together with a synced version, so
this is a single changelog for the repo.

Versions follow modified semver: a breaking change bumps the middle digit
(`0.1.0`), and fixes and additions bump the last digit (`0.0.2`).

## 0.0.2 — 2026-11-21

**One fix: the `@rootnative/core` peer range has an upper bound.** No
component, theme or CLI code changes.

- **Fix: the `@rootnative/core` peer of `components` and `icons` stops
  before the next breaking core version.** It's `>=0.0.2 <0.1.0` now.
  Before, it was `>=0.0.1` with no end, so a breaking core `0.1.0` satisfied
  the peer of a `0.0.x` package. The registry entries that `rootnative add`
  reads have the same range. Nothing changes in your app.

## 0.0.1 — 2026-11-21

**The first release with a stability promise, and one breaking type
change, in `@rootnative/core`.** `BaseTheme` keeps only `colors` and
`typography`, and the MD3 token groups are on `Theme`. Code that uses the
default theme, `createTheme` or `useTheme()` with no type argument needs no
change. Four components move closer to the MD3 spec, and you can see it:
`Chip`, `Switch`, `Slider` and `NavigationBar`. Each of these entries ends
with what to check.

Most other fixes are for right-to-left layouts, in native RTL and on the web
under `<html dir="rtl">`. A component also doesn't crash on a theme that
isn't an MD3 theme, and two CLI fixes make the components that
`rootnative add` installs compile. No peer range moves. The
`@rootnative/inertia` floor stays at `0.0.26`.

- **Breaking: `BaseTheme` has no MD3 token group.** `shape`, `spacing`,
  `stateLayer`, `elevation` and `motion` moved from `BaseTheme` to `Theme`
  (also exported as `MaterialTheme`). `BaseTheme` is now `colors`,
  `typography` and an index signature, so a custom design system adds token
  groups of its own, with its own names. Before, a custom theme had to
  fill the five MD3 groups. What to change: code that reads `theme.shape`,
  or another MD3 group, from a value typed as `BaseTheme` gets a type
  error. Type that value as `Theme`. Nothing changes at run time.

- **Fix: a component doesn't crash on a theme that isn't an MD3 theme.**
  With a custom theme that had no MD3 typography roles, 13 components threw
  at render, such as `Button`, `Chip`, `TextField` and `Typography`. Each
  component now takes the missing tokens from the default MD3 light theme,
  so it renders. In development, it warns one time and names the docs
  section. The components still read the MD3 roles. Give them an MD3 theme,
  and add your own tokens beside the MD3 ones. The Theming page says which
  parts of the theme take any role names.

- **Fix: a shadow uses the `shadowColor` of the theme.** On the web, and in
  each `boxShadow` string, the shadow was always black. So a theme that
  changed `shadowColor` in an elevation level got that color on native
  only. Both paths now paint `shadowColor` at `shadowOpacity`. The default
  MD3 theme gives the same shadow as before.

- **`Layout` takes the React Native view props.** `LayoutProps` now extends
  `ViewProps`. Before, `testID`, `nativeID` and `onLayout` on a `Layout`
  were type errors, and they didn't reach the node. `Layout` forwards each
  prop that it doesn't use to its root node, as the other components do.

- **A flat `Chip` draws its outline in `outlineVariant`.** The MD3 tokens
  of the four chip kinds give the outline as `outlineVariant`, and the
  border was `outline`. The disabled outline, the 1dp width and the
  selected filter chip don't change. What to check: the border of a flat
  chip has less contrast than before, in the light and the dark theme. An
  `elevated` chip has no border, so it doesn't change.

- **The `Switch` thumb is placed by its center, as MD3 does.** The thumb
  was placed by its start edge. So a pressed thumb grew toward the end
  only, and the thumb of an off switch sat off its MD3 position. The center
  is now 16dp from the start edge when off and 36dp when on, at each thumb
  size. One spring drives the size, so the thumb doesn't dip two times at
  the end of a toggle to off. What to check: nothing in your code. The
  track size doesn't change.

- **The `NavigationBar` indicator grows by its width, as MD3 does.** The
  pill scaled from 40% of its width, so its round ends were flat during
  the motion. It now grows its width from 0 around its center, and the
  ends stay round. A second spring fades the pill and the `selected` label.

- **The `Slider` handle matches MD3.** The handle is 44dp high. It was
  20dp. The halo around the handle on hover, focus and press is gone: MD3
  has none. A visible keyboard focus narrows the handle to 2dp, as a press
  does, and the focus ring is a pill around the handle. What to check: a
  value label that is always visible sits above the higher handle, outside
  the box of the slider. Leave room above it.

- **Fix: a plain text anchor of a `Tooltip` stays text.** The tooltip put
  `onLongPress` on its anchor. React Native reads a `Text` with a press
  handler as a link, so a screen reader read a plain text anchor as a
  link. For a `Text` or a `Typography` with no press handler and no `href`,
  the wrapper now takes the long press and the tap, and the anchor gets
  only the focus handlers. An anchor that is a control doesn't change.

- **Fix: `ButtonGroup` keeps its value props off its container.** `value`,
  `defaultValue` and `onValueChange` reached the container view. A renderer
  that passes unknown props to the DOM logged a warning for them. The
  selection doesn't change.

- **Fix: components mirror in native RTL.** In an RTL app on Android and
  iOS:
  - `Carousel`: in RTL, Android and iOS report the scroll offset from the
    left edge, and the content starts at the right. So on Android the
    `multi-browse` and `hero` variants, and a carousel with `onItemPress`,
    drew no item. On iOS, the first scroll sized the items as if the
    carousel were at its far end, and `scrollToIndex` went to the mirrored
    item. The carousel now reads the offset from the start on both.
  - `Slider`: the active track started at the left edge, on the wrong side
    of the handle. A range slider was correct.
  - `LinearProgress`: the wave of a `wavy` bar started at the left edge and
    overlapped the mirrored track, and the indeterminate segment moved from
    left to right.
  - `Tabs`: the active indicator sat outside the row, so no tab showed it.

- **Fix: the input text starts at the start edge in RTL.** On Android and
  on the web, Latin text in a `TextField`, `SearchBar` or `SearchView`
  aligned left in an RTL layout, while the label and the icons mirrored.
  The value and the placeholder now align with the start edge. A
  `textAlign` in `inputStyle` still wins. What to check: on Android and the
  web, RTL-script text in an LTR layout now aligns left, as it does on iOS.

- **Fix: the `SearchView` back arrow points to the start edge in RTL.**
  `backIcon` defaults to `arrow-left`, and to `arrow-right` in RTL. A
  custom `backIcon` doesn't change.

- **Fix: a detached `SideSheet` keeps its 16dp margin from the safe area.**
  The margin counted from the screen edge. So in landscape the card ran
  into a notch on its side, and in portrait its top ran under the status
  bar. Inside a `SafeAreaProvider`, the margin now adds the inset of each
  edge that `insetTop`, `insetBottom` and `insetSides` turn on. What to
  check: a detached sheet starts below the status bar now.

- **Fix: components mirror on the web under `<html dir="rtl">`.**
  react-native-web put each start and end style, such as `paddingStart`, on
  its LTR side, also in a `StyleSheet.create` style. So these parts didn't
  mirror:
  - `SideSheet` (modal): the 56dp strip of scrim, so the sheet sat 56px in
    from its edge, and the rounded corners and the header insets.
  - `NavigationDrawer` (modal): the 56dp strip of scrim, the rounded end
    corners, and the 16dp and 24dp item padding.
  - `TextField`: the icon margins, so each icon sat 20px too far in and the
    resting label ran into a leading icon. Also the gap before the
    character counter.
  - `Button`: the narrower padding of the icon side, and the 8dp gap
    between the icon and the label.
  - `ButtonGroup`: the gap between an icon and its label. In a connected
    group, the first item sat at the right edge with its round corners on
    its inner side, and the last item the other way.
  - `FAB`: on an extended FAB with an icon, the 16dp and 20dp padding and
    the 12dp gap between the icon and the label.
  - `Chip`: the close target of an input chip, or of a selected filter
    chip, sat on top of the avatar or the check icon. Also the narrower
    padding and the gaps.
  - `ListItem` and the list headline: the 16dp and 24dp padding, and the
    gaps beside the leading and trailing content.
  - `Menu.Item`: the trailing text, or a trailing icon with no text, sat
    beside the label, not at the end of the row.
  - `Dialog` (full screen): the header padding. `Snackbar`: the padding and
    the gap before the action.
  - `AppBar`: the end padding of an expanded title. `BottomAppBar`: the
    padding before the first icon and after the FAB.
  - `Badge`: an anchored badge sat on the top-right corner of its anchor,
    not the top-left. `Divider`: `insetStart` indented from the left.
  - `LinearProgress`: the bar didn't mirror at all. `Tabs`: a scrollable
    row didn't scroll to a selected tab that was out of view.

  These parts, the `ps`, `pe`, `ms` and `me` insets of a `Box`, and the
  halo of a `Switch` also follow a change of `dir` at run time now. Native
  doesn't change, and a style that you pass in `style` still wins as before.

- **`resolveLogicalKey` keeps the logical key on the web in LTR.** It
  returns the physical key only under `<html dir="rtl">`, where
  react-native-web would put a logical key on the wrong side. In LTR it now
  returns the key you pass (`'start'`, not `'left'`). The rendered side is
  the same. A later style that sets the same logical key now replaces it, as
  for any other style key.

- **Fix: `rootnative add` installs RTL-aware components that compile.**
  `AppBar`, `Box`, `Menu`, `Switch`, `TextField` and the components fixed
  for RTL in this release import `resolveLogical` or `resolveLogicalKey`
  from the utils. The CLI didn't copy those names into the utils barrel of
  your project, and for some components it didn't copy `rtl.ts` at all, so
  the installed component didn't compile.

- **Fix: `rootnative update` keeps the type exports of the utils barrel.**
  It rewrote `rootnative-utils.ts` with the value exports only, so a
  component that imports a type from the utils, such as `IconSource`,
  didn't compile after an update. `update` now writes the same barrel as
  `add`.

- **Docs: where `style` lands, and what the theme takes.** The API
  stability page has a new section, "Where `style` lands", with the rule
  for each kind of component. The Theming page says which parts of the
  theme take any role names, and its custom theme example compiles. The
  README and the docs say that the theme engine is design-system agnostic,
  and that the components follow Material Design 3.
