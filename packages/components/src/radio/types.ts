import type { PressableProps, StyleProp, ViewStyle } from 'react-native'

export interface RadioProps extends Omit<PressableProps, 'children' | 'style'> {
  /**
   * Whether the radio button is selected (controlled). Pass this together with
   * `onValueChange` to own the state. Omit it and the component manages its
   * own state, starting from `defaultValue`.
   */
  value?: boolean
  /**
   * Initial value when uncontrolled. Ignored once `value` is passed.
   *
   * A radio is select-only, so an uncontrolled one latches on: only a
   * controlling parent can turn it back off.
   * @default false
   */
  defaultValue?: boolean
  /**
   * Callback fired when an unselected radio is pressed. Always receives
   * `true` — radios are select-only, so pressing an already-selected radio
   * is a no-op.
   *
   * With `value` set and no `onValueChange`, the radio only shows the
   * state. It takes no press, leaves the tab order, and is hidden from
   * assistive technology. Use this in a pressable `ListItem`, and give the
   * row `role="radio"` and `aria-checked`. The row then carries the press
   * and the state. A disabled radio is never hidden.
   */
  onValueChange?: (value: boolean) => void
  /**
   * Override the outer ring and inner dot color when selected.
   * State-layer colors (hover, press) are derived automatically.
   */
  containerColor?: string
  /**
   * Override the outer ring color when unselected.
   */
  contentColor?: string
  /**
   * Style applied to the root container. Static form only — the function
   * form `(state) => style` is not supported because the component drives
   * its container background through Reanimated. Use `containerColor` /
   * `contentColor` for state-aware styling.
   */
  style?: StyleProp<ViewStyle>
}
