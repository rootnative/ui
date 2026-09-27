import type { ReactNode } from 'react'
import type { StyleProp, ViewProps, ViewStyle } from 'react-native'

/**
 * `'small'` is a 6dp dot with no content. `'large'` is a 16dp pill that
 * carries a label. The size follows from `label`: set a label for a large
 * badge, omit it for a small one.
 */
export type BadgeSize = 'small' | 'large'

export interface BadgeProps extends Omit<ViewProps, 'children' | 'style'> {
  /**
   * Content of the badge. A number or a short string, for example a count.
   * Omit it for a small dot. A number above `max` renders as `{max}+`.
   */
  label?: string | number
  /**
   * The largest number the badge shows before it truncates to `{max}+`.
   * Applies to numeric labels only.
   * @default 999
   */
  max?: number
  /**
   * Whether the badge renders. When `false`, the anchor still renders and
   * keeps its layout, so a badge can appear later without a shift.
   * @default true
   */
  visible?: boolean
  /**
   * The element the badge anchors to, usually a 24dp icon. The badge sits at
   * the anchor's top-end corner per the MD3 offsets. Without children the
   * badge renders inline on its own.
   */
  children?: ReactNode
  /**
   * Override the badge fill.
   * @default error
   */
  containerColor?: string
  /**
   * Override the label color.
   * @default onError
   */
  contentColor?: string
  /** Style applied to the badge itself, not to the anchor wrapper. */
  style?: StyleProp<ViewStyle>
  /** Style applied to the wrapper that holds the anchor and the badge. */
  wrapperStyle?: StyleProp<ViewStyle>
  /**
   * Screen-reader text for the badge, for example "3 unread messages". A
   * small badge has no text of its own, so without this label a screen
   * reader does not announce it.
   */
  accessibilityLabel?: string
  /**
   * Test id applied to the badge. The anchor wrapper, when children are
   * given, carries `<testID>-wrapper`.
   */
  testID?: string
}
