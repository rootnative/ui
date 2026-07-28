import type { BottomSheetSnapPoint } from './types'

/**
 * MD3 sheet settle thresholds.
 * Source: androidx.compose.material3.SheetDefaults —
 * `PositionalThreshold = 56.dp`, `VelocityThreshold = 125.dp` (per second).
 */
export const POSITIONAL_THRESHOLD = 56
export const VELOCITY_THRESHOLD = 125

/**
 * Resolve the caller's snap points into visible heights in px, sorted
 * ascending. A number is a height in dp; a `'50%'` string is a fraction of the
 * host layer's height. Values are clamped to `(0, layerHeight]` and deduped,
 * so index 0 is always the smallest usable snap.
 *
 * Returns `null` while the layer is unmeasured and a percentage can't resolve.
 */
export function resolveSnapHeights(
  snapPoints: readonly BottomSheetSnapPoint[],
  layerHeight: number | null,
): number[] | null {
  const resolved: number[] = []
  for (const point of snapPoints) {
    let height: number
    if (typeof point === 'number') {
      height = point
    } else {
      const fraction = Number.parseFloat(point) / 100
      if (Number.isNaN(fraction)) continue
      if (layerHeight === null) return null
      height = fraction * layerHeight
    }
    if (layerHeight !== null) height = Math.min(height, layerHeight)
    if (height > 0 && !resolved.some((h) => Math.abs(h - height) < 0.5)) {
      resolved.push(height)
    }
  }
  return resolved.sort((a, b) => a - b)
}

export interface SnapTargetInput {
  /** Sheet offset at release, in px from fully visible (0 = tallest snap). */
  position: number
  /** Release velocity in px/s. Positive is downward (toward dismissal). */
  velocity: number
  /** Offset of the snap the sheet last settled at. */
  anchor: number
  /** Snap offsets, ascending (0 = tallest snap … larger = less visible). */
  offsets: readonly number[]
  /** Offset at which the sheet is fully off screen. */
  hiddenOffset: number
  /** Whether settling at `hiddenOffset` (drag-to-dismiss) is allowed. */
  dismissable: boolean
  velocityThreshold?: number
  positionalThreshold?: number
}

/**
 * Pick the offset a released sheet settles at.
 *
 * Adapted from compose's `AnchoredDraggableState.computeTarget` thresholds:
 * a fling past the velocity threshold commits to the adjacent anchor in the
 * fling's direction; a slow release inside `positionalThreshold` of the anchor
 * the drag started from springs back to it; any other slow release settles at
 * the nearest anchor. `hiddenOffset` joins the anchor set only when the sheet
 * is dismissable — settling there is what dismisses.
 */
export function pickSnapTarget({
  position,
  velocity,
  anchor,
  offsets,
  hiddenOffset,
  dismissable,
  velocityThreshold = VELOCITY_THRESHOLD,
  positionalThreshold = POSITIONAL_THRESHOLD,
}: SnapTargetInput): number {
  const candidates = dismissable ? [...offsets, hiddenOffset] : [...offsets]
  candidates.sort((a, b) => a - b)
  if (candidates.length === 0) return anchor

  // The anchors bracketing the release point. Past either end of the anchor
  // range, both collapse onto the nearest end.
  const below = candidates.filter((c) => c >= position)
  const above = candidates.filter((c) => c <= position)
  const next = below.length > 0 ? below[0] : candidates[candidates.length - 1]
  const prev = above.length > 0 ? above[above.length - 1] : candidates[0]

  if (velocity >= velocityThreshold) return next
  if (velocity <= -velocityThreshold) return prev
  if (Math.abs(position - anchor) < positionalThreshold) return anchor
  return position - prev <= next - position ? prev : next
}
