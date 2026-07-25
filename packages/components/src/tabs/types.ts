import type { IconSource } from '@rootnative/utils'
import type { StyleProp, TextStyle, ViewStyle } from 'react-native'

/**
 * `'primary'` sits directly under an app bar and marks the active tab with a
 * short indicator under its label. `'secondary'` sits inside content, below a
 * primary row, and marks the active tab with a full-width indicator.
 */
export type TabsVariant = 'primary' | 'secondary'

/** A single tab. */
export interface TabItem {
  /** Stable identifier used for selection state and the change callback. */
  value: string
  /** Text label. One line — a label that doesn't fit is truncated. */
  label?: string
  /**
   * Icon at 24dp. Accepts a string name (resolved via the theme's
   * `iconResolver`), a pre-rendered element, or a render function.
   *
   * A primary tab stacks the icon above the label and grows to 64dp; a
   * secondary tab puts it before the label and stays 48dp.
   */
  icon?: IconSource
  /** Greys the tab out at 38% and stops it responding. */
  disabled?: boolean
  /** Screen-reader label. Defaults to `label`. */
  accessibilityLabel?: string
}

export interface TabsProps {
  /** The tabs to render. */
  items: TabItem[]
  /** Value of the active tab (controlled). */
  value?: string
  /**
   * Value of the initially active tab (uncontrolled). Defaults to the first
   * item — a tab row with nothing active reads as broken.
   */
  defaultValue?: string
  /** Called with the value of the tab that was pressed. */
  onValueChange?: (value: string) => void
  /**
   * Tab anatomy.
   * @default 'primary'
   */
  variant?: TabsVariant
  /**
   * Lay the tabs out at their natural width and scroll horizontally, instead
   * of dividing the row equally between them. Reach for it past four tabs, or
   * when the labels are long enough to truncate.
   * @default false
   */
  scrollable?: boolean
  /**
   * Padding before the first and after the last tab, in dp. Scrollable rows
   * only — a fixed row divides the full width between its tabs.
   * @default 52
   */
  edgePadding?: number
  /**
   * Whether the 1dp divider is drawn along the bottom of the row.
   * @default true
   */
  showDivider?: boolean
  /**
   * Override the row background.
   * @default surface
   */
  containerColor?: string
  /**
   * Override the label and icon color of inactive tabs.
   * @default onSurfaceVariant
   */
  contentColor?: string
  /**
   * Override the label and icon color of the active tab. State-layer colors
   * are derived from it automatically.
   * @default primary (primary variant) / onSurface (secondary variant)
   */
  selectedContentColor?: string
  /**
   * Override the active indicator color.
   * @default primary
   */
  indicatorColor?: string
  /** Style applied to every tab's label `Text` — does not affect the icons. */
  labelStyle?: StyleProp<TextStyle>
  /** Style applied to the row container. */
  style?: StyleProp<ViewStyle>
  /** Screen-reader label for the tab row itself. */
  accessibilityLabel?: string
  /** Test id applied to the row container. */
  testID?: string
}
