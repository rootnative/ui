import type { IconSource } from '@rootnative/utils'
import type { PressableProps, StyleProp, ViewStyle } from 'react-native'

export interface SwitchProps extends Omit<
  PressableProps,
  'children' | 'style'
> {
  /**
   * Whether the switch is toggled on.
   * @default false
   */
  value?: boolean
  /** Callback fired when the switch is toggled. Receives the new value. */
  onValueChange?: (value: boolean) => void
  /**
   * Icon shown on the thumb when selected. Accepts a string name (resolved
   * via the theme's `iconResolver`, defaulting to `MaterialCommunityIcons`),
   * a pre-rendered element, or a render function that receives `{ size, color }`.
   * @default 'check'
   */
  selectedIcon?: IconSource
  /**
   * Icon shown on the thumb when unselected. When provided, the thumb
   * renders at the larger selected size. Same accepted forms as
   * `selectedIcon`.
   */
  unselectedIcon?: IconSource
  /**
   * Override the track color.
   * State-layer colors (hover, press) are derived automatically.
   */
  containerColor?: string
  /**
   * Override the thumb and icon color.
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
