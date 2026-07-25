import type { ReactNode } from 'react'
import type { StyleProp, ViewProps, ViewStyle } from 'react-native'
import type { DividerProps } from '../divider'

export interface ListProps extends ViewProps {
  /** Content rendered inside the list container. */
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

/** Number of text lines the item displays, used to determine minimum height. */
export type ListItemLines = 1 | 2 | 3

export interface ListItemProps extends ViewProps {
  /** Primary text displayed on the list item. */
  headlineText: string
  /** Secondary text displayed below the headline. */
  supportingText?: string
  /** Text displayed above the headline (e.g. category label). */
  overlineText?: string
  /** Short text displayed at the trailing edge (e.g. "100+", timestamp). */
  trailingSupportingText?: string
  /** Content rendered before the text block (icon, avatar, image, checkbox). */
  leadingContent?: ReactNode
  /** Content rendered after the text block (icon, switch, checkbox). */
  trailingContent?: ReactNode
  /** When provided, the item becomes interactive (Pressable). Omit to render as a plain View. */
  onPress?: () => void
  /**
   * Disables the press interaction and reduces opacity. Only effective when `onPress` is provided.
   * @default false
   */
  disabled?: boolean
  /**
   * Override the container (background) color.
   * State-layer colors (hover, press) are derived automatically.
   */
  containerColor?: string
  /**
   * Override the headline text color. Overline, supporting, and
   * trailing-supporting text keep their MD3 muted variants (`onSurfaceVariant`)
   * — those are intentionally distinct from the primary content color.
   */
  contentColor?: string
  /**
   * Maximum number of lines for supportingText before truncating.
   * @default 1
   */
  supportingTextNumberOfLines?: number
  style?: StyleProp<ViewStyle>
}

/**
 * Alias of `DividerProps`. `ListDivider` is a thin wrapper around the
 * standalone `Divider` component.
 */
export type ListDividerProps = DividerProps
