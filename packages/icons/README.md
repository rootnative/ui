# @rootnative/icons

Icon-library adapters for [RootNative UI](https://github.com/rootnative/ui). Pre-built `iconResolver` factories that route string icon names (`leadingIcon="check"`) to the icon library of your choice — Lucide, Phosphor, any `@expo/vector-icons` set, or your own resolver.

## Install

```bash
pnpm add @rootnative/icons
```

Then install the icon library you actually use — each is an **optional** peer dependency, so nothing is pulled in until you pick one:

```bash
pnpm add lucide-react-native      # for createLucideResolver
pnpm add phosphor-react-native    # for createPhosphorResolver
pnpm add @expo/vector-icons       # for createVectorIconsResolver
```

## Adapters

| Helper | For |
|--------|-----|
| `createLucideResolver({ icons })` | [Lucide](https://lucide.dev) (`lucide-react-native`) |
| `createPhosphorResolver({ icons })` | [Phosphor](https://phosphoricons.com) (`phosphor-react-native`) |
| `createVectorIconsResolver({ IconSet })` | Any `@expo/vector-icons` set (`Ionicons`, `FontAwesome`, …) |
| `withLegacyMdiFallback(resolver)` | Wrap any custom resolver to add MDI-name compatibility |

Each adapter returns an `IconResolver` you pass straight to `ThemeProvider` from `@rootnative/core`.

## Quick start (Lucide)

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
  mdiCompat: true, // accept legacy MDI names like "magnify", "delete"
  strokeWidth: 1.75, // optional — Lucide default is 2
})

export default function App() {
  return (
    <ThemeProvider iconResolver={resolver}>
      {/* String icon names now render through Lucide */}
    </ThemeProvider>
  )
}
```

## Phosphor

```tsx
import { createPhosphorResolver } from '@rootnative/icons'
import { Check, MagnifyingGlass, ArrowRight } from 'phosphor-react-native'

const resolver = createPhosphorResolver({
  icons: { Check, MagnifyingGlass, ArrowRight },
  weight: 'regular', // 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
  mdiCompat: true,
})
```

## @expo/vector-icons

Use a different vector-icon set than the default `MaterialCommunityIcons`, with an optional alias map:

```tsx
import { Ionicons } from '@expo/vector-icons'
import { createVectorIconsResolver } from '@rootnative/icons'

const resolver = createVectorIconsResolver({
  IconSet: Ionicons,
  aliases: {
    check: 'checkmark',
    'arrow-right': 'arrow-forward',
  },
})
```

Names you don't alias are forwarded to the icon set verbatim.

## MDI compatibility

`mdiCompat: true` enables a curated alias map so legacy [MaterialCommunityIcons](https://pictogrammers.com/library/mdi/) names keep working after switching libraries (`magnify` → `search`, `delete` → `trash-2`, `dots-vertical` → `more-vertical`, …). Pass an object to extend or suppress entries:

```tsx
mdiCompat: { magnify: 'binoculars', pencil: null }
```

For hand-rolled resolvers (SF Symbols, custom SVGs), wrap with `withLegacyMdiFallback` to get the same alias behavior:

```tsx
import { withLegacyMdiFallback } from '@rootnative/icons'

const resolver = withLegacyMdiFallback(myResolver, { target: 'lucide' })
```

The base resolver is always tried first; the alias map is only consulted when it returns `null`.

## Missing icons

When a name isn't found, the resolver `console.warn`s once per missing name. Override with `onMissing: 'silent'` to mute, or pass another `IconResolver` to chain as a fallback.

Note: some components render system icons of their own (`Checkbox` uses `check`; `Chip` uses `check` and `close`). Map those names in your resolver, or the built-in `mdiCompat` map covers them.

## Exports

- `createLucideResolver` / `LucideIconComponent` / `LucideResolverOptions`
- `createPhosphorResolver` / `PhosphorIconComponent` / `PhosphorIconWeight` / `PhosphorResolverOptions`
- `createVectorIconsResolver` / `VectorIconSet` / `VectorIconsResolverOptions`
- `withLegacyMdiFallback` / `LegacyMdiTarget` / `WithLegacyMdiFallbackOptions`
- `mdiToLucideAliases` / `mdiToPhosphorAliases` — the raw alias maps
- `IconResolver` / `IconRenderProps` — re-exported from `@rootnative/core` for convenience

## Docs

Full guide (per-call icons, SF Symbols, custom SVGs): https://rootnative.github.io/ui/icons

LLM-optimized reference: https://rootnative.github.io/ui/llms-full.txt — or read `node_modules/@rootnative/icons/llms.txt` for the exact installed version.

## License

MIT
