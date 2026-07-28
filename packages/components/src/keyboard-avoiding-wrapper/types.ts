import type {
  KeyboardAvoidingViewProps,
  KeyboardEvent,
  ScrollViewProps,
  StyleProp,
  ViewProps,
  ViewStyle,
} from 'react-native'

export interface KeyboardAvoidingWrapperProps extends ViewProps {
  /**
   * Keyboard avoidance strategy.
   * @default 'padding'
   */
  behavior?: KeyboardAvoidingViewProps['behavior']
  /**
   * Extra offset added to the keyboard height calculation.
   * Useful for accounting for headers or tab bars.
   * @default 0
   */
  keyboardVerticalOffset?: number
  /**
   * Enable or disable the keyboard avoiding behavior.
   * @default true
   */
  enabled?: boolean
  /** Props forwarded to the inner `ScrollView`. */
  scrollViewProps?: ScrollViewProps
  /** Called when the keyboard is about to show (iOS) or has shown (Android). */
  onKeyboardShow?: (event: KeyboardEvent) => void
  /** Called when the keyboard is about to hide (iOS) or has hidden (Android). */
  onKeyboardHide?: (event: KeyboardEvent) => void
  /** Style applied to the outer `KeyboardAvoidingView`. */
  style?: StyleProp<ViewStyle>
  /** Style applied to the inner `ScrollView` contentContainerStyle. */
  contentContainerStyle?: StyleProp<ViewStyle>
}
