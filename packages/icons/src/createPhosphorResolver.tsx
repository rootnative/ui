import type { IconResolver } from '@rootnative/core'
import * as React from 'react'
import { buildResolver } from './internal/buildResolver'
import { mdiToPhosphorAliases } from './mdi-aliases'

export type PhosphorIconWeight =
  | 'thin'
  | 'light'
  | 'regular'
  | 'bold'
  | 'fill'
  | 'duotone'

/**
 * Structural shape of a Phosphor React Native icon component. Matches
 * the runtime contract of `phosphor-react-native` without importing the
 * package, so this file type-checks even when Phosphor is not installed
 * (it's an optional peer dep).
 */
export type PhosphorIconComponent = React.ComponentType<{
  size?: number
  color?: string
  weight?: PhosphorIconWeight
  mirrored?: boolean
}>

export interface PhosphorResolverOptions {
  /**
   * Map of icon names to Phosphor components. Keys are the strings you
   * pass to component props like `leadingIcon="..."`. Values are the
   * Phosphor icon components imported from `phosphor-react-native`.
   *
   * @example
   * import { Check, MagnifyingGlass, ArrowRight } from 'phosphor-react-native'
   *
   * createPhosphorResolver({
   *   icons: {
   *     Check,
   *     MagnifyingGlass,
   *     ArrowRight,
   *   },
   * })
   */
  icons: Record<string, PhosphorIconComponent>
  /**
   * Default Phosphor weight. Defaults to `'regular'` (Phosphor's own
   * default). Override per-call by registering icons under different
   * keys with explicit weights baked in.
   */
  weight?: PhosphorIconWeight
  /**
   * When set, MDI legacy names (like `magnify`, `pencil`,
   * `dots-vertical`) are rewritten to their PascalCase Phosphor
   * equivalents before lookup. Lets you keep existing MDI string names
   * after switching the resolver to Phosphor.
   *
   * - `true` — use the built-in MDI→Phosphor alias map.
   * - object — merge your own aliases on top of the built-in map. Set a
   *   value to `null` to suppress a built-in alias.
   * - omitted/`false` — no rewriting.
   */
  mdiCompat?: boolean | Record<string, string | null>
  /**
   * What to do when a name doesn't resolve.
   * - `'warn'` (default) — `console.warn` once per missing name and
   *   render nothing.
   * - `'silent'` — render nothing without warning.
   * - `IconResolver` — delegate to another resolver.
   */
  onMissing?: 'warn' | 'silent' | IconResolver
}

/**
 * Build an `IconResolver` backed by
 * [Phosphor](https://phosphoricons.com/) icons. Pass the result to
 * `<ThemeProvider iconResolver={...}>` to route every string icon name
 * through Phosphor.
 *
 * @example
 * import { ThemeProvider } from '@rootnative/core'
 * import { createPhosphorResolver } from '@rootnative/icons'
 * import { Check, MagnifyingGlass } from 'phosphor-react-native'
 *
 * const resolver = createPhosphorResolver({
 *   icons: { Check, MagnifyingGlass },
 *   weight: 'regular',
 *   mdiCompat: true,
 * })
 *
 * <ThemeProvider iconResolver={resolver}>{children}</ThemeProvider>
 */
export function createPhosphorResolver(
  options: PhosphorResolverOptions,
): IconResolver {
  const { icons, weight, mdiCompat, onMissing = 'warn' } = options

  return buildResolver<PhosphorIconComponent>({
    libraryName: 'Phosphor',
    warnPrefix: 'phosphor',
    factoryName: 'createPhosphorResolver',
    icons,
    defaultMdiAliases: mdiToPhosphorAliases,
    mdiCompat,
    onMissing,
    render: (Icon, { size, color }) => (
      <Icon size={size} color={color} weight={weight} />
    ),
  })
}
