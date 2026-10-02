import type { ReactNode } from 'react'
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native'
import type {
  NavigationBarItem,
  NavigationBarLabelVisibility,
} from '../navigation-bar/types'

/**
 * A single destination. The same shape as a `NavigationBarItem`, so one
 * array can feed a `NavigationBar` on a compact window and a `NavigationRail`
 * on a wider one.
 */
export type NavigationRailItem = NavigationBarItem

/**
 * When destination labels are shown. `'always'` keeps every label visible,
 * `'selected'` shows only the active destination's label, `'never'` hides
 * them all and grows the indicator to a 56dp circle.
 */
export type NavigationRailLabelVisibility = NavigationBarLabelVisibility

/** Where the destinations sit along the rail's height. */
export type NavigationRailAlign = 'top' | 'center' | 'bottom'

export interface NavigationRailProps extends Omit<ViewProps, 'children'> {
  /** The destinations to render. MD3 recommends 3–7. */
  items: NavigationRailItem[]
  /** Value of the active destination (controlled). */
  value?: string
  /**
   * Value of the initially active destination (uncontrolled). Defaults to
   * the first item — a rail with nothing active reads as broken.
   */
  defaultValue?: string
  /** Called with the value of the destination that was pressed. */
  onValueChange?: (value: string) => void
  /**
   * When destination labels are shown.
   * @default 'always'
   */
  labelVisibility?: NavigationRailLabelVisibility
  /**
   * Where the destinations sit along the rail. The header, when given, stays
   * at the top in every mode.
   * @default 'top'
   */
  align?: NavigationRailAlign
  /**
   * Content above the destinations: a menu `IconButton`, a `FAB`, or both
   * in a `Column`. MD3 places the FAB here when the screen has one.
   */
  header?: ReactNode
  /**
   * Override the rail background.
   * @default surface
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
  /** Style applied to the rail container. */
  style?: StyleProp<ViewStyle>
  /** Screen-reader label for the rail itself. */
  accessibilityLabel?: string
  /**
   * Test id applied to the rail container. The destinations column carries
   * `<testID>-destinations`, each destination `<testID>-item-<value>`, and
   * its indicator `<testID>-item-<value>-indicator`.
   */
  testID?: string
}
