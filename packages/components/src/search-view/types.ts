import type { IconSource } from '@rootnative/utils'
import type { ReactNode, Ref, RefObject } from 'react'
import type {
  StyleProp,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native'
import type { SearchBarAction } from '../search-bar/types'

/**
 * How the view is laid out. `'fullscreen'` covers the screen, which MD3
 * specifies for a compact window. `'docked'` is a panel that opens from the
 * bar, for a medium or larger window. `'auto'` picks by the current
 * breakpoint.
 */
export type SearchViewLayout = 'auto' | 'fullscreen' | 'docked'

/** Input props the view forwards to its `TextInput`, minus the ones it owns. */
export type SearchViewInputProps = Omit<
  TextInputProps,
  | 'value'
  | 'defaultValue'
  | 'onChangeText'
  | 'placeholder'
  | 'placeholderTextColor'
  | 'editable'
  | 'style'
  | 'ref'
  | 'autoFocus'
>

export interface SearchViewProps extends Omit<ViewProps, 'style'> {
  /** Whether the view is open. The view mounts when this becomes `true`. */
  visible: boolean
  /**
   * Called when the view asks to close: the back button, the Android back
   * button, Escape on web, or a press outside a docked view. Set `visible`
   * to `false` in response.
   */
  onDismiss: () => void
  /**
   * The layout. `'auto'` is full screen on a compact window and docked on a
   * wider one.
   * @default 'auto'
   */
  layout?: SearchViewLayout
  /**
   * The view the docked layout opens from, usually a `View` around the
   * `SearchBar`. The docked view takes its left edge, top edge and width, so
   * the header covers the bar. Without it, a docked view sits at the top of
   * the screen, centered, 720 dp wide at most.
   */
  anchor?: RefObject<View | null>
  /** Controlled query. Pair it with `onChangeText`. */
  value?: string
  /** Initial query for the uncontrolled case. */
  defaultValue?: string
  /** Called on every change to the query. */
  onChangeText?: (text: string) => void
  /** Placeholder of the input, and its accessible name by default. */
  placeholder?: string
  /**
   * Override the placeholder color.
   * @default theme.colors.onSurfaceVariant
   */
  placeholderTextColor?: string
  /** Called with the current query when the user submits from the keyboard. */
  onSearch?: (query: string) => void
  /**
   * Icon of the back button at the start of the header.
   * @default 'arrow-left'
   */
  backIcon?: IconSource
  /**
   * Accessibility label of the back button.
   * @default 'Back'
   */
  backAccessibilityLabel?: string
  /**
   * Shows a clear button while the input holds text.
   * @default true
   */
  showClearButton?: boolean
  /**
   * Accessibility label of the clear button.
   * @default 'Clear search'
   */
  clearButtonAccessibilityLabel?: string
  /** Called after the clear button empties the input. */
  onClear?: () => void
  /**
   * Icon buttons at the end of the header, such as a voice action. The clear
   * button shows before them while the input holds text.
   */
  actions?: SearchBarAction[]
  /**
   * Accessibility label of the area outside a docked view, which closes the
   * view on press.
   * @default 'Close search'
   */
  dismissAccessibilityLabel?: string
  /**
   * Override the container (background) color of the view.
   * @default theme.colors.surfaceContainerHigh
   */
  containerColor?: string
  /** Override the color of the input text and the header icons. */
  contentColor?: string
  /** Additional style applied to the text input element. */
  inputStyle?: StyleProp<TextStyle>
  /**
   * Style applied to the surface. A docked view reads `maxHeight` from it,
   * the default is two thirds of the window height.
   */
  style?: StyleProp<ViewStyle>
  /** Other props of the `TextInput`, such as `autoCapitalize`. */
  inputProps?: SearchViewInputProps
  /**
   * Ref to the inner `TextInput`, for imperative `focus()`, `blur()` and
   * `clear()` calls.
   */
  ref?: Ref<TextInput>
  /**
   * The body below the header: suggestions, recent queries, or results. It
   * fills the rest of the view. Put a scrollable list here when it can grow
   * past the view.
   */
  children?: ReactNode
}
