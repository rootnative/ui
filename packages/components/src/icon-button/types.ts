import type { IconSource } from '@rootnative/utils'
import type { PressableProps, StyleProp, ViewStyle } from 'react-native'

/** Visual fill style of the icon button. */
export type IconButtonVariant = 'filled' | 'tonal' | 'outlined' | 'standard'

/** Touch target size of the icon button. */
export type IconButtonSize = 'small' | 'medium' | 'large'

export interface IconButtonProps extends Omit<
  PressableProps,
  'children' | 'onPress' | 'style' | 'accessibilityLabel'
> {
  /**
   * Icon to display. Accepts a string name (resolved via the theme's
   * `iconResolver`, defaulting to `MaterialCommunityIcons`), a pre-rendered
   * element, or a render function that receives `{ size, color }`.
   */
  icon: IconSource
  /** Icon to display when `selected` is `true` (toggle mode). */
  selectedIcon?: IconSource
  /** Overrides the automatic icon color derived from the variant and state. */
  iconColor?: string
  /**
   * Override the content (icon) color.
   * Takes precedence over `iconColor` when both are provided.
   */
  contentColor?: string
  /**
   * Override the container (background) color.
   * State-layer colors (hover, press) are derived automatically.
   */
  containerColor?: string
  /**
   * Style applied to the root container. Static form only — the function
   * form `(state) => style` is not supported because the component drives
   * its container background through Reanimated. Use `containerColor` /
   * `contentColor` for state-aware styling.
   */
  style?: StyleProp<ViewStyle>
  /** Called when the button is pressed. */
  onPress?: () => void
  /**
   * Disables the button.
   * @default false
   */
  disabled?: boolean
  /**
   * Visual style variant.
   * @default 'filled'
   */
  variant?: IconButtonVariant
  /** Enables toggle mode. The button changes appearance based on selected/unselected state. */
  selected?: boolean
  /**
   * Physical size of the touch target and icon container.
   * @default 'medium'
   */
  size?: IconButtonSize
  /** Required — icon-only buttons must have a label for screen readers. */
  accessibilityLabel: string
}
