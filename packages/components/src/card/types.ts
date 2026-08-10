import type { ReactNode } from 'react'
import type { ViewProps } from 'react-native'

/** Surface style variant of the card following Material Design 3 roles. */
export type CardVariant = 'elevated' | 'filled' | 'outlined'

/**
 * Horizontal placement of the buttons inside `Card.Actions`.
 * MD3 aligns card actions to the trailing edge.
 */
export type CardActionsAlign = 'start' | 'end' | 'center' | 'space-between'

export interface CardMediaProps extends ViewProps {
  /**
   * Media to render — an `Image`, `expo-image`, a video surface, or any other
   * node. The slot does not own the image, so any library works.
   *
   * Children are stretched to fill the slot, so a plain `Image` needs no style
   * of its own.
   */
  children: ReactNode
  /**
   * Fixed height of the media region in dp. Omit to let the media size itself
   * (for example an `Image` with an `aspectRatio` style).
   */
  height?: number
  /**
   * Aspect ratio of the media region (width / height). Ignored when `height`
   * is set.
   */
  aspectRatio?: number
}

export interface CardContentProps extends ViewProps {
  /** Content rendered inside the padded region. */
  children: ReactNode
}

export interface CardActionsProps extends ViewProps {
  /** Action buttons, laid out in a row. */
  children: ReactNode
  /**
   * Horizontal placement of the actions.
   * @default 'end'
   */
  align?: CardActionsAlign
}

export interface CardProps extends ViewProps {
  /**
   * Content rendered inside the card surface.
   *
   * The card applies no padding of its own. Use the region slots —
   * `Card.Media`, `Card.Content` and `Card.Actions` — to get the MD3 spacing
   * without repeating it at every call site. Raw children remain fully
   * supported and unpadded, so you own the spacing when you pass them.
   */
  children: ReactNode
  /**
   * Surface style variant.
   * @default 'elevated'
   */
  variant?: CardVariant
  /** When provided, the card becomes interactive (Pressable). Omit to render as a plain View. */
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
}
