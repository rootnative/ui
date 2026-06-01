import type { IconResolver, IconRenderProps } from '@rootnative/core'
import { mdiToLucideAliases, mdiToPhosphorAliases } from './mdi-aliases'
import { warnOnce } from './warn'

export type LegacyMdiTarget = 'lucide' | 'phosphor' | Record<string, string>

export interface WithLegacyMdiFallbackOptions {
  /**
   * Which alias map to use as the legacy MDI rewrite source.
   * - `'lucide'` — built-in MDI→Lucide map.
   * - `'phosphor'` — built-in MDI→Phosphor map.
   * - object — your own MDI→target map.
   *
   * @default 'lucide'
   */
  target?: LegacyMdiTarget
  /**
   * When `true` (default), emit a one-time `console.warn` per legacy
   * MDI name that gets rewritten, so you know which call sites still
   * need to be migrated.
   */
  warn?: boolean
}

const builtInTargets: Record<'lucide' | 'phosphor', Record<string, string>> = {
  lucide: mdiToLucideAliases,
  phosphor: mdiToPhosphorAliases,
}

/**
 * Wrap an `IconResolver` so that string names which look like legacy
 * MaterialCommunityIcons identifiers (e.g. `magnify`, `pencil`,
 * `dots-vertical`) get rewritten to the new resolver's vocabulary
 * before lookup.
 *
 * The base resolver is always tried first with the original name. The
 * MDI alias map is only consulted when the base resolver returns
 * `null`/`undefined`, so you never override an explicit registration.
 *
 * Use this when you have a hand-rolled resolver and want MDI-name
 * compatibility without hard-coding the alias logic yourself. The
 * built-in `createLucideResolver` / `createPhosphorResolver` already
 * accept an `mdiCompat` option that does the same thing inline — reach
 * for `withLegacyMdiFallback` for custom resolvers (SF Symbols, SVG
 * sprite sheets, etc.).
 *
 * @example
 * import { ThemeProvider } from '@rootnative/core'
 * import { withLegacyMdiFallback } from '@rootnative/icons'
 *
 * const baseResolver = (name, { size, color }) => {
 *   const Icon = mySvgIcons[name]
 *   return Icon ? <Icon width={size} height={size} fill={color} /> : null
 * }
 *
 * const resolver = withLegacyMdiFallback(baseResolver, {
 *   target: { magnify: 'search', pencil: 'edit', delete: 'trash' },
 * })
 *
 * <ThemeProvider iconResolver={resolver}>{children}</ThemeProvider>
 */
export function withLegacyMdiFallback(
  base: IconResolver,
  options: WithLegacyMdiFallbackOptions = {},
): IconResolver {
  const { target = 'lucide', warn = true } = options
  const aliasMap = typeof target === 'string' ? builtInTargets[target] : target

  return function withLegacyMdiFallbackResolver(
    name: string,
    props: IconRenderProps,
  ) {
    const direct = base(name, props)
    if (direct != null && direct !== false) return direct

    const aliased = aliasMap[name]
    if (!aliased) return null

    if (warn) {
      warnOnce(
        `mdi-fallback:${name}`,
        `[@rootnative/icons] Rewriting legacy MaterialCommunityIcons name "${name}" → "${aliased}". ` +
          `Update the call site to use "${aliased}" directly to silence this warning.`,
      )
    }

    return base(aliased, props)
  }
}
