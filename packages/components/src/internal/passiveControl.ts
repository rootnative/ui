/**
 * Whether a selection control (Checkbox, Radio, Switch) only shows its state.
 *
 * A controlled control with no `onValueChange` cannot change anything, but it
 * still took the press. In a pressable row it became the touch responder, so
 * a tap on the box did nothing and the row press did not fire. On web it also
 * stopped the click and added a second tab stop in the row. Compose has the
 * same rule: `Checkbox(checked, onCheckedChange = null)` is passive and leaves
 * the press to a parent `Modifier.toggleable`.
 *
 * A passive control lets the press go through to its parent, leaves the tab
 * order, and is hidden from assistive technology. So the parent row must
 * carry the state with `role` and `aria-checked`. Without them, a screen
 * reader gets no checked state.
 *
 * A disabled control is never passive. With no handler, it is a read-only
 * control that still announces its state.
 *
 * Internal — not exported from the package.
 */
export function isPassiveControl(
  isControlled: boolean,
  onValueChange: unknown,
  isDisabled: boolean,
): boolean {
  return isControlled && onValueChange === undefined && !isDisabled
}

/** Spread after the consumer props, so a passive control stays hidden. */
export const passiveControlProps = { 'aria-hidden': true } as const
