import type { IconSource } from '@rootnative/utils'
import type { PressableProps, StyleProp, ViewStyle } from 'react-native'

export interface CheckboxProps extends Omit<
  PressableProps,
  'children' | 'style'
> {
  /**
   * Whether the checkbox is checked.
   * @default false
   */
  value?: boolean
  /** Callback fired when the checkbox is toggled. Receives the new value. */
  onValueChange?: (value: boolean) => void
  /**
   * Icon shown when the checkbox is checked. Accepts a string name (resolved
   * via the theme's `iconResolver`, defaulting to `MaterialCommunityIcons`),
   * a pre-rendered element, or a render function that receives `{ size, color }`.
   *
   * Override this when your `iconResolver` doesn't map the default `'check'`
   * name (e.g. a Lucide-only resolver).
   * @default 'check'
   */
  checkIcon?: IconSource
  /**
   * Override the container (box) color when checked.
   * State-layer colors (hover, press) are derived automatically.
   */
  containerColor?: string
  /**
   * Override the checkmark icon color.
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
