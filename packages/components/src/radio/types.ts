import type { PressableProps, StyleProp, ViewStyle } from 'react-native'

export interface RadioProps extends Omit<PressableProps, 'children' | 'style'> {
  /**
   * Whether the radio button is selected.
   * @default false
   */
  value?: boolean
  /**
   * Callback fired when an unselected radio is pressed. Always receives
   * `true` — radios are select-only, so pressing an already-selected radio
   * is a no-op.
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
