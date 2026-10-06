import type { StyleProp, ViewStyle } from 'react-native'

/** The keys that place a view in its parent, rather than style the view. */
const LAYOUT_KEYS: ReadonlySet<string> = new Set([
  'alignSelf',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginStart',
  'marginEnd',
  'marginHorizontal',
  'marginVertical',
  'marginBlock',
  'marginBlockStart',
  'marginBlockEnd',
  'marginInline',
  'marginInlineStart',
  'marginInlineEnd',
  'position',
  'top',
  'bottom',
  'left',
  'right',
  'start',
  'end',
  'inset',
  'insetBlock',
  'insetBlockStart',
  'insetBlockEnd',
  'insetInline',
  'insetInlineStart',
  'insetInlineEnd',
  'zIndex',
])

export interface SplitLayoutStyle {
  /** The layout keys, for the wrapper. `undefined` when there are none. */
  outer: ViewStyle | undefined
  /** Every other key, in the order given, for the inner node. */
  inner: StyleProp<ViewStyle>
}

/**
 * Split a consumer `style` between a component's hugging wrapper and the
 * pressable inside it. Button, IconButton, FAB and Chip draw the focus ring
 * and the shadow as siblings of the pressable, so they wrap it in a `View`
 * with `alignSelf: 'flex-start'`. On the pressable, a consumer `alignSelf`
 * loses to that wrapper, a margin moves the button away from its own ring,
 * and `position: 'absolute'` places it against a wrapper of no size.
 *
 * Only a plain number or string moves. A Reanimated animated style, or a
 * shared value inside a style, stays on the pressable whole, because
 * Reanimated finds it there by identity and the wrapper is not animated. A
 * style with no layout key comes back as the same object.
 *
 * When `flex` or `flexGrow` moves, the pressable gets `flexGrow: 1`, so it
 * fills the space the wrapper takes and the ring still fits it.
 */
export function splitLayoutStyle(
  style: StyleProp<ViewStyle>,
): SplitLayoutStyle {
  const outer: Record<string, unknown>[] = []
  const inner: StyleProp<ViewStyle>[] = []
  collect(style, outer, inner)
  if (outer.length === 0) return { outer: undefined, inner: style }

  const merged: Record<string, unknown> = Object.assign({}, ...outer)
  const grows = [merged.flex, merged.flexGrow].some(
    (value) => typeof value === 'number' && value > 0,
  )
  if (grows) inner.unshift({ flexGrow: 1 })
  return { outer: merged as ViewStyle, inner }
}

function collect(
  style: StyleProp<ViewStyle>,
  outer: Record<string, unknown>[],
  inner: StyleProp<ViewStyle>[],
) {
  if (!style) return
  if (Array.isArray(style)) {
    for (const item of style as StyleProp<ViewStyle>[]) {
      collect(item, outer, inner)
    }
    return
  }
  if (typeof style !== 'object' || 'viewDescriptors' in style) {
    inner.push(style)
    return
  }

  let layout: Record<string, unknown> | null = null
  let rest: Record<string, unknown> | null = null
  for (const [key, value] of Object.entries(style)) {
    const movable = typeof value === 'number' || typeof value === 'string'
    if (LAYOUT_KEYS.has(key) && movable) {
      ;(layout ??= {})[key] = value
    } else {
      ;(rest ??= {})[key] = value
    }
  }
  if (layout === null) {
    inner.push(style)
    return
  }
  outer.push(layout)
  if (rest !== null) inner.push(rest as ViewStyle)
}
