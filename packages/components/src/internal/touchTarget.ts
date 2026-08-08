/**
 * The 48dp minimum touch target, and the `hitSlop` needed to reach it.
 *
 * WCAG 2.5.5 and MD3 both put the floor at 48dp. Several MD3 Expressive size
 * tokens sit below it on purpose — a `Button` at `xs` and a `ButtonGroup` item
 * at `extraSmall` are 32dp tall, and a `Switch` track is 32dp — so the
 * container alone cannot satisfy the rule. `hitSlop` closes the gap without
 * changing a single pixel of layout.
 *
 * This was a real defect rather than a precaution: an Android accessibility
 * sweep found `Button`, `ButtonGroup` and `Switch` shipping a flat
 * `hitSlop={4}` at every size, which leaves the 32dp ones at 40dp. `IconButton`
 * already computed this correctly and is the source of the formula.
 */
export const MIN_TOUCH_TARGET = 48

/**
 * Per-side padding that grows `size` to {@link MIN_TOUCH_TARGET}, or `0` when
 * the container already clears it.
 *
 * Returning `0` rather than a small constant is deliberate. `hitSlop` extends
 * a control's touch area *past its visual bounds*, so handing an already-large
 * control extra slop only creates overlap with whatever sits next to it.
 */
export function getDefaultHitSlop(size: number): number {
  return Math.max(0, Math.round((MIN_TOUCH_TARGET - size) / 2))
}
