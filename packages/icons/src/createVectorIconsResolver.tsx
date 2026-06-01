import type { IconResolver, IconRenderProps } from '@rootnative/core'
import * as React from 'react'

/**
 * Structural shape of an `@expo/vector-icons` icon set component
 * (`MaterialCommunityIcons`, `Ionicons`, `FontAwesome`, …). Each set
 * accepts `name`, `size`, `color`, and forwards extra props to the
 * underlying glyph.
 */
export type VectorIconSet = React.ComponentType<{
  name: string
  size?: number
  color?: string
}>

export interface VectorIconsResolverOptions {
  /**
   * The icon set component, e.g. `MaterialCommunityIcons` or
   * `Ionicons`, imported from `@expo/vector-icons`.
   */
  IconSet: VectorIconSet
  /**
   * Optional name aliases applied before forwarding the name to the
   * icon set. Useful when remapping app-level "generic" names (e.g.
   * `'search'`) to the specific glyph the icon set ships (e.g.
   * `'magnify'` for MCI, `'search'` for Ionicons).
   */
  aliases?: Record<string, string>
}

/**
 * Build an `IconResolver` backed by an `@expo/vector-icons` icon set.
 *
 * Most apps don't need this — the default resolver already uses
 * `MaterialCommunityIcons` directly. Use this when you want to switch
 * the default set to `Ionicons`, `FontAwesome`, etc., or pre-register
 * a small alias map.
 *
 * @example
 * import { Ionicons } from '@expo/vector-icons'
 * import { createVectorIconsResolver } from '@rootnative/icons'
 *
 * const resolver = createVectorIconsResolver({
 *   IconSet: Ionicons,
 *   aliases: { check: 'checkmark', close: 'close' },
 * })
 *
 * <ThemeProvider iconResolver={resolver}>{children}</ThemeProvider>
 */
export function createVectorIconsResolver(
  options: VectorIconsResolverOptions,
): IconResolver {
  const { IconSet, aliases } = options

  return function vectorIconsResolver(
    name: string,
    props: IconRenderProps,
  ): React.ReactNode {
    const resolved = aliases?.[name] ?? name
    return <IconSet name={resolved} size={props.size} color={props.color} />
  }
}
