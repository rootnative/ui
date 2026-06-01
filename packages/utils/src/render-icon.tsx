import type { IconRenderProps, IconResolver } from '@rootnative/core'
import { isValidElement } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { getMaterialCommunityIcons } from './icon'

/**
 * Anything a component will accept for an icon prop:
 *
 * - **string** — a name resolved via the `iconResolver` registered on
 *   `ThemeProvider`. Falls back to `MaterialCommunityIcons` when no
 *   resolver is set, preserving the legacy default.
 * - **ReactElement** — a pre-rendered icon. The caller is responsible for
 *   passing size and color; the component will not override them.
 * - **(props) => ReactNode** — a render function that receives the
 *   component's resolved size and color. Useful for plugging in Lucide,
 *   SF Symbols, or custom SVGs without losing theme integration.
 */
export type IconSource =
  | string
  | ReactElement
  | ((props: IconRenderProps) => ReactNode)

/**
 * Render any `IconSource` to a node. Components should call this with the
 * size/color they would have passed to `MaterialCommunityIcons` and the
 * resolver from `useIconResolver()`.
 */
export function renderIcon(
  source: IconSource | null | undefined,
  props: IconRenderProps,
  resolver: IconResolver | null | undefined,
): ReactNode {
  if (source == null) return null

  if (typeof source === 'string') {
    if (resolver) return resolver(source, props)
    const MCI = getMaterialCommunityIcons()
    return <MCI name={source} size={props.size} color={props.color} />
  }

  if (typeof source === 'function') {
    return source(props)
  }

  if (isValidElement(source)) return source

  return null
}
