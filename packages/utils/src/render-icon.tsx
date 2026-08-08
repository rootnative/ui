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
 *
 * **Every call site must place the result inside a node marked `aria-hidden`.**
 * The default resolver renders a `<Text>` holding a private-use-area glyph
 * (`MaterialCommunityIcons` maps names onto U+F0000+). React Native merges the
 * text of descendant nodes into an accessible ancestor's Android
 * `contentDescription`, so an unhidden icon lands *inside the accessible name*
 * — `<Button leadingIcon="plus">Add Item</Button>` announced as
 * "5, Add Item", and a checked `Checkbox` announced as the check glyph
 * alone. A screen reader reads a private-use codepoint as nothing or as an
 * unknown symbol.
 *
 * The flag goes on a wrapping `View`, not on the icon itself: RN's `View` maps
 * `aria-hidden` onto both `accessibilityElementsHidden` (iOS) and
 * `importantForAccessibility="no-hide-descendants"` (Android), while `Text`
 * maps no `aria-hidden` at all. A `View` also hides whatever a custom
 * `iconResolver` returns, which prop injection could not guarantee.
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
