import type { IconResolver } from '@rootnative/core'
import * as React from 'react'
import { buildResolver } from './internal/buildResolver'
import { mdiToLucideAliases } from './mdi-aliases'

/**
 * Structural shape of a Lucide React Native icon component. Matches the
 * runtime contract of `lucide-react-native`'s `LucideIcon` without
 * importing the package, so this file type-checks even when Lucide is
 * not installed (it's an optional peer dep).
 */
export type LucideIconComponent = React.ComponentType<{
  size?: number
  color?: string
  strokeWidth?: number
  absoluteStrokeWidth?: boolean
}>

export interface LucideResolverOptions {
  /**
   * Map of icon names to Lucide components. Names should be the strings
   * you pass to component props like `leadingIcon="..."` — they don't
   * have to match Lucide's own naming, but using Lucide's kebab-case
   * slugs (e.g. `'arrow-right'`, `'circle-help'`) is the easy path.
   *
   * @example
   * import { Check, ArrowRight, Search } from 'lucide-react-native'
   *
   * createLucideResolver({
   *   icons: {
   *     check: Check,
   *     'arrow-right': ArrowRight,
   *     search: Search,
   *   },
   * })
   */
  icons: Record<string, LucideIconComponent>
  /**
   * When set, MDI legacy names (like `magnify` or `pencil`) are
   * rewritten to their Lucide equivalents before lookup. Useful when
   * migrating an existing MDI codebase to Lucide without touching every
   * call site.
   *
   * - `true` — use the built-in MDI→Lucide alias map.
   * - object — merge your own aliases on top of the built-in map. Set a
   *   value to `null` to suppress a built-in alias.
   * - omitted/`false` — no rewriting.
   */
  mdiCompat?: boolean | Record<string, string | null>
  /**
   * Default `strokeWidth` applied to every Lucide icon. Defaults to
   * Lucide's own default (2).
   */
  strokeWidth?: number
  /**
   * What to do when a name doesn't resolve.
   * - `'warn'` (default) — `console.warn` once per missing name and
   *   render nothing.
   * - `'silent'` — render nothing without warning.
   * - `IconResolver` — delegate to another resolver (e.g. an MCI
   *   resolver) so unknown names still render.
   */
  onMissing?: 'warn' | 'silent' | IconResolver
}

/**
 * Build an `IconResolver` backed by [Lucide](https://lucide.dev) icons.
 * Pass the result to `<ThemeProvider iconResolver={...}>` to route every
 * string icon name through Lucide.
 *
 * @example
 * import { ThemeProvider } from '@rootnative/core'
 * import { createLucideResolver } from '@rootnative/icons'
 * import { Check, Search, ArrowRight } from 'lucide-react-native'
 *
 * const resolver = createLucideResolver({
 *   icons: { check: Check, search: Search, 'arrow-right': ArrowRight },
 *   mdiCompat: true,
 * })
 *
 * <ThemeProvider iconResolver={resolver}>{children}</ThemeProvider>
 */
export function createLucideResolver(
  options: LucideResolverOptions,
): IconResolver {
  const { icons, strokeWidth, mdiCompat, onMissing = 'warn' } = options

  return buildResolver<LucideIconComponent>({
    libraryName: 'Lucide',
    warnPrefix: 'lucide',
    factoryName: 'createLucideResolver',
    icons,
    defaultMdiAliases: mdiToLucideAliases,
    mdiCompat,
    onMissing,
    render: (Icon, { size, color }) => (
      <Icon size={size} color={color} strokeWidth={strokeWidth} />
    ),
  })
}
