import type { ReactNode } from 'react'
import type {
  StyleProp,
  TextProps,
  TextStyle,
  ViewProps,
  ViewStyle,
} from 'react-native'
import type { DividerProps } from '../divider'

export interface ListProps extends ViewProps {
  /** Content rendered inside the list container. */
  children: ReactNode
  /**
   * Section headline in `titleSmall` and `onSurfaceVariant`, above the items.
   * It has the same start and end padding as `ListItem`. Omit it for a list
   * with no title. For a `FlatList`, put `List.Headline` in its
   * `ListHeaderComponent` instead.
   */
  headline?: string
  /**
   * The outline level of the headline on web, where it renders as `<hN>`.
   * Native has no heading levels and ignores it.
   * @default 2
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  /** Style applied to the headline `Text`. */
  headlineStyle?: StyleProp<TextStyle>
  style?: StyleProp<ViewStyle>
}

/**
 * The section headline of a `List` as its own component, for a list that
 * `List` does not wrap. A `FlatList` inside `List` gets no bounded height,
 * so a long list puts `List.Headline` in `ListHeaderComponent`.
 */
export interface ListHeadlineProps extends Omit<
  TextProps,
  'children' | 'style'
> {
  /** The headline text. */
  children: ReactNode
  /**
   * The outline level of the headline on web, where it renders as `<hN>`.
   * Native has no heading levels and ignores it.
   * @default 2
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  style?: StyleProp<TextStyle>
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
   * `0` removes the limit.
   * @default 1
   */
  supportingTextNumberOfLines?: number
  /**
   * Maximum number of lines for `headlineText` before truncating. `0`
   * removes the limit. The item grows to fit the lines. Unlike
   * `supportingTextNumberOfLines`, a value above 1 does not change the item
   * to the three-line template.
   * @default 1
   */
  headlineNumberOfLines?: number
  /**
   * Maximum number of lines for `overlineText` before truncating. `0`
   * removes the limit. The item grows to fit the lines. Unlike
   * `supportingTextNumberOfLines`, a value above 1 does not change the item
   * to the three-line template.
   * @default 1
   */
  overlineNumberOfLines?: number
  style?: StyleProp<ViewStyle>
}

/**
 * Alias of `DividerProps`. `ListDivider` is a thin wrapper around the
 * standalone `Divider` component.
 */
export type ListDividerProps = DividerProps
