import type {
  IconRenderProps,
  IconResolver,
  IconSource,
} from '@rootnative/core'
import { isValidElement } from 'react'
import type { ReactNode } from 'react'
import { getMaterialCommunityIcons } from './icon'

// The canonical `IconSource` definition lives in `@rootnative/core` next to
// `IconResolver` (core is the published package; this one is private).
// Re-exported here so components and copy-pasted CLI installs keep importing
// it from utils unchanged.
export type { IconSource } from '@rootnative/core'

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
