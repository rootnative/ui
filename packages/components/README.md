<!-- Absolute URL: npm does not resolve repository-relative image paths. -->
<img src="https://raw.githubusercontent.com/rootnative/ui/main/assets/brand/rootnative-mark.png" alt="" width="88" height="88" />

# @rootnative/components

Material Design 3 UI components for React Native, part of [RootNative UI](https://github.com/rootnative/ui).

## Install

```bash
pnpm add @rootnative/core @rootnative/components @rootnative/inertia react-native-safe-area-context @expo/vector-icons react-native-svg
```

Everything in that line is a **required** peer. `@rootnative/inertia` runs every
animation in the library, and `react-native-safe-area-context`,
`@expo/vector-icons` and `react-native-svg` are imported statically, so the
bundle fails to resolve without them however little of the library you use.

> An earlier release marked the last three optional. They were imported
> statically all the same, so Metro failed on `Unable to resolve module` before
> the runtime fallback could apply. A lazy `require` is not a fix here: it does
> not survive `splitting: true`, which `src/safe-area.tsx` explains.

npm and pnpm install required peers automatically; Yarn classic installs no
peers at all, so add them explicitly there.

**Optional** — only needed for interactive components:

```bash
pnpm add react-native-reanimated react-native-worklets
```

> These power state-layer transitions and gesture-driven components (Slider,
> Switch). Static components (Typography, Layout, Portal,
> KeyboardAvoidingWrapper, Divider) work without them. They are genuinely
> optional: nothing imports them statically. With Expo SDK 57 both are already
> available in Expo Go.
>
> Reanimated 4 runs on `react-native-worklets`. **Expo SDK 57 bundles its Babel
> plugin — nothing to configure.** On bare React Native, add
> `'react-native-worklets/plugin'` last in your `babel.config.js` `plugins`.

Wrap your app with `ThemeProvider` from `@rootnative/core` (see [@rootnative/core](https://www.npmjs.com/package/@rootnative/core)).

## Import

Subpath imports (preferred for tree-shaking):

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
| Avatar | `./avatar` | image, icon, or text initials · 5 sizes (xSmall..xLarge) |
| Checkbox | `./checkbox` | — |
| Radio | `./radio` | — |
| Switch | `./switch` | — |
| Slider | `./slider` | continuous, discrete (stepped), range, centered origin |
| Progress | `./progress` | linear, circular · determinate, indeterminate |
| LoadingIndicator | `./loading-indicator` | contained, uncontained · determinate, indeterminate |
| TextField | `./text-field` | filled, outlined |
| Layout | `./layout` | Layout, Box, Row, Column, Grid |
| Dialog | `./dialog` | basic, fullscreen · Icon / Title / Content / Actions slots |
| Divider | `./divider` | horizontal, vertical · optional leading/trailing insets |
| List | `./list` | List, ListItem, ListDivider (alias of Divider) |
| Portal | `./portal` | Portal, PortalHost |
| Snackbar | `./snackbar` | SnackbarProvider + useSnackbar() — imperative queue |
| Menu | `./menu` | Menu, Menu.Item · self-managing or controlled · anchored with collision flipping |
| Tooltip | `./tooltip` | plain, rich · hover or long press · anchored with collision flipping |
| BottomSheet | `./bottom-sheet` | modal, standard · snap points · velocity-based settle · drag-to-dismiss |
| Tabs | `./tabs` | primary, secondary · fixed or scrollable · sliding active indicator |
| NavigationBar | `./navigation-bar` | 3–5 destinations · label visibility always / selected / never |
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

- `containerColor` — Background color (state-layer colors auto-derived)
- `contentColor` — Content (label + icons) color
- `labelStyle` — Text-specific style (does not affect icons)
- `style` — Root container style

```tsx
<Button containerColor="#006A6A" contentColor="#FFFFFF">Custom</Button>
```

## Icons

Every icon prop (`leadingIcon`, `trailingIcon`, `icon`, …) accepts an `IconSource` — one of three forms:

- **String name** (`"check"`) — resolves through the theme's `iconResolver`. By default this is [MaterialCommunityIcons](https://pictogrammers.com/library/mdi/) from `@expo/vector-icons`.
- **ReactElement** (`<Check size={18} color="#fff" />`) — one-off icon from any library; you control size and color.
- **Render function** (`({ size, color }) => <Check ... />`) — receives the component's resolved size and color.

To route string names to a different library app-wide (Lucide, Phosphor, SF Symbols, custom SVGs), pass an `iconResolver` to `ThemeProvider`. Pre-built adapters live in [`@rootnative/icons`](https://www.npmjs.com/package/@rootnative/icons) — see the [icons guide](https://rootnative.github.io/ui/icons).

## Docs

Full API reference: https://rootnative.github.io/ui/

LLM-optimized reference: https://rootnative.github.io/ui/llms-full.txt — or read `node_modules/@rootnative/components/llms.txt` for the exact installed version.

## License

MIT
