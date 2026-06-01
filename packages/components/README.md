# @rootnative/components

Material Design 3 UI components for React Native, part of [RootNative UI](https://github.com/rootnative/ui).

## Install

```bash
pnpm add @rootnative/core @rootnative/components react-native-safe-area-context react-native-reanimated
```

**Optional** — only needed if you plan to use icons in your app:

```bash
pnpm add @expo/vector-icons
```

> `react-native-reanimated` powers state-layer transitions and gesture-driven components (Slider, Switch). Required for any interactive component; static components (Typography, Layout, Avatar) work without it. With Expo SDK 54 it's also already available in Expo Go.

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
| AppBar | `./appbar` | small, center-aligned, medium, large |
| Card | `./card` | elevated, filled, outlined |
| Chip | `./chip` | assist, filter, input, suggestion |
| Checkbox | `./checkbox` | — |
| Radio | `./radio` | — |
| Switch | `./switch` | — |
| TextField | `./text-field` | filled, outlined |
| Layout | `./layout` | Layout, Box, Row, Column, Grid |
| List | `./list` | List, ListItem, ListDivider |

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

All icon props accept [MaterialCommunityIcons](https://pictogrammers.com/library/mdi/) names from `@expo/vector-icons`.

## Docs

Full API reference: https://rootnative.github.io/ui/

LLM-optimized reference: https://rootnative.github.io/ui/llms-full.txt

## License

MIT
