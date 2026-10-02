import type { IconSource } from '@rootnative/utils'
import type { StyleProp, ViewProps, ViewStyle } from 'react-native'

export interface IconProps extends Omit<ViewProps, 'children'> {
  /**
   * The icon. A string name is resolved through the theme's `iconResolver`
   * (MaterialCommunityIcons by default); a pre-rendered element renders as
   * is; a render function receives `{ size, color }`.
   */
  source: IconSource
  /**
   * Icon size in dp. The box is square at this size.
   * @default 24
   */
  size?: number
  /**
   * Icon color.
   * @default onSurface
   */
  color?: string
  /**
   * Screen-reader label. Without one the icon is decorative and hidden from
   * assistive technology. With one, the icon is exposed as an image with
   * this name.
   */
  accessibilityLabel?: string
  /** Style applied to the icon box. */
  style?: StyleProp<ViewStyle>
}
