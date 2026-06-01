import type { IconSource } from '@rootnative/utils'
import type { StyleProp, ViewProps, ViewStyle } from 'react-native'

/** Size of the avatar container. */
export type AvatarSize = 'xSmall' | 'small' | 'medium' | 'large' | 'xLarge'

export interface AvatarProps extends Omit<ViewProps, 'style'> {
  /**
   * URI of the image to display.
   * Takes priority over `icon` and `label`.
   */
  imageUri?: string
  /**
   * Icon to display. Accepts a string name (resolved via the theme's
   * `iconResolver`, defaulting to `MaterialCommunityIcons`), a pre-rendered
   * element, or a render function that receives `{ size, color }`.
   * Takes priority over `label` when `imageUri` is not set.
   */
  icon?: IconSource
  /**
   * Text initials to display (1–2 characters recommended).
   * Shown when `imageUri` and `icon` are not set.
   */
  label?: string
  /**
   * Size of the avatar.
   * @default 'medium'
   */
  size?: AvatarSize
  /**
   * Override the container (background) color.
   * State-layer colors (hover, press) are derived automatically when `onPress` is set.
   */
  containerColor?: string
  /** Override the content (icon / initials) color. */
  contentColor?: string
  /** Custom style applied to the root container. */
  style?: StyleProp<ViewStyle>
  /** When provided, the avatar becomes interactive (Pressable). */
  onPress?: () => void
  /** Required when `onPress` is provided — labels the button for screen readers. */
  accessibilityLabel?: string
}
