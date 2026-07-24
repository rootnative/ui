import type { IconSource } from '@rootnative/utils'
import type { PressableProps, StyleProp, ViewStyle } from 'react-native'

/** Visual fill style of the icon button. */
export type IconButtonVariant = 'filled' | 'tonal' | 'outlined' | 'standard'

/**
 * MD3 Expressive icon-button size. Drives container height, icon size, and
 * the widths available to the `width` prop. `'s'` (40 dp) is the default.
 */
export type IconButtonSize = 'xs' | 's' | 'm' | 'l' | 'xl'

/**
 * MD3 Expressive icon-button width variant. `'narrow'`/`'wide'` trade
 * horizontal padding around the icon; `'uniform'` (default) makes the
 * container square at the size's height.
 */
export type IconButtonWidth = 'narrow' | 'uniform' | 'wide'

/**
 * Container shape. `'round'` rests as a pill/circle; `'square'` rests at a
 * size-dependent rounded corner. Both morph squarer on press. For toggle
 * buttons the selected state inverts the shape (round → squarer, square →
 * pill) per MD3 Expressive.
 */
export type IconButtonShape = 'round' | 'square'

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
   * MD3 Expressive size — one of `'xs' | 's' | 'm' | 'l' | 'xl'`. Sets
   * container height and icon size.
   * @default 's'
   */
  size?: IconButtonSize
  /**
   * Width variant. `'uniform'` is a square container; `'narrow'`/`'wide'`
   * adjust horizontal padding around the icon.
   * @default 'uniform'
   */
  width?: IconButtonWidth
  /**
   * Container shape. `'round'` is a pill/circle; `'square'` rests at a
   * size-dependent corner. Toggle buttons invert the shape when selected.
   * @default 'round'
   */
  shape?: IconButtonShape
  /** Required — icon-only buttons must have a label for screen readers. */
  accessibilityLabel: string
}
