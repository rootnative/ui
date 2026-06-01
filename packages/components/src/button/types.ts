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
   * are not resized.
   * @default 18
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
