import type { IconResolver, IconRenderProps } from '@rootnative/core'
import * as React from 'react'

/**
 * Structural shape of a vector-icons icon set component: any
 * `@react-native-vector-icons/*` set (`MaterialDesignIcons`, `Ionicons`,
 * `FontAwesome7`, …) or an `@expo/vector-icons` set. Each set accepts `name`,
 * `size` and `color`. A set types `name` as its own glyph union, so the shape
 * asks for `never` there: every union is assignable to it, and the resolver
 * casts the string name at the one call site.
 */
export type VectorIconSet = React.ComponentType<{
  name: never
  size?: number
  color?: string
}>

export interface VectorIconsResolverOptions {
  /**
   * The icon set component, e.g. `MaterialDesignIcons` from
   * `@react-native-vector-icons/material-design-icons` or `Ionicons` from
   * `@react-native-vector-icons/ionicons`.
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
 * Build an `IconResolver` backed by a vector-icons icon set.
 *
 * `mdiResolver` from `@rootnative/components/mdi` covers the common case.
 * Use this to switch to `Ionicons`, `FontAwesome7`, etc., to embed the MDI
 * font with the `/static` export in a development build, or to pre-register
 * a small alias map.
 *
 * @example
 * import { Ionicons } from '@react-native-vector-icons/ionicons'
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
    return (
      <IconSet name={resolved as never} size={props.size} color={props.color} />
    )
  }
}
