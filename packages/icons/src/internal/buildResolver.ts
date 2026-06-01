import type { IconResolver, IconRenderProps } from '@rootnative/core'
import type { ReactNode } from 'react'
import { warnOnce } from '../warn'

export type MdiCompatOption =
  | boolean
  | Record<string, string | null>
  | undefined

export type OnMissingOption = 'warn' | 'silent' | IconResolver

export interface BuildResolverConfig<TIcon> {
  /**
   * Human-readable library name, used in the missing-name warning so
   * the developer knows which adapter fired.
   */
  libraryName: string
  /**
   * Stable prefix used for the per-name `warnOnce` key. Different
   * adapters must use different prefixes so the same icon name can warn
   * separately for each library wired up in the same app.
   */
  warnPrefix: string
  /**
   * Map of names registered by the consumer.
   */
  icons: Record<string, TIcon>
  /**
   * Built-in MDI→library alias map for this adapter. Consulted only
   * when the consumer sets `mdiCompat`.
   */
  defaultMdiAliases: Readonly<Record<string, string>>
  /**
   * Consumer's `mdiCompat` setting. `true` enables the built-in map;
   * an object merges/overrides entries (set to `null` to suppress).
   */
  mdiCompat: MdiCompatOption
  /**
   * Consumer's `onMissing` setting. Defaults to `'warn'` at the public
   * adapter boundary — pass through whatever the user chose.
   */
  onMissing: OnMissingOption
  /**
   * Render the matched icon component with the resolved size/color.
   * Library-specific extras (Lucide's `strokeWidth`, Phosphor's
   * `weight`) are closed over by the adapter that calls
   * `buildResolver`.
   */
  render: (Icon: TIcon, props: IconRenderProps) => ReactNode
  /**
   * Hint shown in the missing-name warning, e.g.
   * `'createLucideResolver'`. Helps the developer find the call site
   * that needs the missing icon registered.
   */
  factoryName: string
}

function buildAliasMap(
  defaults: Readonly<Record<string, string>>,
  override: MdiCompatOption,
): Record<string, string> | null {
  if (!override) return null
  if (override === true) return { ...defaults }
  const merged: Record<string, string> = { ...defaults }
  for (const [key, value] of Object.entries(override)) {
    if (value === null) {
      delete merged[key]
    } else {
      merged[key] = value
    }
  }
  return merged
}

/**
 * Shared core for icon-library adapters. Handles:
 *
 * 1. Direct lookup in the consumer's `icons` map.
 * 2. MDI legacy-name rewriting via the built-in alias map (or a merged
 *    override).
 * 3. Missing-name policy — warn-once / silent / delegate.
 *
 * Each adapter (`createLucideResolver`, `createPhosphorResolver`, …)
 * supplies its own typed options surface and a `render` closure that
 * captures library-specific knobs like `strokeWidth` or `weight`. Only
 * this file knows about alias-merging and the missing-name switch.
 */
export function buildResolver<TIcon>(
  config: BuildResolverConfig<TIcon>,
): IconResolver {
  const {
    libraryName,
    warnPrefix,
    icons,
    defaultMdiAliases,
    mdiCompat,
    onMissing,
    render,
    factoryName,
  } = config

  const aliases = buildAliasMap(defaultMdiAliases, mdiCompat)

  return function resolver(name: string, props: IconRenderProps): ReactNode {
    let Icon = icons[name]
    if (!Icon && aliases) {
      const alias = aliases[name]
      if (alias) Icon = icons[alias]
    }

    if (Icon) return render(Icon, props)

    if (typeof onMissing === 'function') {
      return onMissing(name, props)
    }
    if (onMissing === 'warn') {
      warnOnce(
        `${warnPrefix}:${name}`,
        `[@rootnative/icons] No ${libraryName} icon registered for "${name}". ` +
          `Add it to the \`icons\` map passed to ${factoryName}(), ` +
          `or set \`mdiCompat: true\` if "${name}" is a legacy MaterialCommunityIcons name.`,
      )
    }
    return null
  }
}
