import type { IconSource } from '@rootnative/utils'
import type { StyleProp, TextInputProps, TextStyle } from 'react-native'

/** Visual container style for the text field. */
export type TextFieldVariant = 'filled' | 'outlined'

export interface TextFieldProps extends Omit<
  TextInputProps,
  'placeholderTextColor' | 'editable'
> {
  /** Floating label text. Animates above the input when focused or filled. */
  label?: string
  /**
   * Container style.
   * @default 'filled'
   */
  variant?: TextFieldVariant
  /** Helper text displayed below the field. Hidden when `error` or `errorText` is active. */
  supportingText?: string
  /** Error message. When provided, implicitly sets `error` to `true` and replaces `supportingText`. */
  errorText?: string
  /**
   * When `true`, renders the field in error state with error colors.
   * @default false
   */
  error?: boolean
  /**
   * Disables text input and reduces opacity.
   * @default false
   */
  disabled?: boolean
  /**
   * Icon rendered at the start of the field. Accepts a string name (resolved
   * via the theme's `iconResolver`, defaulting to `MaterialCommunityIcons`),
   * a pre-rendered element, or a render function that receives `{ size, color }`.
   */
  leadingIcon?: IconSource
  /**
   * Icon rendered at the end of the field. Same accepted forms as `leadingIcon`.
   */
  trailingIcon?: IconSource
  /** Called when the trailing icon is pressed. */
  onTrailingIconPress?: () => void
  /**
   * Override the container (background) color.
   * Disabled state still uses the standard disabled appearance.
   */
  containerColor?: string
  /**
   * Override the content (input text and icon) color.
   * Error and disabled states take precedence.
   */
  contentColor?: string
  /** Additional style applied to the text input element. */
  inputStyle?: StyleProp<TextStyle>
}
