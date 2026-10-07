# Changelog

All `@rootnative/*` packages (`core`, `components`, `icons`, `cli`, and the
`rootnative` binary) release together with a synced version, so this is a
single changelog for the repo. These are prereleases and they break things
freely — assume every entry can require a change on upgrade, and read the
whole release rather than scanning for a label.

Prior history: these packages were published as `@onlynative/*` through
`0.0.0-alpha.8`. The `@rootnative` line below starts over at `0.0.0-alpha.0`.

## Unreleased

### `AppBar` takes a subtitle

The MD3 Expressive app bar shows one line of supporting text under the title.
`AppBar` had only `title`, so an app built a page header by hand from a `View`
and two `Typography` elements.

`AppBar` now takes `subtitle` and `subtitleStyle`. The subtitle color is
`onSurfaceVariant`, and on the `primary` and `primaryContainer` schemes it is
the scheme's content color. `contentColor` does not change it. The type role
follows the variant: `labelMedium` on `small` and `center-aligned`,
`labelLarge` on `medium`, and `titleMedium` on `large`. The values are from
the Compose Material 3 tokens.

A `small` or `center-aligned` bar keeps its 64dp height. The spec gives a
subtitle only to the flexible medium and large bars, which also use a larger
title. The `medium` and `large` bars here keep their baseline title, take the
flexible subtitle, and grow by the same amount as the flexible bars: `medium`
from 112 to 136dp, `large` from 152 to 184dp. With `scrollOffset`, the
subtitle collapses to `labelMedium` with the title, and the scroll distance
grows by the same amount. An empty string adds no line and no height.

The subtitle is not a heading. On the web the `<h1>` holds the title only.
Sixteen new tests cover it: 14 native and 2 web. Seven faults put into the
source on purpose each made at least one of them fail. Measured in Chromium
on a web export of the example app at 390px: every bar has the heights and
positions above, and a medium bar scrolled 36px is 100dp high with a 13px
subtitle, halfway through its 72px collapse. Not checked on iOS or Android.

### A `Button` link: the docs give the recipe, and `hrefAttrs` is typed

A landing page that linked out with `Button` and `Linking.openURL` exported
no `<a>` element at all, so a crawler found no link from the page. The SEO
checklist named `router.push` as the trap, but not `Linking.openURL`, and the
`Button` page did not say how to make a button a link.

The `Button` page has a new section, "A button as a link": put the button
inside Expo Router's `<Link asChild>`, and the web renders an `<a href>`. The
SEO checklist and the "Why" page name `Linking.openURL` next to
`router.push`, and the `llms` files carry the same rule.

On the web, `Link` opens an external URL in the same tab, and
`<Link target="_blank">` does not help under `asChild`: `Link` gives `target`
to the child as a plain prop, and react-native-web drops it. The fix is
`hrefAttrs={{ target: '_blank', rel: 'noopener' }}` on the button, which
react-native-web writes onto the `<a>`. The React Native types do not declare
`hrefAttrs`, so `@rootnative/components` now declares it on `ViewProps`, as it
does for `aria-invalid` on `TextInputProps`. A web test pins the target and
the rel on the anchor.

**Check your own augmentation.** If your app declares `hrefAttrs` on
`ViewProps`, remove that declaration, or make its type exactly
`{ target?: string; rel?: string; download?: boolean | string }`. A different
type fails with TS2717, "Subsequent property declarations must have the same
type".

### A `Chip` with no action is a label, not a button

An assist, suggestion or input chip with no `onPress` rendered a focusable
`<button>` that did nothing. Three static chips in a page hero gave a keyboard
user three dead tab stops, and a screen reader announced three buttons.

`Chip` now follows the `Card` rule. With no `onPress`, no `onLongPress` and
no `href`, an assist, suggestion or input chip renders a plain view: no button
role, no tab stop, no hover or press layer, and the default cursor. It keeps
its colours, its outline, its elevation at rest, and an input chip keeps its
close button. A filter chip is always a button, because a press toggles it.
An `href` counts as an action, because on the web Expo Router's
`<Link asChild>` gives the chip an `href` and an `onClick`, not an `onPress`.
Nine new tests cover the rule, and five of them fail on the old code.

**Check your tests.** A test that finds an action-less chip with
`getByRole('button')` now finds nothing. Give the chip an `onPress`, or query
it by its text.

### An emphasized headline is a header on native

On iOS and Android, `Typography` gives a display or headline variant with no
`level` the header role. It read the variants from a list of the six plain
names, so the 6 `display*Emphasized` and `headline*Emphasized` variants got no
role, and a screen reader did not announce an emphasized page title as a
header. The docs said that every display and headline variant is a header.

`Typography` now reads the role from the variant name: a name that starts
with `display` or `headline` is a heading, with or without `Emphasized`.
`title*` and the other roles stay plain text. The web does not change: with
no `level`, no variant gets the role there. New native tests cover four
emphasized headings and two emphasized non-headings, and a web test pins
`<h1>` for an emphasized headline with `level={1}`.

### Layout keys in `style` place `Button`, `IconButton`, `FAB` and `Chip`

These four components wrap their pressable in a `View` that holds the focus
ring and the shadow. The wrapper sets `alignSelf: 'flex-start'`, so it hugs
the button and does not stretch across a column. The consumer `style` went to
the pressable inside the wrapper, and three things broke:

- `alignSelf` did nothing. A `Button` in `<Column align="center">` stayed at
  the start edge next to centred text.
- A margin moved the button away from its own focus ring and shadow.
- `flex: 1` in a row did not grow the button, and `position: 'absolute'`
  placed the button against a wrapper of no size.

Now the keys that place a component in its parent go to the wrapper:
`alignSelf`, `flex`, `flexGrow`, `flexShrink`, `flexBasis`, the margins,
`position`, the insets and `zIndex`. When `flex` or `flexGrow` moves, the
pressable fills the wrapper. Every other key styles the container, as before.
A Reanimated animated style stays on the pressable whole, because Reanimated
finds it by identity. A web test per component reads the wrapper and the
button from the DOM, and 16 of its 20 cases fail on the old code.

**Check your layout.** An `alignSelf`, a `flex` or a `position` that you set on
one of these components now takes effect. A margin moves the button as before,
and now the focus ring and the shadow move with it. If you added a `Row` or a
wrapper `View` only to centre a button, you can remove it.

### `rootnative-seo` writes the sitemap and `robots.txt` from the export

Every app wrote the same deploy script: list the exported HTML files, drop
the `+not-found` page, turn each file name into a route, and pass the list to
`writeSitemap` and `writeRobots`. That script had two faults. It listed a
page by its file name, not by the address the page declares, so a page with
a query in its canonical link got the wrong URL. And it did not read the
page, so an overlay with `noindex` went into the sitemap.

`writeSeoFiles({ outDir })` in `@rootnative/seo/node` now does the step. It
reads every `.html` file under `outDir`, nested folders too, and lists a page
with its canonical link when that link is under the site and the page has no
`noindex`. It leaves out a special route (a `+` or `_` segment, or a root
`404.html`), a dynamic route template such as `[id].html`, a page with no
canonical link, a canonical link outside the site, and a second page with the
same link, and it returns each page it leaves out with the reason. The site
URL comes from the canonical link of `index.html`, or from `siteUrl`. It
writes `robots.txt` too, unless you pass `robots: false`. It throws when no
page can go in the sitemap, because an empty sitemap on a live host fails
with no other signal.

The new `rootnative-seo` command runs it from a `package.json` script:
`rootnative-seo dist`, with `--site-url`, `--sitemap` (once per sitemap URL)
and `--no-robots`. It prints each page it leaves out, with the reason.
`readExport(outDir)` returns the canonical link and the `noindex` rule of
each page, for a URL list of your own.

The example app uses it. Its sitemap lists the same 37 URLs as before.

**Check your deploy script.** If it builds the sitemap from the file names,
replace it with `rootnative-seo dist` and read the list of pages it leaves
out. A page that must be in the sitemap needs a canonical link: pass `url` to
its `PageHead`.

### `PageHead` needs no `SeoProvider` on native

`PageHead` read the site before it checked the platform. On iOS and Android
it renders nothing, but it still threw with no `SeoProvider` above it. So
every native test that rendered a screen with a `PageHead` had to wrap the
screen in a provider, for a component that draws nothing there.

On native, `PageHead` now returns `null` before it reads the site. A native
tree and a native test need no provider. The web does not change: with no
provider and no `site` prop, `PageHead` throws, and the static export fails
on the first page that has the fault. A native test pins the new rule, and
the web test for the throw stays.

**Check your test setup.** If you added `SeoProvider` to a native test
wrapper only for `PageHead`, you can remove it. Keep the provider at the
root of the app.

## 0.0.0-alpha.23 — 2026-10-06

**No breaking change.** This release is the structural audit of the whole
catalog plus three device passes: iOS simulator, web, and Android emulator.
The new `@rootnative/seo` package ships here with `Container`, a `level` on
`Typography`, and a clean hydration of the static export. Every overlay has
one back handler and one scrim, Dialog scrolls and respects the safe area,
Snackbar speaks on iOS and pauses under a pointer, and Tooltip opens from the
keyboard. Toggle `IconButton` and filter `Chip` work uncontrolled, toggles
announce their state, filled and tonal buttons rise on hover, and
`containerColor` takes any colour React Native accepts. Inline logical
insets mirror on web now through `resolveLogical`, and the app bar,
Switch and Slider hold their geometry in RTL on every platform.

### Defects seen in the web pass

- **Inline logical insets sat at the wrong edge in RTL on web.** A style from
  `StyleSheet.create` mirrors through CSS, but react-native-web resolves the
  logical keys of an inline style object in JavaScript, from a locale context
  that defaults to LTR and that `dir="rtl"` never updates. The small app bar
  title drew over the trailing actions, the text field label sat over the
  trailing icon, the Switch halo left the thumb, and `Box` one-sided insets
  (`ps`, `pe`, `ms`, `me`) went to the left. The new `resolveLogical` helper
  in `@rootnative/utils` writes the physical key for the document direction
  on web and the logical key on native.
- **Slider arrow, Home, End and Page keys also scrolled the page.** The
  handled keys are claimed with `preventDefault` now.
- **Slider reported a rounded `aria-valuenow`.** A 0 to 1 slider at 0.4 said
  `0`, which a screen reader reads as "0 percent". The value is unrounded on
  every platform.
- **Tooltip never opened from the keyboard.** On web, focus on the anchor
  shows the tooltip, blur hides a plain one, and Escape hides either. The
  key stops at the anchor, so an enclosing dialog does not close too.
- **Filled TextField indicator did not change on hover.** The indicator
  colour cascade has the hover step the outlined border already had.
- **Snackbar timer ran on under the pointer.** The clock pauses while a
  pointer is over the surface and continues from where it stopped.
- **NavigationDrawer section headlines rendered as `<h1>` on web.** Each
  section headline is `<h2>` now, with a `headingLevel` prop to fit the page
  outline.
- **NavigationRail put its `accessibilityLabel` on a plain view.** It names
  the tablist now, the same as NavigationBar, so the rail has an accessible
  name on web.

### Three defects seen on the iOS simulator

- **Medium and large app bars clipped the title.** The title sat in a row
  under the 64dp top row, and a 32dp headline plus its 24dp bottom padding
  does not fit in the 48dp a 112dp medium bar leaves there, so the
  descenders were cut off. The title has its own layer over the whole
  container now and sits at the Compose geometry.
- **A centre-aligned app bar truncated its title next to two actions.** The
  title was centred inside a symmetric inset equal to the wider of the two
  slots, which left 144dp on a 400dp phone. It now keeps the whole width
  between the slots, sits at the screen's centre while it fits there, and
  shifts off centre instead of truncating when it does not, the same as
  Compose `TopAppBarLayout`.
- **The Switch thumb left the track in RTL.** The thumb rests at the start
  edge and moved by a physical `translateX`, so in RTL it slid off the right
  end and the halo stayed behind. The travel follows the layout direction now.
- **The Slider filled from the wrong side in RTL.** The slots position with
  `left`, which React Native already mirrors in RTL, and the slider mirrored
  the value once more, so the fill came back to the left. Native now leaves
  the mirroring to the platform and the web keeps its own. The `increment`
  and `decrement` accessibility actions also stop reversing in RTL: a larger
  value is a larger value in every writing direction.

### Every elevated surface has an elevation test

The native and web elevation tables covered the four components that move
their shadow on hover. The seven that take a static elevation had no witness:
Menu (level 2), Dialog (3), Snackbar (3), the rich Tooltip (2), BottomSheet
(1), the modal NavigationDrawer (1) and NavigationBar (2). All seven are in
both tables now and pass the same two invariants: one shadow node that does
not clip, and no `boxShadow` beside the native keys.

### The agent-facing docs tell the truth again

`docs/static/llms.txt` is the file an AI agent is told to trust over the
hosted docs, and it was wrong in four places. It named 29 components (there
are 35), it told the agent to install `@expo/vector-icons` and
`@material/material-color-utilities` (the library uses the first only behind
the `/mdi` subpath through a different package, and bundles the second), it
gave `@rootnative/inertia >=0.0.11` as the floor (it is `>=0.0.17`), and it
listed `Layout` as having no animated value (`Grid` animates). The generated
core `llms.txt` also said `cornerFull` is 9999; the token is 999. The public
doc example on `elevationShadowConfig` drove `useShadow` from `useSpring`,
which the library bans because it is not gated on reduced motion; it uses
`useAnimation` now.

### Filled and tonal buttons, filled and outlined cards rise on hover

MD3 raises a filled or tonal button from level 0 to level 1 on hover, and a
filled or outlined card the same way. The library applied the hover rise to
the elevated variants only. Every interactive card and every filled or tonal
button now carries the same shadow carrier the elevated ones had, resting at
level 0 so nothing changes at rest. Outlined and text buttons stay flat.

### One back handler, one halo, one focus ring

Three pieces of code that every overlay or selection control copied by hand
now live once under `internal/`:

- `useBackHandlerDismiss` replaces the six copies of the Android back-button
  effect in Dialog, Menu, Tooltip, BottomSheet, NavigationDrawer and
  SearchView. A new table test drives every one of them on Android and checks
  that a closed, locked, or plain surface does not swallow the back press.
- `useHaloLayer` replaces the three identical state-layer halo blocks in
  Switch, Checkbox and Radio.
- `useStateLayer` and `useHaloLayer` return the focus-ring opacity style, so
  the twelve components that derived it by hand no longer do.

No visible behaviour changes from the three extractions.

### Toggle `IconButton` and filter `Chip` work uncontrolled

Both had `selected` and nothing else, so a consumer who forgot to flip
`selected` in `onPress` got a control that never toggled. Both now follow the
Checkbox idiom: `selected` with `onSelectedChange` is the controlled form,
and `defaultSelected` is the uncontrolled form, where the control flips its
own state and reports the new state through `onSelectedChange`. `onPress`
still fires either way.

### Disabled is not overridable, for every component

`useStateLayer` fell back to the consumer's `containerColor` while disabled
when a component passed no `disabledContainerColor`. ListItem, Menu.Item,
Avatar and SearchBar kept the override colour in their disabled state. The
disabled layer now rests on the variant's own colour.

### Dead colour derivation removed from six style files

Button, Chip, FAB, IconButton, Card and ListItem each computed hover, focus
and press colours in `styles.ts` that nothing read, because `useStateLayer`
derives the layers itself. About 200 lines are gone, and the one place the
layers are derived is the only place now.

### Test tables cover more of the catalog

NavigationRail and NavigationDrawer join the reduced-motion table, the
pressable Avatar joins the touch-target table, and the SearchBar trigger joins
the web cursor table. The Avatar also reads its hit slop from the shared
helper instead of its own copy.

### Consumer handlers and `hitSlop` survive the props spread

Every `Pressable`-based component spreads its state-layer handlers after the
consumer's props, so a consumer `onPressIn`, `onPressOut`, `onHoverIn`,
`onHoverOut`, `onFocus` or `onBlur` type-checked and then never ran. Avatar,
Button, Card, Checkbox, Chip, FAB, IconButton, ListItem, NavigationDrawer.Item,
Radio and Switch now merge the two through one internal helper: the
consumer's handler runs first, then the component's.

`hitSlop` had the same problem on Button, Chip, Switch, Checkbox and Radio. A
consumer value wins now, as it already did on IconButton and FAB. Checkbox and
Radio also drop their default slop of 4dp: their container is already 48dp,
and slop on a control that clears the floor only overlaps its neighbours.

### Toggles announce their state

A toggle `IconButton` and a filter `Chip` set `aria-selected` on a `button`,
and a single-select `ButtonGroup` set it on a `radio`. ARIA defines neither,
so a web screen reader announced no state. The web now gets `aria-pressed` on
the two buttons and `aria-checked` on the radio. Native keeps
`accessibilityState.selected` for the buttons, which is what TalkBack and
VoiceOver read for a toggle, and moves the radio to
`accessibilityState.checked`.

### Four components read the disabled opacity tokens now

Switch, Checkbox, Radio and Slider wrote `0.38` and `0.12` as literals. They
read `theme.stateLayer.disabledOpacity` and `disabledContainerOpacity` now,
like every other component, so a theme that changes the disabled treatment
reaches them.

### `containerColor` accepts every colour React Native accepts

`blendColor` and `alphaColor` in `@rootnative/utils` read 6 and 8 digit hex
only. Any other form, `#f00`, `rgb()`, `hsl()` or a named colour, fell back
to the overlay at its alpha, so a filled component with
`containerColor="red"` lost its container under the hover and press layers
and showed a 10% tint of its content colour instead. Both functions now parse
through React Native's `processColor`, which reads every colour form the
platform does, on native and on the web. A base that is not opaque still
returns the overlay at its alpha, because the colour behind it is unknown.

### SearchBar: the trigger no longer nests buttons

With `onPress` the whole bar was one `Pressable` with the `button` role, and
it wrapped the clear button and the trailing actions. On the web that is a
`<button>` inside a `<button>`, which the test run logged as invalid DOM and
which a screen reader reads unreliably. The trigger is now a sibling behind
the content, the same shape the `Chip` close target uses. The bar is still
one tab stop, the input is still read-only and hidden, and the clear button
and the actions are still buttons of their own. A consumer `role` now names
the bar, so `<Link asChild>` can make it a link.

### Three props a consumer passed were thrown away

- `TextField` wrote `accessibilityLabel`, `accessibilityHint` and
  `accessibilityState` after the rest spread, so a consumer value never
  reached the input. A field with no visible label had no accessible name
  even when the consumer gave it one. The consumer value wins now, and
  `aria-label` is read as a name too. The visible `label` stays the default.
- `LinearProgress` replaced a consumer `onLayout` with its own width
  measurement. Both run now.
- A rich `Tooltip` closed on hover out, which is before a mouse can reach its
  actions. A rich tooltip is persistent and now stays up until the outside
  press, an action, or the Android back button. A plain tooltip still hides on
  hover out.

### Snackbar: VoiceOver hears it now

The surface carried `role="alert"` and `accessibilityLiveRegion="polite"`,
and the docs said screen readers announce the message. TalkBack and web
readers did. VoiceOver did not: iOS has no live region, and nothing asked it
to speak. The snackbar now calls `AccessibilityInfo.announceForAccessibility`
on iOS when it mounts and when a replacement arrives. Android and web are
unchanged, so nothing is announced twice.

### Dialog: one scrim, a scrolling body, and a safe area

Three defects in `Dialog`, each one visible on a device.

- **The scrim was twice as dark as the token.** The press target inside the
  scrim layer carried the same 32% `scrim` colour as the layer itself, and
  the two composited to about 54%. The press target is transparent now, which
  is the same fix `BottomSheet` carries. A test pins the layer at 32% and the
  press target at no colour.
- **A basic dialog grew past the screen.** The surface had no height cap and
  the content did not scroll, so long supporting content pushed the actions
  off screen. With `dismissable={false}` that trapped the user. The surface
  now stops at the screen height and `Dialog.Content` scrolls under a fixed
  headline and above fixed actions.
- **The full-screen dialog sat under the status bar.** The surface filled the
  portal layer from the top edge of the screen. It now pads itself by the
  safe-area insets on every edge, the same way `BottomSheet` and `Snackbar`
  do.

### `Container`: one content column for every screen

A screen on a wide window had no way to cap its content width except a
hand-written `maxWidth` on each screen. The example app had 23 copies of
that rule with three different numbers, and nothing in the library said
which one was right.

`Container` is a centred `Column` with a maximum width. The `width` prop
names a breakpoint band, and the Container stops growing at the lower bound
of that band: `medium` (the default) is 600dp, `expanded` 840, `large` 1200,
and `extraLarge` 1600. Below that width it fills its parent, so a phone sees
no change. The limit includes the padding. Put it as the one child of a
`ScrollView` with the screen padding on it, and every screen shares one
column. It ships from the `layout` subpath and the package root.

The example app uses it on every screen: `medium` on the component screens
and `large` on the home page.

### The example app hydrates clean on the web

Lighthouse reported React error #418 on the docs home. Two things in the
example read the browser during the hydrating render: the `?embed=1` flag
that the docs iframe passes, and the copy button that checks for the
clipboard API. Four screens also drew `MaterialDesignIcons` directly, past
the hydration guard the `mdi` resolver added in the last release, so every
component route had a glyph that the server wrote and the client did not.
All of them now wait for hydration or go through the resolver.

The home page also kept its hero pinned instead of its toolbar: the
`PageHead` element counted as the first child of the `ScrollView` and moved
the sticky index. The head now sits outside the `ScrollView`.

### `Typography` takes a `level`, and the `AppBar` title is a real `<h1>`

The static export of the example app showed every `display*` and `headline*`
`Typography` as an `<h1>` on the web, and the `AppBar` title as one more. The
library gave them the header role with no level, and react-native-web writes
a level-less header as `<h1>`. A page with a hero, a title bar and a display
glyph had three `<h1>`, and a crawler read no outline.

`Typography` now takes `level` (1 to 6). It sets the header role and
`aria-level`, so the web renders `<h1>` to `<h6>`. **A display or headline
variant with no `level` announces a header on native only.** On the web it
renders a plain element, because a level-less header there is always `<h1>`.
An explicit `accessibilityRole` still wins. Pass `level` on every heading
your page has, and nothing on decorative display text.

`AppBar` takes `titleLevel`, default `1`, and renders the title with it. Pass
`2` when a heading above the bar is the page heading. On native nothing
changes: the title still announces a header.

`Heading` from `@rootnative/seo/react` keeps working with `as={Typography}`;
it passes the same role and level.

### New package: `@rootnative/seo`

A React Native app that exports to the web starts as one empty page, and
every app wrote the same fix by hand. `@rootnative/seo` holds the parts that
do not depend on the app's data. The app keeps the mapping from its data to
the meta.

Five entries. The core and `/schema` have no dependency and run in Node and
in a browser. `/react` and `/expo-router` need React Native. `/node` runs in
Node only.

- `defineSite` and `toHeadTags` turn a `PageMeta` into tag records any head
  renderer can write. The tab title uses the site template and the Open Graph
  title does not. A page with no `url` gets no canonical link and no share
  card. `og:image:width` and `og:image:height` are written only with an
  image. Each tag is written once.
- The JSON-LD builders under `/schema` cover `WebSite`, `BreadcrumbList`,
  `Organization`, `Article`, `Product`, `Movie`, `Person`, `Event` and
  `FAQPage`. An empty field is left out at every depth, a rating with no
  votes is left out, and a duration of `0` is left out. The script text
  escapes `<`, so a `</script>` in a title cannot end the tag.
- `SeoProvider`, `Heading` and `imageLabel` under `/react`. `Heading` renders
  `<h1>` to `<h6>` on the web through the text component you pass in `as`.
- `PageHead` and `shellTags` under `/expo-router`. `PageHead` writes the head
  through `expo-router/head` and renders nothing on native. `shellTags`
  writes the head of `+html.tsx` and prefixes every relative `href` with the
  base path of a subpath host.
- `writeSitemap`, `writeRobots` and `writeManifest` under `/node`, for the
  deploy step. Each has a pure sibling that returns the text.

The example app is the first consumer: a static export, a `PageHead` on every
screen, `shellTags` in the shell, and `sitemap.xml` and
`manifest.webmanifest` written after the export. A new CI step exports the
app and reads two pages, which is the test that catches a head renderer
change in Expo Router. It found that the vendored `react-helmet-async` drops
a script that uses `dangerouslySetInnerHTML`; `renderHeadTag` writes the text
as a string child instead.

The export also showed that the `AppBar` title and every `display*` or
`headline*` `Typography` render as `<h1>` on the web, because the library
gave them the header role with no level. The entry above fixes that:
`Typography` takes `level`, and `AppBar` takes `titleLevel`.

A new docs section, "SEO for the web export", carries the blockers, the
checklist, the API reference and the limits. The API page is generated from
the same source as the package `llms.txt`.

### `mdiResolver` no longer breaks hydration on a static export

A static web export with `iconResolver={mdiResolver}` logged React error #418
on every load. React then discarded the static HTML and rendered the whole
page again on the client. `@react-native-vector-icons/common` 13 draws the
glyph on the export server, where it loads no fonts. On the client, its first
render is an empty string until `expo-font` loads the font, so the text did
not match.

While the page hydrates, `mdiResolver` now renders the icon with no name.
The icon set draws an empty string on both sides, and it starts the font load
during hydration. The next render passes the name, and the glyph shows when
the font loads. In a static export the icons are empty in the HTML. Native
and a single-page web build do not change. A web test in
`hydration.web.test.tsx` models the font state of the icon set and fails on
the old resolver.

If you copied the four-line resolver from the CLI page into a static export,
render the icon without a name while the page hydrates, as `mdiResolver`
does. An icon that the app renders directly from the icon package has the
same mismatch. Render it through `Icon` from `@rootnative/components/icon`,
which uses the theme's resolver.

## 0.0.0-alpha.22 — 2026-10-03

**One breaking change: a string icon name now needs an `iconResolver` on
`ThemeProvider`.** Pass `mdiResolver` from `@rootnative/components/mdi` to
keep the Material Design Icons, now from
`@react-native-vector-icons/material-design-icons`. Three new components: `NavigationRail`,
`NavigationDrawer` and `Icon`. The components that apply safe-area insets no
longer throw on web without a `SafeAreaProvider`. `SearchBar` takes a
`density`. Every component now uses one size vocabulary, and the old names
warn. The `@rootnative/inertia` floor moves to `0.0.17`, so a dialog or a
sheet that holds a progress indicator or a skeleton plays its exit. A new
docs page covers web without Expo.

### The MDI default moved behind `@rootnative/components/mdi`, on `@react-native-vector-icons`

**Breaking.** The shared icon code imported
`@expo/vector-icons/MaterialCommunityIcons` with a static import, so every
bundle had to resolve it, even in an app with its own `iconResolver` that
never rendered an MDI glyph. A Vite app without Expo failed to resolve the
package, because it needs `expo-font`, and the only way out was an alias to
an empty module.

The resolver now lives behind its own subpath, and nothing else imports an
icon font. The font comes from `@react-native-vector-icons/material-design-icons`,
the package Expo recommends in place of `@expo/vector-icons`
(https://expo.dev/blog/moving-away-from-expo-vector-icons). The glyph names
are the same MDI set, so no icon name changes:

```tsx
import { mdiResolver } from '@rootnative/components/mdi'

<ThemeProvider iconResolver={mdiResolver}>{children}</ThemeProvider>
```

To upgrade an app that uses string icon names:

1. Install `@react-native-vector-icons/material-design-icons`, and
   `expo-font` on Expo: `npx expo install
   @react-native-vector-icons/material-design-icons expo-font`.
2. Remove `@expo/vector-icons` from `package.json`, and run
   `npx @react-native-vector-icons/codemod` if the app imports it directly.
3. Pass `iconResolver={mdiResolver}` to `ThemeProvider`, as above.
4. On a bundler without Metro, delete the `@expo/vector-icons` alias stub
   from the bundler config.
5. In a Jest suite that renders the library with its own wrapper, pass the
   same resolver, or use `renderWithTheme` from `@rootnative/utils/test`,
   which installs it.

An app that already passes its own `iconResolver` changes nothing, and can
now uninstall `@expo/vector-icons`.

What changes on upgrade, in detail:

- **Every app that passes string icon names and no `iconResolver` adds the
  prop above.** Without it a string name renders nothing and the library
  logs one warning per process, in development and in production, that
  names the subpath. The example app and both `rootnative create` templates
  pass it.
- `@react-native-vector-icons/material-design-icons` replaces
  `@expo/vector-icons` as the icon peer of `@rootnative/components`, and it
  is **optional**. On Expo it needs `expo-font`, which loads the font at run
  time in Expo Go, in a development build and on web. An app with its own
  resolver installs neither, and the alias stub in the Web without Expo page
  is gone.
- **Remove `@expo/vector-icons` from the app.** Both packages register the
  same font, and the glyphs then render as `?` or as empty squares.
  `npx @react-native-vector-icons/codemod` rewrites the app's own imports;
  `npx expo doctor` reports a leftover. The example app and both templates
  made that move.
- `createVectorIconsResolver` from `@rootnative/icons` accepts any
  `@react-native-vector-icons/*` set, including the MDI `/static` export for
  a development build that embeds the font. Its `VectorIconSet` type now
  takes a set whose `name` is a glyph union, which every generated set is.
  An `@expo/vector-icons` set still fits, and `@rootnative/icons` no longer
  lists that package as a peer.
- `getMaterialCommunityIcons` is removed from the CLI registry, with the
  `icon` util file. `render-icon` no longer declares an icon dependency. A
  CLI project that wants the MDI default writes the resolver itself; it is
  the function above, four lines around `MaterialDesignIcons`.
- `renderWithTheme` from `@rootnative/utils/test` installs the MDI resolver
  by default, so the suite renders string icons the way an Expo app does.
  Pass `iconResolver: null` to render without one.

Not a lazy load and not an auto-registration. A lazy `require()` does not
survive tsup's ESM splitting, and Metro cannot see it. A side-effect import
that registers a default would be dropped by a bundler that honours
`sideEffects: false`. An explicit prop is what every bundler keeps.

### `NavigationRail`, `NavigationDrawer` and `Icon`

The library had `NavigationBar` for a compact window and nothing for a wider
one, so a desktop sidebar was built by hand from `Pressable` and
`Typography`. Both MD3 side forms now ship.

`NavigationRail` is the 80dp rail: the same `items` array as `NavigationBar`,
the same 56×32dp `secondaryContainer` pill, and a `header` slot for the menu
button and the FAB. `align` places the destinations at the top, the centre,
or the bottom. `labelVisibility="never"` grows the indicator to a 56dp
circle. Controlled and uncontrolled, like the bar.

`NavigationDrawer` is the 360dp drawer, composed from
`NavigationDrawer.Section`, `NavigationDrawer.Item` and
`NavigationDrawer.Divider`. The `'modal'` variant renders through `Portal`
behind a 32% scrim, slides in from the start edge, traps focus on web,
closes on Android back, and closes after a destination press
(`dismissOnSelect`). The `'standard'` variant renders in place for an
expanded window. A modal drawer takes `visible` and `onDismiss`; the type
rejects them on a standard one. Items are 56dp rows with an optional icon, a
`labelLarge` label, and a trailing `badge` text, on a full-corner
`secondaryContainer` indicator while active.

`Icon` renders an `IconSource` through the theme's `iconResolver`, so a
custom control draws the same icon set and color as the library. Default
24dp and `onSurface`. Without `accessibilityLabel` it is decorative and
hidden; with one it is an image with that name.

```tsx
<NavigationRail items={items} value={route} onValueChange={go} header={<FAB icon="plus" />} />

<NavigationDrawer visible={open} onDismiss={close} value={route} onValueChange={go}>
  <NavigationDrawer.Section headline="Mail">
    <NavigationDrawer.Item value="inbox" label="Inbox" icon="inbox" badge={24} />
  </NavigationDrawer.Section>
</NavigationDrawer>

<Icon source="star" size={32} color={theme.colors.primary} />
```

`rootnative add navigation-rail`, `rootnative add navigation-drawer` and
`rootnative add icon` install them. The rail pulls in `navigation-bar`, whose
destination it reuses; the drawer pulls in `divider` and `portal`.

### One size vocabulary

`Button`, `IconButton` and `Avatar` now take the MD3 size names that
`ButtonGroup`, `FAB`, `Badge` and `AppBar` already used: `'extraSmall' |
'small' | 'medium' | 'large' | 'extraLarge'`. Before, a toolbar with a
`Button size="xs"` next to a `ButtonGroup size="extraSmall"` needed two
names for one size, and `Avatar` had a third pair, `'xSmall'` and
`'xLarge'`.

The old names still work in this release. `'xs' | 's' | 'm' | 'l' | 'xl'`
on `Button` and `IconButton`, and `'xSmall' | 'xLarge'` on `Avatar`, map to
the new names and log one development warning per component and name that
states the new name. **The next release removes them.** The defaults are
unchanged: `Button` and `IconButton` are `'small'`, `Avatar` is `'medium'`.

```tsx
<Button size="extraSmall">Save</Button>
<IconButton icon="star" size="medium" accessibilityLabel="Star" />
<Avatar size="extraLarge" label="AB" />
```

### `SearchBar` density

`density` takes a step on the Material density scale, `0` to `-4`. Each
step removes 4dp from the 56dp container, so `-4` is a 40dp bar for a
desktop toolbar. The icon buttons keep their 40dp frame and the text keeps
`bodyLarge`, so `-4` is the floor. `style={{ height }}` never did this: the
`style` prop goes to the root view and the pill kept its own height.

```tsx
<SearchBar placeholder="Search" density={-4} />
```

### Web without a `SafeAreaProvider`

On web, `react-native-safe-area-context` resolves `SafeAreaView.web`, which
reads `useSafeAreaInsets()` and throws `No safe area value available` when
no provider is mounted. The documented root (`ThemeProvider` > `PortalHost`
> `SnackbarProvider`) therefore rendered a blank page on web, because the
snackbar layer applies insets. `AppBar`, `Layout`, `NavigationBar`,
`BottomSheet` and the snackbar layer now render a plain `View` with zero
insets on web when the context is `null`. Native keeps the package view.
The web Jest mock of the package now throws without a provider, as the real
module does, so a test cannot pass by mounting an inset component outside a
provider.

### `@rootnative/inertia` floor moves to `0.0.17`

A closed `Dialog` disappeared at once, with no exit animation, when it held a
`LinearProgress`, a `CircularProgress` or a `Skeleton`. The same was true of
the other overlays that take content and animate out through `<Presence>`:
`BottomSheet`, `Menu`, `NavigationDrawer`, `SearchView` and `Tooltip`. The
three content components each render a `Motion.*` with no `exit`. Before
inertia `0.0.17`, the first `Motion.*` in an exiting child that finished its
exit removed the whole child. inertia `0.0.17` removes the child only when
every `Motion.*` in it has finished its exit.

Every pin moves together: the `core`, `utils` and `components` peer ranges
are now `>=0.0.17 <0.1.0`, the dev, example and template pins are `0.0.17`
exact, and the registry's derived floor follows. Upgrade
`@rootnative/inertia` to `0.0.17` in the app with this release. A `Dialog`
test now holds each of the three components and fails on an older inertia.

### Docs

- **Web without Expo.** A new page with a Vite config and a webpack config
  for a bundler without Metro: the `react-native-web` alias, the `.web.*`
  extensions, the globals, the worklets Babel plugin on `@rootnative`,
  `react-native-reanimated` and `react-native-worklets` inside
  `node_modules`, and the icon set choice. Without the plugin on those
  three packages the build passes and nothing animates. The page also lists
  the Electron facts: relative asset paths, `'unsafe-inline'` in
  `style-src`, and the `global` define in a sandboxed renderer. The
  `llms-full.txt` carries the same section.
- **`@expo/vector-icons` in the `llms` files.** Both files disagreed on
  whether the peer is optional. It is, and both files, the installation page
  and the icons page now say where the one import of it lives.
- **Theme mode on web.** `storage={localStorage}` works as is: the provider
  catches a `getItem` or `setItem` that throws. The theming page now says so
  and shows the guard for a static export.

## 0.0.0-alpha.21 — 2026-09-30

No breaking changes. A new `SearchView` component. `ThemeProvider` follows
a dark system setting in a static web export. The divider of a scrollable
`Tabs` row spans the whole row.

### `SearchView`

`SearchView` from `@rootnative/components/search-view` is the MD3 search
view: the panel that opens from a `SearchBar` and shows suggestions or
results. It renders through `Portal` on the `dialog` layer.

```tsx
<SearchView
  visible={open}
  onDismiss={() => setOpen(false)}
  anchor={barRef}
  placeholder="Search mail"
  value={query}
  onChangeText={setQuery}
  onSearch={(text) => runSearch(text)}
>
  <List>{suggestions}</List>
</SearchView>
```

- The header is 72dp and holds a back button, the input, a clear button
  while the input holds text, and `actions`. `children` fills the rest.
- `layout="auto"` is full screen on a compact window and docked on a wider
  one. A docked view has the extra-large corner, is 240dp tall at least and
  two thirds of the window at most, and closes on a press outside it. Pass
  the bar's `View` as `anchor`, and the docked view opens over the bar.
- The view asks to close through `onDismiss`: the back button, the Android
  back button, Escape on web, and a press outside a docked view.
- On web, focus moves to the input on open, Tab stays inside the view, and
  focus returns to the trigger on close. On native, the input takes focus on
  open and `accessibilityViewIsModal` keeps the screen reader inside.
- `value` and `onChangeText` control the query, `defaultValue` starts an
  uncontrolled one, `ref` reaches the `TextInput`, and `inputProps` passes
  the rest of its props.

`SearchBar` gains `onPress` for this. With it, the bar is a button that opens
the view: one tab stop with the `button` role, a read-only input that still
shows `value`, and the clear button and actions as buttons of their own. Open
the view from `onPress`, not from `onFocus`: the view returns focus to the
bar when it closes, and a bar that opens on focus reopens it at that moment.

### `mode="system"` is safe in a static web export

`ThemeProvider` read the system scheme with the `react-native`
`useColorScheme`. The export server has no `matchMedia`, so react-native-web
reports `'light'` there, and the HTML ships the light theme. The client
reads the real scheme on its hydration render, and React 19 keeps the
server's light styles with no error. So in a dark browser the page stayed
light until the reader changed the mode.

`ThemeProvider` now resolves `'system'` to light on the server and while the
client hydrates, and then to the OS scheme on the next render. It reads the
same hydration flag as `useWindowDimensions`, so a scheme and a window size
switch on the same render. On native and on a single-page web build, the
provider reads the OS scheme from the first render. A reader with a dark
system setting sees one light frame first on a static export. The server
cannot know the scheme, so that frame is the first paint. If you wrote your
own hydration gate around `mode`, remove it.

### The divider of a scrollable `Tabs` row spans the edge padding

A scrollable row put `edgePadding` on the scroll content, and drew its 1dp
divider inside the tabs. So the divider started after the padding and
stopped before it: at 390dp wide with `edgePadding={16}`, it ran from x 16,
not from the screen edge. A row whose tabs did not fill the width drew the
divider under the tabs only.

The padding is now on the row, and the row fills the scroll view. The
divider spans the tabs and the edge padding on both sides, and it still
scrolls with the tabs, as Compose's `ScrollableTabRow` does. The same change
fixes the scroll position: a selected tab scrolled into view now sits at the
center of the row. It was `edgePadding` off center. If you set
`showDivider={false}` and drew a full-width `Divider` under the row, remove
both.

## 0.0.0-alpha.20 — 2026-09-29

No breaking changes. A new `SearchBar` component. An anchored `Badge` sits at
the correct corner on iOS and Android. `rootnative create` pins
`@rootnative/inertia` `0.0.14`.

### `SearchBar`

`SearchBar` from `@rootnative/components/search-bar` is the MD3 search bar: a
56dp pill with a leading icon, a text input, and a trailing slot. It takes
every `TextInputProps` except `editable` and `style`, so you control it with
`value` and `onChangeText` as you do a `TextInput`.

```tsx
const [query, setQuery] = useState('')
<SearchBar
  placeholder="Search mail"
  value={query}
  onChangeText={setQuery}
  onSearch={(text) => runSearch(text)}
/>
```

- The keyboard shows a **Search** key, and `onSearch` receives the query
  when the user presses it.
- A clear button shows while the bar holds text. It calls
  `onChangeText('')`, then `onClear`, and moves focus back to the input.
  `showClearButton={false}` removes it.
- The leading icon is a decorative `magnify` by default. `onLeadingIconPress`
  makes it a button, such as a menu or a back arrow. Name it with
  `leadingIconAccessibilityLabel`. In development, the component warns when
  that label is missing.
- The trailing slot takes `actions`, a list of icon buttons such as a voice
  action, or `trailing`, custom content such as an `Avatar`. The two fill
  the same slot, so the type rejects both together.
- `ref` reaches the inner `TextInput`, for `focus()`, `blur()` and `clear()`.
- `disabled` disables the input and every button in the bar.
  `containerColor` and `contentColor` change the two colors.

The bar is 720dp wide at most. Set `style={{ maxWidth }}` to change it. MD3
also sets a minimum width of 360dp, which the component does not apply,
because a bar that wide overflows a narrow phone screen.

On the web, the bar is a `search` landmark and the input has the `searchbox`
role. The placeholder is the accessible name of the input unless you set
`accessibilityLabel`. The bar costs a keyboard user one tab stop, plus one
for the clear button while it shows.

MD3 Search has a second part, the search view that opens from the bar and
shows suggestions. The library does not have it yet.

`rootnative add search-bar` installs it, with `icon-button` as a dependency.

### An anchored `Badge` sits at its anchor's corner on native

In alpha.19, a `Badge` that wrapped an anchor was in the wrong position on
iOS and Android. In the 56dp `NavigationBar` pill, the badge was 32dp to the
right of its 24dp icon. A `999+` label on a 24dp anchor showed as `99…`. The
web build was correct.

React Native runs Yoga with its classic errata. The badge used
`start: '100%'`, and Yoga resolved that percentage against the width the
parent offers, not the final width of the wrapper. Yoga also limited the
badge to the width of its 24dp containing block, and that cut the label.

The wrapper now puts the badge in a zero-size row at the top-end corner of
the anchor, and the badge takes a negative `start` equal to the MD3 offset.
The position on the web does not change. If you moved the badge with a
`style` offset to correct it on native, remove the offset.

### `rootnative create` pins `@rootnative/inertia` `0.0.14`

The two templates pinned `0.0.13`. inertia `0.0.14` fixes a `layoutId`
transition that did not run when its source element stayed mounted and did
not move. That is the usual case for a list card that opens a detail screen.
The peer range stays `>=0.0.11 <0.1.0`, because no component uses an inertia
API that is newer than `0.0.11`.

## 0.0.0-alpha.19 — 2026-09-28

No breaking changes. A new `Badge` component, which a `NavigationBar` item
can show on its icon. A selected filter chip reads its pill from the theme. A
`Card` inside a `Link` renders as a link on the web. `core` exports a
`useWindowDimensions` that is safe in a static web export.

### `Badge`

`Badge` from `@rootnative/components/badge` is the MD3 badge. With no
`label`, it is a 6dp dot. With a `label`, it is a 16dp pill that holds a
count or a short word. A number above `max` shows as `{max}+`, and `max` is
999 by default. Wrap the anchor, usually a 24dp icon, and the badge sits at
its top-end corner with the MD3 offsets. With no children, the badge renders
inline. `visible={false}` removes the badge and keeps the anchor, so the
layout does not move when the badge comes back. The fill is `error` and the
label is `onError`, and `containerColor` and `contentColor` change them.

```tsx
<Badge label={3} accessibilityLabel="3 unread messages">
  <MaterialCommunityIcons name="email-outline" size={24} />
</Badge>
```

A small badge has no text, so a screen reader does not announce it unless you
give it an `accessibilityLabel`.

A `NavigationBarItem` takes a new `badge` field. `true` shows a dot, and a
number or a string shows a large badge. The badge in the bar is decorative,
so put the count in the item's `accessibilityLabel`.

`rootnative add badge` installs it, and `rootnative add navigation-bar` now
installs `badge` as a dependency.

### `useWindowDimensions` from `@rootnative/core`

`useBreakpoint` was safe in a static web export, but a layout that needs the
raw width had only the `react-native` hook. On the export server that hook
measures a 0 by 0 window, and React 19 keeps the server's style when the
client hydrates, with no error. So on a 1440 wide screen, a carousel slot
sized from the width drew -128 wide, and a hero set as a fraction of the
width drew 0 high, until the reader resized the window.

`useWindowDimensions` from `@rootnative/core` returns the same `ScaledSize`
as the `react-native` hook. While the client hydrates, it returns the
server's 0 by 0 window, and then the measured window on the next render. On
native and on a single-page web build, it returns the measured window from
the first render. `useBreakpoint` now reads this hook, so a breakpoint and a
raw width cannot disagree during hydration. Its behaviour does not change.
If you wrote your own guarded copy of the hook, import this one and remove
the copy.

### A `role` you pass to `Card` replaces `button`

An interactive `Card` set `role="button"` after it spread your props, so the
role you passed was lost with no warning. Expo Router's `<Link href asChild>`
passes `role="link"` and `href` to its child. The card then rendered
`<button href>` on the web, which a crawler does not follow and a middle click
does not open. The card now uses your `role` and
falls back to `button`, so react-native-web renders an `<a>`. With no `role`,
the card is a `<button>` as before. `Chip`, `Button`, `IconButton`, `FAB`,
`ListItem` and `Avatar` already let your `role` win, because they set the
older `accessibilityRole` and `role` takes precedence over it. If you put a
`Pressable` between a `Link` and a `Card` to get an anchor, remove it: the
`Card` gets its state layer and focus ring back.

### A selected filter `Chip` respects `roundness`

The selected rest radius was a constant, half the chip height, while the
unselected radius read `theme.shape.cornerMedium`. Under `applyRoundness(0)`
every surface was square except a selected filter chip, which morphed into a
16dp pill and could not be themed out of it. The selected radius now reads
`theme.shape.cornerLarge`, which is 16dp at the default roundness and scales
with it, capped at half the chip height so a rounder theme still draws a true
pill. The default look is unchanged.

## 0.0.0-alpha.18 — 2026-09-27

No breaking changes. `TextField` gains a `ref` prop. Every component that
applies a safe-area inset reads it from `SafeAreaProvider` when one is
mounted. The snackbar fits a phone screen on native. Each entry names the
workaround you can now remove.

### `TextField` forwards a ref to its `TextInput`

`TextField` took every `TextInputProps` but no `ref`, so a screen could not
call `focus()`, `blur()` or `setSelection()` on it. `TextFieldProps` now
declares `ref?: Ref<TextInput>`, and the component merges it with the ref it
uses for its own press-to-focus.

```tsx
const ref = useRef<TextInput>(null)
<TextField ref={ref} label="Search" />
ref.current?.focus()
```

React 19 passes `ref` as a prop, so the component is not wrapped in
`forwardRef`. If you drew a plain `TextInput` to get a programmatic focus,
you can use `TextField` again.

### Safe-area insets come from the provider on the first paint

`AppBar insetTop`, `Layout`, `NavigationBar insetBottom`, `BottomSheet` and
the snackbar layer all wrapped their content in the native `SafeAreaView`
from `react-native-safe-area-context`. That view measures its own inset on
the native side, and on a `transparentModal` route from
`react-native-screens` the first measurement is 0. The bar sat under the
status bar until something re-rendered it, such as a theme change.

The shared wrapper now reads `SafeAreaInsetsContext`. Inside a
`SafeAreaProvider` it renders a plain `View` and adds each requested edge's
inset to the padding the style carries, the same additive maths as the
package's own web `SafeAreaView`. That value is correct on the first render.
Without a provider the context is `null`, and the wrapper renders the native
`SafeAreaView` as before.

**Expo Router mounts a `SafeAreaProvider` at its root**, so every Expo Router
app takes the new path with no change. If you dropped `insetTop` and padded
an `AppBar` from `useSafeAreaInsets` yourself, put `insetTop` back and remove
the padding. Do not keep both, or the bar gets a double inset on a phone.

### The snackbar fits a phone screen on iOS and Android

On native, the snackbar surface was 600dp wide on a 402dp phone, and the
layer centred it 99dp off the left edge. The reader saw the tail of the
message and no action label. The surface set `width: '100%'` and
`maxWidth: 600`, but its parent, the entrance `Motion.View`, had no width. In
Yoga a percentage width does not resolve against a grandparent, so the
surface took its maximum. A browser resolves it, which is why the web build
was correct.

The entrance view now carries `width: '100%'` and `maxWidth: 600`, and the
surface no longer sets `maxWidth`. The surface still fills the 16dp-margined
layer up to 600dp, so a tablet layout does not change. If you passed a
numeric `width` through the provider `style` as a workaround, remove it.

## 0.0.0-alpha.17 — 2026-09-26

No breaking changes. `AppBar` gains one prop and one exported type,
`AppBarNavigationIcon`, and its layout moves to the MD3 geometry, so every bar
shifts by a few dp. On iOS, the shadow of a non-interactive elevated `Card`
is softer. The rest is a lint and internal-hygiene pass. One dev-only behaviour changes,
and `rootnative add` copies one more file.

### `AppBar` centres an `IconButton` in `leading` and `trailing`

An `IconButton` passed to `leading` or `trailing` sat 4pt above the title. The
`IconButton` root sets `alignSelf: 'flex-start'`, so that the button does not
stretch in a column. In the row of the side slot, the same rule acts on the
vertical axis and overrides the slot's `alignItems: 'center'`. The built-in
back button and the `actions` escaped the defect only because each one sits in
a centred 48×48 frame.

Custom slot content is now wrapped in a row that the slot centres. The row
keeps a fragment of several buttons side by side, and it is at least 48dp
wide, so a custom `IconButton` takes the same space as the built-in one. If
you wrapped an `IconButton` in your own centred `View` to correct the offset,
you can remove the wrapper. It is not necessary, and it does no harm.

### `AppBar` layout matches the MD3 geometry

The reference is the Compose Material 3 `TopAppBarLayout`, measured on the
web export of the example app. **Every bar moves by a few dp:**

| Position, in dp from the bar edge | Before | Now |
| --- | --- | --- |
| Navigation button | 4–44 | 8–48 |
| Last action, from the end edge | 12 | 8 |
| Title, after a navigation button | 52 | 56 |
| Title, after a custom `leading` `IconButton` | 44 | 56 |
| Medium or large title, with a navigation button | 52 | 16 |

- The built-in buttons had the same `flex-start` defect on the horizontal
  axis: each sat 4dp to the start of its 48dp frame.
- The title had no padding of its own. MD3 gives it 4dp on each side, the
  same as each side slot.
- MD3 puts the expanded title of a medium or large bar under the navigation
  button, not after it. On scroll, the title now moves from 16dp to the
  small-bar position while it collapses.

No theme token changes. `horizontalPadding: 4` and `titleStartInset: 12`
already had the MD3 values; the formulas that read them were wrong.

### `AppBar` has a close button for a modal

`navigationIcon="close"` changes the icon that `canGoBack` renders from a back
arrow to a cross. The button keeps the built-in size, colour, and frame, so a
modal no longer needs a custom `leading`. The accessibility label follows the
icon: the cross announces "Close", and the arrow still announces "Go back".
`onBackPress` fires for both. The default is `'back'`, so an existing bar does
not change.

```tsx
<AppBar title="About" canGoBack navigationIcon="close" onBackPress={dismiss} />
```

### An elevated `Card` has the correct shadow blur on iOS

This change applies only to an elevated `Card` with no `onPress`, on iOS. That
card paints its shadow through `boxShadow`, because iOS clips the `shadow*`
keys of a view that clips its children. Fabric halves the blur of a
`boxShadow` on iOS (`React/Fabric/Utils/RCTBoxShadow.mm`), so the card had a
blur radius of 1 instead of the level-1 value of 2. The card now doubles the
blur before Fabric halves it, and its shadow is the same as the level-1 shadow
on every other surface.

**The shadow is softer than in alpha.16.** Android and web do not change, and
an interactive `Card` does not change.

### The React Compiler lint rules are on

`eslint-plugin-react-hooks` moves from `4.6.2` to `7.1.1`, which brings the
React Compiler rule set. The build does not run the React Compiler, so these
rules are advisory here: each one reports a pattern the compiler cannot
optimize, or one a future concurrent re-render could break.

Three places wrote a ref during render and now write it in an effect:
`BottomSheet`, `useFocusTrap` and `ThemeProvider`. Every one of those refs is
read from a callback — a PanResponder handler, a keydown listener, or an async
loader — and a callback cannot run before the commit that produced the value it
reads. **The behaviour is the same.** `react-hooks/refs` forbids the
render-time write because a render that never commits must not leave its value
behind.

`react-hooks/immutability` is off for the whole repo. A Reanimated
`SharedValue` is mutated through `.value`, and that write is the entire API of
the type. It never triggers a render, so the hazard the rule describes cannot
happen, and no refactor satisfies the rule. `inertia`, `impulse` and
`rootnative` turn off the same single rule and nothing else from the compiler
set.

The compiler rules are also off in tests. A test harness assigns a hook's
result to a module-level `let` on purpose, so the test body can reach it. None
of that ships.

### A misuse warning prints once, not once per instance

Five misuses print a dev-only error: `<Grid.Cell>` outside a `<Grid>`,
`<Portal>` outside a `<PortalHost>`, a named `<PortalHost>` acting as the root,
an uncontrolled `<Menu>` with an invalid `anchor`, and a plain `<Tooltip>`
carrying `subhead` or `actions`.

Each component held its own `useRef` latch, so the error repeated once per
mounted instance. A list of 100 misused cells printed 100 identical errors. A
shared `warnOnce` helper now keys the guard by the misuse, so each message
prints once for the lifetime of the module. Keying it rather than using one
boolean keeps two different misuses from silencing each other.

The warnings stay dev-only, and production is unaffected.

**`rootnative add` copies one more file.** The `layout`, `menu`, `portal` and
`tooltip` entries gain `internal/warnOnce.ts`. A component you scaffolded
before this release carries its own latch and still works, so there is nothing
to redo.

**`rootnative create` pins `@rootnative/inertia` `0.0.13`.** The two templates
pinned `0.0.11`. The peer range stays `>=0.0.11 <0.1.0`, because no component
uses an inertia API that is newer than `0.0.11`.

## 0.0.0-alpha.16 — 2026-09-13

No breaking changes. One silent correctness fix that reaches every static
export, two helpers promoted out of `internal/`, and two layout and keyboard
traps closed.

### `useBreakpointValue` is hydration-safe by construction

A static export renders on a server with no DOM, where react-native-web pins
`Dimensions` to `width: 0`. Every breakpoint resolved to `compact`, and that is
what shipped in the HTML — while the client measured the real width on its very
first render. **React does not repair that disagreement.** Measured against
React 19.2.3: a `style` mismatch is adopted from the server DOM, left on
screen, and reported through *zero* recoverable errors. A tablet got the phone
layout, permanently, with no console signal.

`useBreakpoint` now reads a `useSyncExternalStore` whose only job is to report
*when* React is reading it. React calls `getServerSnapshot` during server
rendering and through the hydration pass, then `getSnapshot` for every render
after, so the hook returns `compact` for exactly as long as the client is
reproducing the server's markup and switches to the measured breakpoint on the
re-render React schedules once hydration finishes. That correction is an
ordinary update, which *does* patch the DOM.

The visible consequence is that a breakpoint-dependent layout starts compact
and widens a frame later. The server cannot know the viewport, so make the
compact variant an honest first paint rather than a placeholder.

**Consumers can delete their own `useHydrated` gates.** So can any code that
hands a breakpoint map to `Grid` (`columns`) or `Grid.Cell` (`span`): those
resolve the map internally, which put the trap somewhere a consumer's gate
could not reach.

It costs nothing where there is no hydration. On native, and on a single-page
web build, `getServerSnapshot` is never called, so the measured breakpoint is
returned from the first render with no extra pass.

### `elevationShadowConfig` and `elevationBoxShadow` are public

Both are exported from `@rootnative/components`. They convert a
`theme.elevation.level*` token into the surface each platform actually renders:
web gets a CSS `boxShadow` string, native gets the classic
`shadow*` / `elevation` keys.

Reach for `elevationShadowConfig` whenever an elevation is **animated**.
`useShadow` accepts the classic keys, and on web they animate nothing —
react-native-web 0.21 deprecated those props and the per-frame values never
reach CSS, so a hover lift stays visibly flat with a single deprecation warning
as the only signal. Passing `theme.elevation.level*` straight to `useShadow`
does not work either: those tokens are built from the `shadow*` keys and carry
no `boxShadow` field.

**Nothing about the helpers changed** — `Button`, `Card`, `Chip` and `FAB` have
used them since alpha.5. They simply lived in `packages/components/src/internal/`,
so a consumer who hit the web tween problem had to rebuild the conversion by
hand and had no way to know one already shipped. This is an access change, not
a new shape.

**Do not flatten the platform split and emit both keys.** RN 0.76+ on the new
architecture renders `boxShadow` natively too, so a config carrying both
applies two shadow systems to one view and whichever resolves last wins. That
is also why `ElevationLevel` carries no `boxShadow` field: a token holding both
shapes at once cannot be handed to `useShadow` on any platform.

### `<Stagger>` works inside `<Grid>`

A `<Stagger>` wrapping N cards used to collapse into a single grid cell, so the
whole cascade landed in one column.

`Grid` wraps every child that is not a `Grid.Cell` in a cell of its own, and
`React.Children.map` does not descend into a fragment — `Stagger` renders a
fragment of context providers and no host view, so N cards arrived as *one*
child. `Grid` now looks through a `Stagger` element: it cell-wraps the
stagger's children and keeps the `Stagger` element itself, so each cell still
sits under its own delay provider.

The fix had to live in `Grid`. `Stagger` already assigns its delays per child
rather than per parent slot, so the cascade was never what broke — only the
layout — and nothing `Stagger` could do would help, because the collapse
happens before it renders.

### `TextField` no longer adds a second tab stop per field

The container `Pressable` widens the press target and catches hover. It is not
a control, and it carried `accessible={false}` and `focusable={false}` to say
so — but **neither prop removes the tab stop on web.** Measured in jsdom
against react-native-web 0.21.2: an enabled `Pressable` renders `tabindex="0"`
and keeps it with both props set. Every field therefore cost a keyboard user
two stops, and the first one only forwarded focus to the second.

It now carries `tabIndex={-1}`, the same way `Tooltip` blocks the same stop.
Two web tests pin the attribute — reading the rendered DOM, not the props,
because the props are exactly what mislead here.

### Developed against `@rootnative/inertia` `0.0.12`

The dev pin moves from `0.0.11` to `0.0.12`. **The peer range is unchanged at
`>=0.0.11 <0.1.0`** — no package here calls a `0.0.12` API, so nothing forces a
consumer to upgrade. `0.0.12` adds `useInView`, a static-export entrance guard,
a `pointerHandlers` bag on `useGesture`, and a widened `useMotionValue`; all
four serve a page rather than a component library.

### Documentation

`Column` gains a page section on alignment and on when a wrapper collapses to
its content, which is the shape behind most "my centred block is the wrong
width" reports.

The responsive page replaces its server-rendering note. It used to tell you to
"treat the first render as `compact` and let the client correct it" — advice
the first entry above makes unnecessary — and now states what the hook
guarantees, what it costs, and that `Grid` inherits the same safety for its
`columns` map.

## 0.0.0-alpha.15 — 2026-09-09

The Expo SDK 57 release. Every package moves to the SDK 57 runtime band and
stops claiming SDK 54, so an app that stays on SDK 54 stays on
`0.0.0-alpha.14`. No one set of ranges serves both bands.

### Breaking: the peer ranges are narrowed to the Expo SDK 57 band

`core`, `components` and `icons` declare `react >=19.2.3 <20.0.0` and
`react-native >=0.83.0 <0.87.0`. `components` also narrows
`react-native-reanimated` to `>=4.5.0 <4.6.0` and `react-native-worklets` to
`>=0.10.0 <0.11.0`. The floors they replace — `react >=18.0.0`,
`react-native >=0.72.0`, `react-native-reanimated >=4.0.0` and
`react-native-worklets >=0.5.0` — were never installable: `components` depends
on `@rootnative/inertia`, whose own floor was already `react >=19.0.0` with
`react-native >=0.81.0`, so npm rejected the advertised floor with `ERESOLVE`.

The band cannot be wider. Each peer range resolves on its own, so any set that
admits both SDK 54 (`react-native 0.81` with Reanimated `4.1`) and SDK 57
(`react-native 0.86` with Reanimated `4.5`) also admits `react-native 0.81`
with Reanimated `4.6`, which cannot install. A range promises every combination
it permits, not only the combinations that were tested. `@rootnative/inertia`
`0.0.11` narrowed its own ranges for that reason, and this release tracks it so
the two cannot disagree.

Migration: move the app to Expo SDK 57 — React `19.2.3`, React Native
`0.86.3`, Reanimated `4.5.1`, Worklets `0.10.1`. A project on SDK 54 stays on
`0.0.0-alpha.14`. A project that runs Jest also needs
`@react-native/jest-preset` at the version that matches its `react-native`:
React Native `0.86` moved the preset into that package and left a shim that
declares it as an optional peer, which no package manager installs.

The claim is gated rather than reviewed. `compat.yml` packs the `components`
tarball and installs it into every Expo SDK fixture in `rootnative/sdk-compat`
with `enforce-range: true`, on every push to `main` and every pull request that
touches `packages/**`. The test suite in this repository says nothing about
what a consumer can install, and that gap is what let the old floors ship.

### `@rootnative/inertia` floor moves to `0.0.11`

Every pin moves together: the `core`, `utils` and `components` peer ranges are
now `>=0.0.11 <0.1.0`, the dev, example and template pins are `0.0.11` exact,
and the registry's derived floor follows. `0.0.11` is the release whose own
peer ranges match the SDK 57 band. `0.0.10` declares `react-native >=0.81.0`
and `react-native-reanimated >=4.0.0`, which a fresh install can reject.

`0.0.11` also fixes a crash and exports three style types. The crash was a
keyframe array — `animate={{ translateY: [0, -8, 0] }}` — taking the whole
render down under reduced motion. The types are `ColorStyle`, `TranslateStyle`
and `ShadowStyle`. This library writes no keyframe array and names none of the
three: every call of `useColorTransition`, `useColorCascade` and `useShadow`
spreads the style into a `style` array, where inference is enough. So the
raised floor is a requirement of the SDK band rather than of anything the
library consumes.

### `@expo/vector-icons` and `react-native-safe-area-context` are required peers

Both were marked optional in `peerDependenciesMeta`, and no package manager
installs an optional peer. The library imports both **statically**, so no
runtime fallback exists to make them skippable: Metro builds its module graph
by scanning for literal import calls and fails with `Unable to resolve module`
before any fallback could run. The comment in `src/safe-area.tsx` records why
the lazy `require()` shape does not survive the build. The flags are gone, so
npm and pnpm now install both. `react-native-svg` was already required, and the
installation page states the status of every peer in one column. Yarn classic
installs no peers at all, so a Yarn project still adds the list by hand.

### `pointerEvents` moved from a prop to a style

Every component that marked a decorative overlay non-interactive — focus rings,
state layers, elevation carriers, the Tabs indicator, the Menu / Tooltip /
BottomSheet / Snackbar overlay layers — passed `pointerEvents` as a prop.
react-native-web deprecated that spelling: `createDOMProps` warns
`props.pointerEvents is deprecated. Use style.pointerEvents`. The warning is
`warnOnce`-guarded, so it appeared exactly once, unattributed, in the console of
every web app that rendered any of these — 69 call sites across 24 components.

Nothing renders differently. react-native-web's own implementation translated
the prop into the identical style object and appended it after the caller's
`style`, so the components now write it themselves, last in the style array,
which is where it already landed. React Native has read the key from `style`
since 0.71, so native is unchanged too. `cursor.web.test.tsx`, which reads the
real DOM, was green before and after.

No public API change: `pointerEvents` was never part of any component's props.
A consumer passing it to a component that forwards `ViewProps` still works, and
still warns — that call site should move it into `style` as well.

`react/forbid-component-props` now fails the build on the prop form. It is a
lint rule rather than a test because the warning is `warnOnce`-guarded: only the
first offender in a process is observable, so a per-component test passes for
every component rendered after it. Fault injection confirmed that directly —
putting the prop back on `Button` left the web suite green, and fails lint.

### One shared `AnimatedPressable`, and six worklets fold into `useInterpolatedStyle`

Thirteen components each declared their own
`const AnimatedPressable = Animated.createAnimatedComponent(Pressable)`.
`createAnimatedComponent` builds a new wrapper class per call, so the package
shipped thirteen distinct classes for one base component. They now share
`internal/AnimatedPressable.ts`, and the built bundle carries one definition in
one chunk.

**The npm package is what gains here; a CLI-installed project is unchanged.**
The installer flattens `../internal/*` into each consuming component's own
directory, so `rootnative add button chip switch` still writes one
`AnimatedPressable.ts` per component. That self-containment is the point of the
copy-paste path, not an oversight. What does change for a CLI consumer is the
file list: those thirteen components each ship one more file, and `rootnative
update` rewrites the component that imports it.

Separately, six `useAnimatedStyle` blocks driven by a *single* progress value
move to `useInterpolatedStyle` — Button's elevation radius, three plain-opacity
styles in Switch, TextField's hover layer, and the Slider thumb. Nothing renders
differently. Twenty-seven hand-rolled worklets remain, each of which either
mixes two or more driving values or needs a key `useInterpolatedStyle` cannot
express.

**The Slider thumb needed `extrapolate: 'extend'`, and without it this would
have been a silent regression.** `useInterpolatedStyle` defaults to `'clamp'`;
a hand-rolled `interpolate` defaults to `'extend'`. `pressed` rides
`spring-fast-spatial`, which is underdamped by design and overshoots both ends,
and `evalEdge` extrapolates that same value unclamped for the track segments and
the stop indicators. A clamped thumb would have drifted out of step with its own
track for the length of every settle.

`Slider.test.tsx` pins the option rather than the arithmetic, and the reason is
worth knowing before writing any similar test: `@rootnative/inertia/jest-setup`
stubs `interpolate` as `value >= 1 ? last : first`. That is a binary step which
ignores the input range and the extrapolation config, so a measured width reads
identically under `'extend'` and `'clamp'` and an assertion on one would pass
against either. Validated by fault injection — dropping the option fails the
case, and only that case.

No public API change: `internal/` is not exported and `api:check` is unchanged.

### Both templates ship Expo SDK 57

`rootnative create` now scaffolds on `expo ~57.0.20` with React Native
`0.86.3`, Reanimated `4.5.1`, Worklets `0.10.1` and inertia `0.0.11`. SDK 57
removed the legacy top-level `splash` key from `app.json`, so both templates
declare the splash screen through the `expo-splash-screen` plugin, and
`newArchEnabled` / `edgeToEdgeEnabled` are gone because the SDK defaults
them. Android's predictive back gesture is switched off explicitly with
`predictiveBackGestureEnabled: false`. `babel.config.js` is gone as well — it
held nothing but `babel-preset-expo`. The blank template's entry point is
`index.ts`.

The icon, adaptive icon, favicon and splash mark in both templates now carry
the RootNative mark. `scripts/build-brand.mjs` renders them into the template
asset directories as well as the example app, from one source, so a scaffolded
project cannot drift from the example it is modelled on.

### Two guards the release path was missing

`pnpm run check:template-pins` compares every template pin against the
installed Expo SDK and the `components` peer ranges. The templates are not
workspace members, so no install, typecheck or test run ever reads their pins:
they sat a whole Expo SDK behind the library while every gate stayed green.

`pnpm run registry:check` regenerates the registry and fails on drift.
`check:inertia-pins` reads the registry but compares only the inertia floor in
each entry, so the `files` lists were unguarded — 21 of 29 were missing
`internal/pointerEvents.ts` after the import was added without re-running the
generator. The registry is what `rootnative add` copies into a consumer
project, so a stale list hands them a component with a missing import.

Both guards run in `ci.yml` and in `release.yml`.

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
