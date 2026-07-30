import type { IconSource } from '@rootnative/utils'
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native'

/**
 * When destination labels are shown. `'always'` keeps every label visible,
 * `'selected'` shows only the active destination's label (the others fade in
 * on selection), `'never'` hides them all and centres the icons.
 */
export type NavigationBarLabelVisibility = 'always' | 'selected' | 'never'

/** A single destination. */
export interface NavigationBarItem {
  /** Stable identifier used for selection state and the change callback. */
  value: string
  /**
   * Text label under the icon. One line — a label that doesn't fit is
   * truncated. Also the destination's screen-reader name, so it stays
   * required even when `labelVisibility` hides it.
   */
  label: string
  /**
   * Icon at 24dp. Accepts a string name (resolved via the theme's
   * `iconResolver`), a pre-rendered element, or a render function.
   */
  icon: IconSource
  /**
   * Icon shown while the destination is active — MD3 pairs an outlined
   * resting icon with its filled counterpart. Falls back to `icon`.
   */
  selectedIcon?: IconSource
  /** Greys the destination out at 38% and stops it responding. */
  disabled?: boolean
  /** Screen-reader label. Defaults to `label`. */
  accessibilityLabel?: string
}

export interface NavigationBarProps extends Omit<ViewProps, 'children'> {
  /** The destinations to render. MD3 recommends 3–5. */
  items: NavigationBarItem[]
  /** Value of the active destination (controlled). */
  value?: string
  /**
   * Value of the initially active destination (uncontrolled). Defaults to
   * the first item — a navigation bar with nothing active reads as broken.
   */
  defaultValue?: string
  /** Called with the value of the destination that was pressed. */
  onValueChange?: (value: string) => void
  /**
   * When destination labels are shown.
   * @default 'always'
   */
  labelVisibility?: NavigationBarLabelVisibility
  /**
   * When `true`, wraps the row in a SafeAreaView that adds the bottom inset
   * below the bar's 80dp, so it clears the home indicator. Leave it off when
   * an ancestor (e.g. `Layout` with a `bottom` edge) already handles it.
   * @default false
   */
  insetBottom?: boolean
  /**
   * Override the bar background.
   * @default surfaceContainer
   */
  containerColor?: string
  /**
   * Override the icon and label color of inactive destinations.
   * @default onSurfaceVariant
   */
  contentColor?: string
  /**
   * Override the icon and label color of the active destination. State-layer
   * colors are derived from it automatically.
   * @default onSecondaryContainer (icon) / secondary (label)
   */
  selectedContentColor?: string
  /**
   * Override the active indicator pill color.
   * @default secondaryContainer
   */
  indicatorColor?: string
  /**
   * Style applied to every destination's label `Text` — does not affect the
   * icons.
   */
  labelStyle?: StyleProp<TextStyle>
  /** Style applied to the bar container. */
  style?: StyleProp<ViewStyle>
  /** Screen-reader label for the bar itself. */
  accessibilityLabel?: string
  /**
   * Test id applied to the bar container. Each destination carries
   * `<testID>-item-<value>` and its indicator `<testID>-item-<value>-indicator`.
   */
  testID?: string
}
