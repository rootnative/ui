---
sidebar_position: 7
---

# Icons

RootNative components accept icons in three forms — a string name, a pre-rendered React element, or a render function. By default, string names resolve through `@expo/vector-icons/MaterialCommunityIcons`, but you can plug in **any** icon library (Lucide, SF Symbols, custom SVGs) globally via the theme's `iconResolver`, or per-call by passing an element/function.

This makes the library design-system agnostic: an Apple HIG app can use SF Symbols, a brand-driven app can ship custom SVGs, and an MD3 app gets MaterialCommunityIcons out of the box without any extra setup.

## The `IconSource` type

Every icon prop on every component (`leadingIcon`, `trailingIcon`, `icon`, `selectedIcon`, …) accepts an `IconSource`:

```ts
import type { IconSource } from '@rootnative/utils'

type IconSource =
  | string                                    // resolved via iconResolver (MCI by default)
  | ReactElement                              // pre-rendered icon — caller sizes/colors it
  | ((props: { size: number; color?: string }) => ReactNode) // render function
```

Pick the form that matches your situation:

| Form | When to use |
|------|-------------|
| **String** (`"check"`) | You're using MCI, or you've configured a global `iconResolver` that maps names. Easiest, theme-aware. |
| **ReactElement** (`<Check size={18} color="#fff" />`) | One-off icon from any library. You pass size and color yourself. |
| **Render function** (`({ size, color }) => <Check {...} />`) | Reusable wrapper that needs the component's resolved size and color. |

## Default — MaterialCommunityIcons

With no resolver configured, string names resolve to MaterialCommunityIcons. This is the zero-config path — install `@expo/vector-icons` and pass any [MCI name](https://pictogrammers.com/library/mdi/):

```tsx
import { Button, IconButton } from '@rootnative/components'

<Button leadingIcon="plus">Add</Button>
<IconButton icon="heart-outline" accessibilityLabel="Favorite" />
```

`@expo/vector-icons` is only required if you actually pass a string icon. The library imports it lazily — components render fine without it as long as you don't pass string icons.

## Per-call: pass any icon as a ReactElement

You don't need to configure anything to use a different icon library — just pass the element directly:

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

You're responsible for the size and color in this form — the component won't override what you pass.

## Per-call: pass a render function for theme-aware icons

If you want the icon to receive the **component's resolved size and color** (so it picks up `iconSize`, `contentColor`, disabled state, variant defaults, etc.), pass a function:

```tsx
import { Button } from '@rootnative/components'
import { Check } from 'lucide-react-native'

<Button leadingIcon={({ size, color }) => <Check size={size} color={color} />}>
  Save
</Button>
```

This is the form to use when you want consistent sizing/coloring without hard-coding values.

> **Note on component references.** Don't pass an icon component reference directly (`leadingIcon={Check}`) — wrap it in a function. The component reference would be called as a plain function, which bypasses React's hook rules.

## Global: configure an `iconResolver`

If you'd rather keep using string names but route them to a different library, register a resolver on `ThemeProvider`. This is the cleanest approach when one icon library powers your whole app.

You have two paths:

1. **Use a built-in adapter from `@rootnative/icons`.** Recommended for Lucide, Phosphor, and `@expo/vector-icons` — handles sizing, coloring, MDI-name compatibility, and missing-icon warnings for you.
2. **Hand-roll a resolver.** A plain `(name, { size, color }) => ReactNode` function. Use this for SF Symbols, custom SVG sprites, or any other source.

### Library adapters: `@rootnative/icons`

`@rootnative/icons` ships pre-built resolver factories so you don't have to figure out the resolver shape yourself:

```bash
npm install @rootnative/icons
```

| Helper | For |
|--------|-----|
| `createLucideResolver({ icons })` | [Lucide](https://lucide.dev) (`lucide-react-native`) |
| `createPhosphorResolver({ icons })` | [Phosphor](https://phosphoricons.com) (`phosphor-react-native`) |
| `createVectorIconsResolver({ IconSet })` | Any `@expo/vector-icons` set (`Ionicons`, `FontAwesome`, …) |
| `withLegacyMdiFallback(resolver)` | Wrap any custom resolver to add MDI-name compatibility |

Each adapter accepts the icons it can render and returns an `IconResolver` you pass straight to `ThemeProvider`. Lucide and Phosphor adapters declare `lucide-react-native` / `phosphor-react-native` as **optional** peer deps — install only the one you actually use.

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

`mdiCompat: true` enables a built-in alias map so `magnify` → `search`, `pencil` → `pencil`, `delete` → `trash-2`, `dots-vertical` → `more-vertical`, etc. — useful when migrating an MDI codebase to Lucide without rewriting every call site. You can also pass an object to extend or suppress entries (`mdiCompat: { magnify: 'binoculars', pencil: null }`).

When a name isn't found, the resolver `console.warn`s once per missing name. Override with `onMissing: 'silent'` to mute, or pass another `IconResolver` to chain.

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

Phosphor exports each glyph in PascalCase (e.g. `MagnifyingGlass`, `DotsThreeVertical`). The built-in MDI map maps `magnify` → `MagnifyingGlass`, `dots-vertical` → `DotsThreeVertical`, `delete` → `Trash`, etc.

#### `@expo/vector-icons`

Use this when you want a different vector-icon set than the default `MaterialCommunityIcons`, or when you want to register a small alias map at the resolver level:

```tsx
import { Ionicons } from '@expo/vector-icons'
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

Names you don't alias are forwarded to the icon set verbatim — the set itself decides what to render for unknown glyphs.

#### Custom resolver + MDI compatibility

If you're rolling your own resolver (SF Symbols, SVG sprites, hand-rolled mappings), wrap it with `withLegacyMdiFallback` to add MDI-name compatibility without re-implementing the alias logic:

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

The base resolver is always tried first with the original name; the alias map is only consulted when the base returns `null`. The first call with each legacy name emits a one-time `console.warn` so you know which call sites still need to be migrated. Pass `warn: false` to suppress.

### Manual resolver (no adapter)

You can skip the adapter and write the resolver inline. The shape is just `(name, { size, color }) => ReactNode`:

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

Now any string name passed to a component flows through your resolver:

```tsx
<Button leadingIcon="check">Save</Button>
<IconButton icon="heart" accessibilityLabel="Like" />
```

You can return `null` from the resolver to render nothing for unknown names, or fall back to a default icon.

### SF Symbols on iOS (Apple HIG)

For Apple HIG-style apps, pair the resolver with [`expo-symbols`](https://docs.expo.dev/versions/latest/sdk/symbols/):

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

`SymbolView` only renders on iOS — wrap the resolver in a platform check or a fallback library if you target Android/web too.

### Custom SVGs

Same pattern with `react-native-svg`:

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

Per-call elements and functions always take precedence over the resolver — you can register a resolver for the common case and still drop in one-off icons:

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

A few components render system icons of their own (for example, the checkmark inside a `Checkbox`, or the close button on an input `Chip`). Those names also flow through the configured `iconResolver`, so a Lucide-only resolver that doesn't map them will leave those icons missing.

The system names that components rely on:

| Component | System icon names |
|-----------|-------------------|
| `Checkbox` | `check` |
| `Chip` | `check` (filter, when selected), `close` (close button) |

You have two ways to handle this when adopting a custom resolver:

1. **Map the system names in your resolver.** Just include `check`, `close`, etc. alongside your other mappings — easiest path.
2. **Override per-component** with an explicit `IconSource`. `Checkbox` exposes a `checkIcon?: IconSource` prop for this:

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

Each component decides its own default icon size based on its variant or size prop. The values passed to your resolver / render function come from:

| Component | Source of `size` | Source of `color` |
|-----------|------------------|-------------------|
| `Button` | `iconSize` prop (default 18) | Resolved label color (variant default → `contentColor` → disabled treatment) |
| `IconButton` | Derived from `size` prop — small: 18, medium: 24, large: 28 | Variant + state default → `iconColor` → `contentColor` |

The `color` may be `undefined` when the component lets the icon library inherit from a parent text style — handle that in your resolver by passing it through unchanged, since most icon libraries treat `undefined` as "use the default".

## TypeScript

Types live in `@rootnative/core` (the resolver) and `@rootnative/utils` (`IconSource`):

```ts
import type { IconResolver, IconRenderProps } from '@rootnative/core'
import type { IconSource } from '@rootnative/utils'
```

`@rootnative/icons` re-exports `IconResolver` and `IconRenderProps` for convenience, plus its own helper types:

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
