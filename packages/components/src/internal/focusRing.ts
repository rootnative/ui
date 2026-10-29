import { Platform } from 'react-native'

/**
 * The static style of a focus ring node that sits beside its control, for a
 * ring `offset` outside the control and `width` thick.
 *
 * On native the node is outset by `offset + width` and draws the ring as its
 * border. On web the node has the box of the control and draws the ring as a
 * CSS outline at `offset`. An outline is ink, not layout: it adds no
 * scrollable overflow. A node outset by 5 in a bar with the 4 wide MD3 gutter
 * reached 1 px past the page edge and widened the page by 1 px, at opacity 0.
 *
 * The ring node must set its `borderRadius` to the control's radius plus
 * `focusRingOutset(...)`, so the outline follows the corner at its offset.
 */
export function focusRingBox(offset: number, width: number, color: string) {
  if (Platform.OS === 'web') {
    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      outlineStyle: 'solid' as const,
      outlineWidth: width,
      outlineOffset: offset,
      outlineColor: color,
    }
  }
  const inset = -(offset + width)
  return {
    position: 'absolute' as const,
    top: inset,
    left: inset,
    right: inset,
    bottom: inset,
    borderWidth: width,
    borderColor: color,
  }
}

/**
 * What a ring node adds to the corner radius of its control. On web the node
 * has the control's box, and the outline follows the corner on its own, so it
 * adds nothing. On native the node is outset, and it adds the value the
 * component used before: `offset + width` for the geometric outer corner, or
 * `offset` where the component chose that.
 */
export function focusRingOutset(native: number): number {
  return Platform.OS === 'web' ? 0 : native
}
