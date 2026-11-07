---
sidebar_position: 7
description: Pass icons as a string name, a React element, or a render function — and plug in any icon library globally.
---

# Icons

Root Native components accept an icon in three forms: a string name, a pre-rendered React element, or a render function. A string name resolves through the `iconResolver` of the theme. Pass `mdiResolver` from `@rootnative/components/mdi` for MaterialDesignIcons, or plug in **any** icon library (Lucide, SF Symbols, custom SVGs) with the same prop. For one call, pass an element or a function instead.

This makes the library independent of the design system. An Apple HIG app can use SF Symbols, a brand-driven app can ship custom SVGs, and an MD3 app gets MaterialDesignIcons with one prop.

## The `IconSource` type

Every icon prop on every component (`leadingIcon`, `trailingIcon`, `icon`, `selectedIcon`, …) accepts an `IconSource`:

```ts
import type { IconSource } from '@rootnative/core'

type IconSource =
  | string                                    // resolved via the theme's iconResolver (e.g. mdiResolver)
  | ReactElement                              // pre-rendered icon — caller sizes/colors it
  | ((props: { size: number; color?: string }) => ReactNode) // render function
```

Pick the form that matches your situation:

| Form | When to use |
|------|-------------|
| **String** (`"check"`) | You pass `mdiResolver`, or your own global `iconResolver` that maps names. The easiest form, and theme-aware. |
| **ReactElement** (`<Check size={18} color="#fff" />`) | A one-off icon from any library. You pass the size and the color yourself. |
| **Render function** (`({ size, color }) => <Check {...} />`) | A reusable wrapper that needs the resolved size and color of the component. |

## MaterialDesignIcons — `mdiResolver`

Install `@react-native-vector-icons/material-design-icons` (and `expo-font` on Expo), and pass `mdiResolver` to `ThemeProvider`. Then every string icon name resolves to an [MDI glyph](https://pictogrammers.com/library/mdi/):

```tsx
import { Button, IconButton } from '@rootnative/components'
import { mdiResolver } from '@rootnative/components/mdi'
import { ThemeProvider } from '@rootnative/core'

<ThemeProvider iconResolver={mdiResolver}>
  <Button leadingIcon="plus">Add</Button>
  <IconButton icon="heart-outline" accessibilityLabel="Favorite" />
</ThemeProvider>
```

`@rootnative/components/mdi` is the only module in the library that imports `@react-native-vector-icons/material-design-icons`, and the root entry never loads it. So the package is an optional peer. An app that passes another resolver, or no string icon names, doesn't install it, and a bundler without Expo needs no alias for it.

The package is the one Expo recommends in place of `@expo/vector-icons` ([Expo blog](https://expo.dev/blog/moving-away-from-expo-vector-icons)). The root import loads the font at run time through `expo-font`, which works in Expo Go, in a development build and on web. A development build can embed the font instead: pass the `/static` export to `createVectorIconsResolver` from `@rootnative/icons`, and add the package to the `plugins` array of `app.json`. Don't keep `@expo/vector-icons` installed next to it: both register the same font, and the glyphs render as `?` or as empty squares. `npx @react-native-vector-icons/codemod` rewrites app code that still imports the old package.

```tsx
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static'
import { createVectorIconsResolver } from '@rootnative/icons'

const resolver = createVectorIconsResolver({ IconSet: MaterialDesignIcons })
```

Without a resolver, a string icon name renders nothing, and the library logs one warning per process that names this subpath. The library ships no default in the shared code on purpose, because a static import there would reach every app.

## Per-call: pass any icon as a ReactElement

You need no configuration to use a different icon library. Pass the element directly:

```tsx
import { Button } from '@rootnative/components'
import { Check, ArrowRight } from 'lucide-react-native'

<Button leadingIcon={<Check size={18} color="#fff" />}>
  Save
</Button>

<Button trailingIcon={<ArrowRight size={18} color="#fff" />}>
  Continue
</Button>
```

In this form you set the size and the color. The component won't override what you pass.

## Per-call: pass a render function for theme-aware icons

If you want the icon to receive the **resolved size and color of the component** (so it picks up `iconSize`, `contentColor`, the disabled state, the variant defaults, and so on), pass a function:

```tsx
import { Button } from '@rootnative/components'
import { Check } from 'lucide-react-native'

<Button leadingIcon={({ size, color }) => <Check size={size} color={color} />}>
  Save
</Button>
```

Use this form when you want a consistent size and color without hard-coded values.

> **Note on component references.** Don't pass an icon component reference directly (`leadingIcon={Check}`). Wrap it in a function. The library would call the component reference as a plain function, and that bypasses the hook rules of React.

## Global: configure an `iconResolver`

If you want to keep string names, but route them to a different library, register a resolver on `ThemeProvider`. This is the cleanest way when one icon library powers your whole app.

You have two paths:

1. **Use a built-in adapter from `@rootnative/icons`.** Recommended for Lucide, Phosphor, and `@react-native-vector-icons/*`. It handles the size, the color, the MDI-name compatibility, and the missing-icon warnings for you.
2. **Write your own resolver.** A plain `(name, { size, color }) => ReactNode` function. Use this for SF Symbols, custom SVG sprites, or any other source.

### Library adapters: `@rootnative/icons`

`@rootnative/icons` ships pre-built resolver factories, so you don't have to work out the resolver shape yourself:

```bash
npm install @rootnative/icons
```

| Helper | For |
|--------|-----|
| `createLucideResolver({ icons })` | [Lucide](https://lucide.dev) (`lucide-react-native`) |
| `createPhosphorResolver({ icons })` | [Phosphor](https://phosphoricons.com) (`phosphor-react-native`) |
| `createVectorIconsResolver({ IconSet })` | Any `@react-native-vector-icons/*` set (`Ionicons`, `FontAwesome7`, …), or the MDI `/static` export |
| `withLegacyMdiFallback(resolver)` | Wrap any custom resolver to add MDI-name compatibility |

Each adapter accepts the icons it can render and returns an `IconResolver` that you pass straight to `ThemeProvider`. The Lucide and Phosphor adapters declare `lucide-react-native` / `phosphor-react-native` as **optional** peer deps. Install only the one you use.

#### Lucide

```tsx
import { ThemeProvider } from '@rootnative/core'
import { createLucideResolver } from '@rootnative/icons'
import { Check, Search, ArrowRight, Heart } from 'lucide-react-native'

const resolver = createLucideResolver({
  icons: {
    check: Check,
    search: Search,
    'arrow-right': ArrowRight,
    heart: Heart,
  },
  mdiCompat: true,        // accept legacy MDI names like "magnify", "delete"
  strokeWidth: 1.75,      // optional — Lucide default is 2
})

export default function App() {
  return (
    <ThemeProvider iconResolver={resolver}>
      {/* String names render through Lucide */}
    </ThemeProvider>
  )
}
```

`mdiCompat: true` enables a built-in alias map: `magnify` → `search`, `pencil` → `pencil`, `delete` → `trash-2`, `dots-vertical` → `more-vertical`, and so on. It helps when you move an MDI codebase to Lucide without a rewrite of every call site. You can also pass an object to extend or remove entries (`mdiCompat: { magnify: 'binoculars', pencil: null }`).

When the resolver can't find a name, it calls `console.warn` once per missing name. Pass `onMissing: 'silent'` to mute it, or pass another `IconResolver` to chain.

#### Phosphor

```tsx
import { ThemeProvider } from '@rootnative/core'
import { createPhosphorResolver } from '@rootnative/icons'
import { Check, MagnifyingGlass, ArrowRight } from 'phosphor-react-native'

const resolver = createPhosphorResolver({
  icons: { Check, MagnifyingGlass, ArrowRight },
  weight: 'regular',     // 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
  mdiCompat: true,       // legacy MDI names → PascalCase Phosphor names
})

<ThemeProvider iconResolver={resolver}>{children}</ThemeProvider>
```

Phosphor exports each glyph in PascalCase (for example `MagnifyingGlass`, `DotsThreeVertical`). The built-in MDI map maps `magnify` → `MagnifyingGlass`, `dots-vertical` → `DotsThreeVertical`, `delete` → `Trash`, and so on.

#### `@react-native-vector-icons/*`

Use this adapter for a vector-icon set other than `mdiResolver`, or to register a small alias map at the resolver level. Don't pass an `@expo/vector-icons` set. Expo is retiring that package, and its sets are classes, so TypeScript rejects them as `IconSet` (TS2322). Use the `@react-native-vector-icons/*` package of the same icon family:

```tsx
import { Ionicons } from '@react-native-vector-icons/ionicons'
import { createVectorIconsResolver } from '@rootnative/icons'

const resolver = createVectorIconsResolver({
  IconSet: Ionicons,
  aliases: {
    check: 'checkmark',
    close: 'close',
    'arrow-right': 'arrow-forward',
  },
})
```

The adapter forwards a name that you don't alias to the icon set as is. The set itself decides what to render for an unknown glyph.

#### Custom resolver + MDI compatibility

If you write your own resolver (SF Symbols, SVG sprites, your own mappings), wrap it with `withLegacyMdiFallback` to add MDI-name compatibility without your own alias logic:

```tsx
import { withLegacyMdiFallback } from '@rootnative/icons'

const baseResolver: IconResolver = (name, { size, color }) => {
  const Svg = mySvgIcons[name]
  return Svg ? <Svg width={size} height={size} fill={color} /> : null
}

// Pass-through unknown names through the lucide-flavored MDI map.
// `target` can also be 'phosphor' or your own Record<string, string>.
const resolver = withLegacyMdiFallback(baseResolver, { target: 'lucide' })
```

The wrapper always tries the base resolver first, with the original name. It reads the alias map only when the base returns `null`. The first call with each legacy name logs one `console.warn`, so you know which call sites you still need to move. Pass `warn: false` to mute it.

The maps behind `target` are exported too, as plain `Readonly<Record<string, string>>` objects: `mdiToLucideAliases` and `mdiToPhosphorAliases` from `@rootnative/icons`. Read them to check whether a name is covered before you rely on it, or to build a variation:

```tsx
import { mdiToLucideAliases } from '@rootnative/icons'

mdiToLucideAliases.magnify // 'search'
mdiToLucideAliases.close // 'x'

// Same policy, one entry changed.
const resolver = withLegacyMdiFallback(baseResolver, {
  target: { ...mdiToLucideAliases, magnify: 'binoculars' },
})
```

Both maps are small and hand-curated on purpose: the names that turn up in real use, plus [the system icons of the library](#components-that-use-string-icons-internally). They are not a complete MDI index. A name that isn't in the map isn't a bug. Extend the map for it.

### Manual resolver (no adapter)

You can skip the adapter and write the resolver inline. The shape is `(name, { size, color }) => ReactNode`:

```tsx
import { ThemeProvider } from '@rootnative/core'
import type { IconResolver } from '@rootnative/core'
import { Check, Plus, ArrowRight, Heart, HeartOff } from 'lucide-react-native'

const icons: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  check: Check,
  plus: Plus,
  'arrow-right': ArrowRight,
  heart: Heart,
  'heart-outline': HeartOff,
}

const lucideResolver: IconResolver = (name, { size, color }) => {
  const Icon = icons[name]
  return Icon ? <Icon size={size} color={color} /> : null
}

<ThemeProvider iconResolver={lucideResolver}>{children}</ThemeProvider>
```

Now every string name that you pass to a component flows through your resolver:

```tsx
<Button leadingIcon="check">Save</Button>
<IconButton icon="heart" accessibilityLabel="Like" />
```

Return `null` from the resolver to render nothing for an unknown name, or fall back to a default icon.

### `useIconResolver` — read the resolver in your own components

A component you write can accept string icon names the same way the library components do. `useIconResolver()` returns the resolver registered on the nearest `ThemeProvider`, or `null` when there is none:

```tsx
import { useIconResolver, useTheme } from '@rootnative/core'
import { Row } from '@rootnative/components/layout'
import { Typography } from '@rootnative/components/typography'

function Badge({ icon, label }: { icon: string; label: string }) {
  const theme = useTheme()
  const iconResolver = useIconResolver()

  return (
    <Row align="center" gap="xs">
      {iconResolver?.(icon, { size: 16, color: theme.colors.onSurface })}
      <Typography variant="labelSmall">{label}</Typography>
    </Row>
  )
}
```

`null` means "no resolver configured". That is a real state, not an error. The library components render nothing for a string name in that state, and log one warning. Decide what your component does: render nothing the same way, or require a resolver. A resolver can also return `null` for a name it doesn't know, so handle both.

### SF Symbols on iOS (Apple HIG)

For an Apple HIG-style app, pair the resolver with [`expo-symbols`](https://docs.expo.dev/versions/latest/sdk/symbols/):

```tsx
import { ThemeProvider } from '@rootnative/core'
import type { IconResolver } from '@rootnative/core'
import { SymbolView } from 'expo-symbols'

const symbolMap: Record<string, string> = {
  check: 'checkmark',
  plus: 'plus',
  'arrow-right': 'arrow.right',
  heart: 'heart.fill',
  'heart-outline': 'heart',
}

const sfResolver: IconResolver = (name, { size, color }) => {
  const symbol = symbolMap[name]
  if (!symbol) return null
  return (
    <SymbolView
      name={symbol}
      size={size}
      tintColor={color}
      resizeMode="scaleAspectFit"
    />
  )
}

<ThemeProvider iconResolver={sfResolver}>
  {/* String names render as SF Symbols on iOS */}
</ThemeProvider>
```

`SymbolView` renders only on iOS. If you also target Android or web, wrap the resolver in a platform check, or add a fallback library.

### Custom SVGs

The same pattern works with `react-native-svg`:

```tsx
import { ThemeProvider } from '@rootnative/core'
import type { IconResolver } from '@rootnative/core'
import { CheckSvg, PlusSvg } from './my-icons'

const svgResolver: IconResolver = (name, { size, color }) => {
  if (name === 'check') return <CheckSvg width={size} height={size} fill={color} />
  if (name === 'plus') return <PlusSvg width={size} height={size} fill={color} />
  return null
}

<ThemeProvider iconResolver={svgResolver}>
  {/* String names render your SVGs */}
</ThemeProvider>
```

## Mixing forms

A per-call element or function always wins over the resolver. You can register a resolver for the common case and still pass a one-off icon:

```tsx
<ThemeProvider iconResolver={lucideResolver}>
  {/* Uses the resolver */}
  <Button leadingIcon="check">Save</Button>

  {/* Bypasses the resolver — explicit element wins */}
  <Button leadingIcon={<CustomBrandLogo size={18} />}>
    Branded action
  </Button>
</ThemeProvider>
```

## Components that use string icons internally

A few components render system icons of their own (for example, the check mark inside a `Checkbox`, or the close button on an input `Chip`). Those names also flow through the configured `iconResolver`. A Lucide-only resolver that doesn't map them leaves those icons missing.

The system names that the components use:

| Component | System icon names | Rendered when | Override prop |
|-----------|-------------------|---------------|---------------|
| `AppBar` | `chevron-left` / `chevron-right` on iOS, `arrow-left` / `arrow-right` elsewhere | `canGoBack` | — |
| `Checkbox` | `check` | Always (the mark) | `checkIcon` |
| `Chip` | `check`, `close` | `variant="filter"` and selected; `onClose` given | — |
| `Dialog` | `close` | `variant="fullscreen"` | `closeIcon` |
| `Snackbar` | `close` | `showCloseIcon` on the entry | `closeIcon` on the entry |

The AppBar pair mirrors under RTL and splits by platform. A resolver that maps only what you saw on one device still loses the back arrow on the other. Map all four.

You have two ways to handle this when you adopt a custom resolver:

1. **Map the system names in your resolver.** Include `check`, `close` and the back-arrow set next to your other mappings. This is the easiest path, and the [`mdiCompat` alias maps](#lucide) already carry all six.
2. **Override per component** with an explicit `IconSource`, where the component offers a prop for it (the right-hand column above). `Checkbox` exposes `checkIcon?: IconSource`:

```tsx
import { Checkbox } from '@rootnative/components'
import { Check } from 'lucide-react-native'

<Checkbox
  value={checked}
  checkIcon={({ size, color }) => <Check size={size} color={color} />}
  onValueChange={setChecked}
/>
```

## Sizing and color reference

Each component decides its own default icon size from its variant or its size prop. The general rule holds across the library. `size` comes from an explicit `iconSize` prop where one exists. Otherwise the component derives it from its `size` or its variant. `color` is what the component resolved for its content: the variant default, then `contentColor` (or a narrower icon-color prop where the component has one), then the disabled treatment, which nothing overrides. See the page of each component for its numbers.

Two worked examples, not a complete list:

| Component | Source of `size` | Source of `color` |
|-----------|------------------|-------------------|
| `Button` | `iconSize` prop (default 18) | Resolved label color (variant default → `contentColor` → disabled treatment) |
| `IconButton` | Derived from `size` prop — small: 18, medium: 24, large: 28 | Variant + state default → `iconColor` → `contentColor` |

The `color` can be `undefined` when the component lets the icon library inherit from a parent text style. Pass it through unchanged in your resolver. Most icon libraries treat `undefined` as "use the default".

## TypeScript

All three types live in `@rootnative/core`:

```ts
import type { IconResolver, IconRenderProps, IconSource } from '@rootnative/core'
```

`@rootnative/icons` also exports `IconResolver` and `IconRenderProps`, plus its own helper types:

```ts
import type {
  LucideResolverOptions,
  PhosphorResolverOptions,
  PhosphorIconWeight,
  VectorIconsResolverOptions,
  WithLegacyMdiFallbackOptions,
} from '@rootnative/icons'
```

Use these when you build wrapper components or shared resolvers.
