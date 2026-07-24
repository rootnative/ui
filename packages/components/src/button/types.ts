import type { IconSource } from '@rootnative/utils'
import type {
  PressableProps,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native'

/** Visual style variant of the button following Material Design 3 roles. */
export type ButtonVariant =
  | 'filled'
  | 'elevated'
  | 'outlined'
  | 'text'
  | 'tonal'

/**
 * MD3 Expressive button size. Drives container height, horizontal padding,
 * icon size, and label typography. `'s'` (40 dp) is the default and matches
 * the pre-Expressive button.
 */
export type ButtonSize = 'xs' | 's' | 'm' | 'l' | 'xl'

/**
 * MD3 Expressive container shape. `'round'` rests as a full pill; `'square'`
 * rests at a size-dependent rounded-rectangle corner. Both morph one step
 * squarer on press.
 */
export type ButtonShape = 'round' | 'square'

export interface ButtonProps extends Omit<
  PressableProps,
  'children' | 'style'
> {
  /** Text label rendered inside the button. */
  children: string
  /**
   * Visual variant. Controls background, border, and text color.
   * @default 'filled'
   */
  variant?: ButtonVariant
  /**
   * MD3 Expressive size — one of `'xs' | 's' | 'm' | 'l' | 'xl'`. Sets
   * container height, padding, icon size, and label typography.
   * @default 's'
   */
  size?: ButtonSize
  /**
   * Container shape. `'round'` is a full pill; `'square'` rests at a
   * size-dependent rounded corner. Both morph squarer on press.
   * @default 'round'
   */
  shape?: ButtonShape
  /**
   * Icon rendered before the label. Accepts a string name (resolved via the
   * theme's `iconResolver`, defaulting to `MaterialCommunityIcons`), a
   * pre-rendered element, or a render function that receives `{ size, color }`.
   */
  leadingIcon?: IconSource
  /**
   * Icon rendered after the label. Accepts a string name (resolved via the
   * theme's `iconResolver`, defaulting to `MaterialCommunityIcons`), a
   * pre-rendered element, or a render function that receives `{ size, color }`.
   */
  trailingIcon?: IconSource
  /**
   * Size of leading and trailing icons in dp. Used when resolving string
   * icon names or invoking the render-function form. Pre-rendered elements
   * are not resized. Defaults to the icon size for the current `size`
   * (20 for `xs`/`s`, 24 `m`, 32 `l`, 40 `xl`).
   */
  iconSize?: number
  /**
   * Override the container (background) color.
   * State-layer colors (hover, press) are derived automatically.
   */
  containerColor?: string
  /**
   * Override the content (label and icon) color.
   * State-layer colors are derived automatically when no containerColor is set.
   */
  contentColor?: string
  /** Additional style applied to the label text. */
  labelStyle?: StyleProp<TextStyle>
  /**
   * Style applied to the root container. Static form only — the function
   * form `(state) => style` is not supported because the component drives
   * its container background through Reanimated. Use `containerColor` /
   * `contentColor` for state-aware styling.
   */
  style?: StyleProp<ViewStyle>
}
