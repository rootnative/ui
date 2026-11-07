<!-- Absolute URL: npm does not resolve repository-relative image paths. -->
<img src="https://raw.githubusercontent.com/rootnative/ui/main/assets/brand/rootnative-mark.png" alt="" width="88" height="88" />

# @rootnative/components

Material Design 3 UI components for React Native, part of [Root Native UI](https://github.com/rootnative/ui).

## Install

```bash
pnpm add @rootnative/core @rootnative/components @rootnative/inertia react-native-safe-area-context react-native-svg
```

Everything in that line is a **required** peer. `@rootnative/inertia` runs every
animation in the library. The library imports `react-native-safe-area-context`
and `react-native-svg` statically, so the bundle fails to resolve without them,
however little of the library you use.

`@react-native-vector-icons/material-design-icons` is an **optional** peer. Only the
`@rootnative/components/mdi` subpath imports it. Install it, with `expo-font`
on Expo, and pass `iconResolver={mdiResolver}` to `ThemeProvider` to render
string icon names with MaterialDesignIcons. An app with its own `iconResolver`
never imports it. Expo is retiring `@expo/vector-icons` in favour of this
package, so the library doesn't use the old one.

> An earlier release marked the last three optional. The library imported them
> statically all the same, so Metro failed on `Unable to resolve module` before
> the runtime fallback could apply. A lazy `require` is not a fix here: it
> doesn't survive `splitting: true`, which `src/safe-area.tsx` explains.

npm and pnpm install the required peers for you. Yarn classic installs no
peers at all, so add them by hand there.

**Optional**, only for the interactive components:

```bash
pnpm add react-native-reanimated react-native-worklets
```

Each release line supports one Expo SDK band: SDK 58 takes `0.0.0-alpha.29`
and later, SDK 57 takes `0.0.0-alpha.16` to `0.0.0-alpha.28`
(`npm install @rootnative/components@0.0.0-alpha.28`).

> These two power the state-layer transitions and the gesture-driven components
> (Slider, Switch). The static components (Typography, Layout, Portal,
> KeyboardAvoidingWrapper, Divider) work without them. They are optional in
> practice: nothing imports them statically. With Expo SDK 58, both are already
> available in Expo Go.
>
> Reanimated 4 runs on `react-native-worklets`. **Expo SDK 58 bundles its Babel
> plugin, so there is nothing to configure.** On bare React Native, add
> `'react-native-worklets/plugin'` as the last entry of the `plugins` in your
> `babel.config.js`.

Wrap your app in `ThemeProvider` from `@rootnative/core` (see [@rootnative/core](https://www.npmjs.com/package/@rootnative/core)).

## Import

Subpath imports (preferred, so the bundler can tree-shake the rest):

```tsx
import { Button } from '@rootnative/components/button'
import { Card } from '@rootnative/components/card'
```

Root import:

```tsx
import { Button, Card } from '@rootnative/components'
```

## Components

| Component | Subpath | Variants |
|-----------|---------|----------|
| Typography | `./typography` | displayLarge..labelSmall (15 MD3 type scale roles) |
| Button | `./button` | filled, elevated, outlined, text, tonal |
| IconButton | `./icon-button` | filled, tonal, outlined, standard |
| FAB | `./fab` | primary, secondary, tertiary, surface · small, medium, large · optional extended label |
| ButtonGroup | `./button-group` | standard, connected · single or multi-select toggle |
| AppBar | `./appbar` | small, center-aligned, medium, large |
| Card | `./card` | elevated, filled, outlined |
| Chip | `./chip` | assist, filter, input, suggestion |
| Avatar | `./avatar` | image, icon, or text initials · 5 sizes (extraSmall..extraLarge) |
| Checkbox | `./checkbox` | — |
| Radio | `./radio` | — |
| Switch | `./switch` | — |
| Slider | `./slider` | continuous, discrete (stepped), range, centered origin |
| Progress | `./progress` | linear, circular · determinate, indeterminate |
| LoadingIndicator | `./loading-indicator` | contained, uncontained · determinate, indeterminate |
| TextField | `./text-field` | filled, outlined |
| SearchBar | `./search-bar` | MD3 search bar · clear button · trailing actions or avatar |
| Layout | `./layout` | Layout, Box, Row, Column, Container, Grid |
| Dialog | `./dialog` | basic, fullscreen · Icon / Title / Content / Actions slots |
| Divider | `./divider` | horizontal, vertical · optional leading/trailing insets |
| List | `./list` | List, ListItem, ListDivider (alias of Divider) |
| Portal | `./portal` | Portal, PortalHost |
| Snackbar | `./snackbar` | SnackbarProvider + useSnackbar() — imperative queue |
| Menu | `./menu` | Menu, Menu.Item · self-managing or controlled · anchored with collision flipping |
| Tooltip | `./tooltip` | plain, rich · hover or long press · anchored with collision flipping |
| BottomSheet | `./bottom-sheet` | modal, standard · snap points · velocity-based settle · drag-to-dismiss |
| SideSheet | `./side-sheet` | modal, standard · headline, back and close buttons · actions · start or end edge · detached |
| Tabs | `./tabs` | primary, secondary · fixed or scrollable · sliding active indicator |
| NavigationBar | `./navigation-bar` | 3–5 destinations · label visibility always / selected / never |
| BottomAppBar | `./bottom-app-bar` | up to 4 icon actions · flat secondary FAB · insetBottom |
| KeyboardAvoidingWrapper | `./keyboard-avoiding-wrapper` | — |

## Quick examples

```tsx
import { Button } from '@rootnative/components/button'
import { TextField } from '@rootnative/components/text-field'
import { Card } from '@rootnative/components/card'
import { Typography } from '@rootnative/components/typography'
import { Row, Column } from '@rootnative/components/layout'

// Button with icon
<Button variant="filled" leadingIcon="plus" onPress={handleCreate}>Create</Button>

// Text field
<TextField label="Email" variant="outlined" value={email} onChangeText={setEmail} />

// Card
<Card variant="elevated" onPress={handlePress}>
  <Typography variant="titleMedium">Card Title</Typography>
</Card>

// Layout
<Column gap="md">
  <Row gap="sm" align="center">
    <Button variant="filled">Save</Button>
    <Button variant="outlined">Cancel</Button>
  </Row>
</Column>
```

## Override pattern

All interactive components support a 3-tier override system (theme → variant → props):

- `containerColor`: the background color (the component derives the state-layer colors from it)
- `contentColor`: the content (label + icons) color
- `labelStyle`: the text style only (it doesn't affect the icons)
- `style`: the root container style

```tsx
<Button containerColor="#006A6A" contentColor="#FFFFFF">Custom</Button>
```

## Icons

Every icon prop (`leadingIcon`, `trailingIcon`, `icon`, …) accepts an `IconSource`, in one of three forms:

- **String name** (`"check"`): resolves through the `iconResolver` of the theme. Pass `mdiResolver` from `@rootnative/components/mdi` for [MaterialDesignIcons](https://pictogrammers.com/library/mdi/), or your own resolver. Without a resolver, a string name renders nothing and logs one warning.
- **ReactElement** (`<Check size={18} color="#fff" />`): a one-off icon from any library. You control the size and the color.
- **Render function** (`({ size, color }) => <Check ... />`): receives the resolved size and color of the component.

To route string names to a different library across the app (Lucide, Phosphor, SF Symbols, custom SVGs), pass an `iconResolver` to `ThemeProvider`. The pre-built adapters live in [`@rootnative/icons`](https://www.npmjs.com/package/@rootnative/icons); see the [icons guide](https://rootnative.github.io/ui/icons).

## Docs

Full API reference: https://rootnative.github.io/ui/

LLM-optimized reference: https://rootnative.github.io/ui/llms-full.txt. Or read `node_modules/@rootnative/components/llms.txt` for the exact installed version.

## License

MIT
