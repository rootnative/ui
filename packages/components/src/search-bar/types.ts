import type { IconSource } from '@rootnative/utils'
import type { ReactNode, Ref } from 'react'
import type {
  StyleProp,
  TextInput,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from 'react-native'

/**
 * A step on the Material density scale. Each step below 0 removes 4dp from
 * the 56dp container height, so `-4` gives a 40dp bar.
 */
export type SearchBarDensity = 0 | -1 | -2 | -3 | -4

/** An icon-button action in the SearchBar trailing slot. */
export interface SearchBarAction {
  /**
   * Icon to render. Accepts the same forms as `IconButton.icon` — a string
   * name (resolved via the theme's `iconResolver`, defaulting to
   * `MaterialCommunityIcons`), a pre-rendered element, or a render function.
   */
  icon: IconSource
  /** Accessibility label for screen readers (required). */
  accessibilityLabel: string
  /** Called when the action is pressed. */
  onPress?: () => void
  /**
   * Disables the action.
   * @default false
   */
  disabled?: boolean
}

interface SearchBarCommonProps extends Omit<
  TextInputProps,
  'editable' | 'style'
> {
  /**
   * Icon rendered at the start of the bar. Accepts a string name (resolved
   * via the theme's `iconResolver`, defaulting to `MaterialCommunityIcons`),
   * a pre-rendered element, or a render function that receives `{ size, color }`.
   * @default 'magnify'
   */
  leadingIcon?: IconSource
  /**
   * Makes the leading icon a button — for a navigation icon such as a menu or
   * a back arrow. Label it with `leadingIconAccessibilityLabel`.
   */
  onLeadingIconPress?: () => void
  /** Accessibility label for the leading icon when it is a button. */
  leadingIconAccessibilityLabel?: string
  /** Called with the current query when the user submits from the keyboard. */
  onSearch?: (query: string) => void
  /**
   * Makes the bar a button, for a bar that opens a `SearchView`. The bar is
   * then one tab stop with the `button` role, a press or Enter calls this,
   * and the input is read-only and out of the tab order. It still shows
   * `value` and the placeholder. The clear button and the trailing actions
   * stay buttons of their own.
   */
  onPress?: () => void
  /**
   * Density of the bar, on the Material density scale. `0` is the MD3 bar at
   * 56dp. Each step below removes 4dp: `-1` is 52dp, `-2` is 48dp, `-3` is
   * 44dp, and `-4` is 40dp, the frame of the icon buttons, so it is the
   * floor. Use a negative density in a desktop toolbar with small controls.
   * Text and icon sizes do not change.
   * @default 0
   */
  density?: SearchBarDensity
  /**
   * Shows a clear button while the bar holds text.
   * @default true
   */
  showClearButton?: boolean
  /**
   * Accessibility label for the clear button.
   * @default 'Clear search'
   */
  clearButtonAccessibilityLabel?: string
  /** Called after the clear button empties the bar. */
  onClear?: () => void
  /**
   * Disables the input and every button in the bar.
   * @default false
   */
  disabled?: boolean
  /**
   * Override the container (background) color. Hover and focus state-layer
   * colors are derived from it. Disabled state keeps the standard appearance.
   */
  containerColor?: string
  /**
   * Override the content (input text and icon) color. Disabled state keeps
   * the standard appearance.
   */
  contentColor?: string
  /** Additional style applied to the text input element. */
  inputStyle?: StyleProp<TextStyle>
  /**
   * Style applied to the root container. The MD3 maximum width is 720 dp —
   * set `maxWidth` here to change it.
   */
  style?: StyleProp<ViewStyle>
  /**
   * Ref to the inner `TextInput`, for imperative `focus()`, `blur()` and
   * `clear()` calls.
   */
  ref?: Ref<TextInput>
}

/**
 * Trailing slot of the SearchBar. `actions` and `trailing` fill the same
 * space, so they are mutually exclusive. The clear button is not part of the
 * slot: it shows before either one while the bar holds text.
 */
type SearchBarTrailingProps =
  | {
      /** Icon buttons rendered in the trailing slot, such as a voice action. */
      actions?: SearchBarAction[]
      trailing?: never
    }
  | {
      actions?: never
      /**
       * Custom trailing content, such as an `Avatar`. Use it instead of
       * `actions` when the slot needs something `actions` cannot build.
       */
      trailing: ReactNode
    }

/**
 * Props of the SearchBar. `actions` and `trailing` fill the same slot and are
 * mutually exclusive — see `SearchBarTrailingProps`.
 */
export type SearchBarProps = SearchBarCommonProps & SearchBarTrailingProps
