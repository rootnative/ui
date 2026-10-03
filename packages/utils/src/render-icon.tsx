import type {
  IconRenderProps,
  IconResolver,
  IconSource,
} from '@rootnative/core'
import { isValidElement } from 'react'
import type { ReactNode } from 'react'

// The canonical `IconSource` definition lives in `@rootnative/core` next to
// `IconResolver` (core is the published package; this one is private).
// Re-exported here so components and copy-pasted CLI installs keep importing
// it from utils unchanged.
export type { IconSource } from '@rootnative/core'

let warnedMissingResolver = false

// Logged in production too. A string icon that renders as nothing has no
// other trace, and a silent production build is how a missing-plugin defect
// stayed hidden in a consumer for a day.
function warnMissingResolver(name: string) {
  if (warnedMissingResolver) return
  warnedMissingResolver = true
  console.warn(
    `[rootnative] The icon "${name}" is a string name, and no iconResolver ` +
      'is set on ThemeProvider, so it renders as nothing. For the Material ' +
      'Community Icons default, pass iconResolver={mdiResolver} from ' +
      "'@rootnative/components/mdi'. For another icon set, pass your own " +
      "resolver or one from '@rootnative/icons'.",
  )
}

/**
 * Render any `IconSource` to a node. Components should call this with the
 * size/color they would pass to the icon set and the resolver from
 * `useIconResolver()`.
 *
 * A string name needs a resolver. Without one it renders `null` and logs one
 * warning per process; the library ships no default resolver in the shared
 * code, so that an app with its own icon set never imports an icon font
 * package. The MDI default lives behind `@rootnative/components/mdi`.
 *
 * **Every call site must place the result inside a node marked `aria-hidden`.**
 * The MDI resolver renders a `<Text>` holding a private-use-area glyph
 * (`MaterialDesignIcons` maps names onto U+F0000+). React Native merges the
 * text of descendant nodes into an accessible ancestor's Android
 * `contentDescription`, so an unhidden icon lands *inside the accessible name*
 * — `<Button leadingIcon="plus">Add Item</Button>` announced as
 * "5, Add Item", and a checked `Checkbox` announced as the check glyph
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
    warnMissingResolver(source)
    return null
  }

  if (typeof source === 'function') {
    return source(props)
  }

  if (isValidElement(source)) return source

  return null
}
