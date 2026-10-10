import type { StyleProp, ViewStyle } from 'react-native'

/** The keys that place or size a view in its parent, rather than style it. */
const LAYOUT_KEYS: ReadonlySet<string> = new Set([
  'alignSelf',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'width',
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

/**
 * `minWidth` and `maxWidth` move only with `width`, so that they clamp it.
 * Alone they stay on the pressable: a parent that stretches the outer view
 * makes it full width, and a bound there would limit nothing.
 */
const LAYOUT_KEYS_WITH_WIDTH_BOUNDS: ReadonlySet<string> = new Set([
  ...LAYOUT_KEYS,
  'minWidth',
  'maxWidth',
])

// `width: '100%'` because IconButton and FAB give the pressable a fixed width.
const FILL_FRAME: ViewStyle = { alignSelf: 'stretch', flexGrow: 1 }
const FILL_PRESSABLE: ViewStyle = { flexGrow: 1, width: '100%' }

// A minimum and not a stretch, so a `width` under the button's own minimum
// leaves the frame, and with it the ring, on the button. Do not add a
// `flexGrow` here: with a percentage `minWidth`, the legacy stretch rule of
// Yoga (React Native's default layout conformance) grows the frame to the
// height of the screen.
const WIDTH_FRAME: ViewStyle = { minWidth: '100%' }
const WIDTH_PRESSABLE: ViewStyle = { width: 'auto' }

export interface SplitLayoutStyle {
  /** The layout keys, for the outer view. `undefined` when there are none. */
  outer: ViewStyle | undefined
  /** The style of the frame around the pressable, its ring and its shadow. */
  frame: ViewStyle | undefined
  /** Every other key, in the order given, for the pressable. */
  inner: StyleProp<ViewStyle>
}

/**
 * Split a consumer `style` between the two views around a component's
 * pressable. Button, IconButton, FAB and Chip draw the focus ring and the
 * shadow as siblings of the pressable, in a frame that is as big as the
 * pressable. The frame is in an outer view, which is the node the parent
 * lays out. The outer view has no `alignSelf`, so the parent's `alignItems`
 * places the button. It sets `alignItems: 'flex-start'`, so when the parent
 * stretches it, the frame stays at the start edge, as big as the button. One
 * view cannot do both: an `alignSelf` that stops the stretch also overrides
 * every other `alignItems` of the parent.
 *
 * The keys that place or size the component go to the outer view. On the
 * pressable, `alignSelf` and a percentage `width` resolve against the frame,
 * a margin moves the button away from its own ring, and
 * `position: 'absolute'` places it against a frame of no size.
 *
 * Only a plain number or string moves, and `width: 'auto'` does not. A
 * Reanimated animated style, or a shared value inside a style, stays on the
 * pressable whole, because Reanimated finds it there by identity and the
 * outer view is not animated. A style with no layout key comes back as the
 * same object.
 *
 * When `flex` or `flexGrow` is above 0, or `alignSelf` is `'stretch'`, the
 * frame and the pressable fill the outer view. When a `width` moves and the
 * component does not grow, the frame is at least as wide as the outer view
 * and the pressable fills the frame.
 */
export function splitLayoutStyle(
  style: StyleProp<ViewStyle>,
): SplitLayoutStyle {
  const keys = hasMovableWidth(style)
    ? LAYOUT_KEYS_WITH_WIDTH_BOUNDS
    : LAYOUT_KEYS
  const outer: Record<string, unknown>[] = []
  const inner: StyleProp<ViewStyle>[] = []
  collect(style, keys, outer, inner)
  if (outer.length === 0) {
    return { outer: undefined, frame: undefined, inner: style }
  }

  const merged: Record<string, unknown> = Object.assign({}, ...outer)
  const grows =
    [merged.flex, merged.flexGrow].some(
      (value) => typeof value === 'number' && value > 0,
    ) || merged.alignSelf === 'stretch'
  if (grows) {
    inner.unshift(FILL_PRESSABLE)
    return { outer: merged as ViewStyle, frame: FILL_FRAME, inner }
  }
  if (merged.width !== undefined) {
    inner.unshift(WIDTH_PRESSABLE)
    return { outer: merged as ViewStyle, frame: WIDTH_FRAME, inner }
  }
  return { outer: merged as ViewStyle, frame: undefined, inner }
}

function isMovable(key: string, value: unknown): boolean {
  if (typeof value === 'number') return true
  return typeof value === 'string' && !(key === 'width' && value === 'auto')
}

function isPlainStyle(
  style: StyleProp<ViewStyle>,
): style is Record<string, unknown> {
  return (
    typeof style === 'object' &&
    style !== null &&
    !Array.isArray(style) &&
    !('viewDescriptors' in style)
  )
}

function hasMovableWidth(style: StyleProp<ViewStyle>): boolean {
  if (Array.isArray(style)) {
    return (style as StyleProp<ViewStyle>[]).some(hasMovableWidth)
  }
  return isPlainStyle(style) && isMovable('width', style.width)
}

function collect(
  style: StyleProp<ViewStyle>,
  keys: ReadonlySet<string>,
  outer: Record<string, unknown>[],
  inner: StyleProp<ViewStyle>[],
) {
  if (!style) return
  if (Array.isArray(style)) {
    for (const item of style as StyleProp<ViewStyle>[]) {
      collect(item, keys, outer, inner)
    }
    return
  }
  if (!isPlainStyle(style)) {
    inner.push(style)
    return
  }

  let layout: Record<string, unknown> | null = null
  let rest: Record<string, unknown> | null = null
  for (const [key, value] of Object.entries(style)) {
    if (keys.has(key) && isMovable(key, value)) {
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
