import type { IconSource } from '@rootnative/utils'
import type { ReactNode } from 'react'
import type {
  PressableProps,
  StyleProp,
  TextStyle,
  ViewProps,
  ViewStyle,
} from 'react-native'
import type { DividerProps } from '../divider/types'

/**
 * `'modal'` slides in over the content from the start edge, behind a scrim,
 * and renders through `Portal`. `'standard'` renders in place as a permanent
 * side panel, for an expanded window.
 */
export type NavigationDrawerVariant = 'modal' | 'standard'

interface NavigationDrawerCommonProps extends Omit<
  ViewProps,
  'children' | 'style'
> {
  /**
   * `NavigationDrawer.Item`s, grouped with `NavigationDrawer.Section` and
   * separated with `NavigationDrawer.Divider`. Arbitrary content, such as a
   * `Typography` headline at the top, is rendered as is.
   */
  children?: ReactNode
  /** Value of the active destination (controlled). */
  value?: string
  /**
   * Value of the initially active destination (uncontrolled). Omit it for a
   * drawer with no active destination.
   */
  defaultValue?: string
  /** Called with the value of the destination that was pressed. */
  onValueChange?: (value: string) => void
  /**
   * Whether the drawer's content is padded by the top safe-area inset. The
   * container color still extends under the inset.
   * @default true for 'modal', false for 'standard'
   */
  insetTop?: boolean
  /**
   * Whether the drawer's content is padded by the bottom safe-area inset.
   * @default true for 'modal', false for 'standard'
   */
  insetBottom?: boolean
  /**
   * Override the drawer background.
   * @default surfaceContainerLow for 'modal', surface for 'standard'
   */
  containerColor?: string
  /**
   * Override the icon, label, and badge color of inactive destinations, and
   * the section headlines.
   * @default onSurfaceVariant
   */
  contentColor?: string
  /**
   * Override the icon, label, and badge color of the active destination.
   * State-layer colors are derived from it automatically.
   * @default onSecondaryContainer
   */
  selectedContentColor?: string
  /**
   * Override the active indicator color.
   * @default secondaryContainer
   */
  indicatorColor?: string
  /**
   * Style applied to every destination's label `Text` — does not affect the
   * icons or the badges.
   */
  labelStyle?: StyleProp<TextStyle>
  /** Style applied to the drawer surface. */
  style?: StyleProp<ViewStyle>
  /**
   * Screen-reader label for the drawer. A modal drawer is announced as a
   * dialog, so it needs a name such as "Main navigation".
   */
  accessibilityLabel?: string
  /**
   * Test id applied to the drawer surface. A modal drawer's scrim carries
   * `<testID>-scrim`. Each `NavigationDrawer.Item` takes its own `testID`.
   */
  testID?: string
}

interface NavigationDrawerModalProps {
  /** @default 'modal' */
  variant?: 'modal'
  /** Whether the drawer is shown. Exit animations run before it unmounts. */
  visible: boolean
  /**
   * Called when the user dismisses the drawer — a scrim press, the Android
   * back button, Escape on web, or a destination press when `dismissOnSelect`
   * is on. Set `visible` to `false` in response.
   */
  onDismiss: () => void
  /**
   * Whether the scrim press, the Android back button, and Escape dismiss the
   * drawer.
   * @default true
   */
  dismissable?: boolean
  /**
   * Whether pressing a destination also calls `onDismiss`. MD3 closes a modal
   * drawer once a destination is chosen.
   * @default true
   */
  dismissOnSelect?: boolean
  /** Render into a specific named `PortalHost`. */
  hostName?: string
  /** Style applied to the scrim. */
  scrimStyle?: StyleProp<ViewStyle>
  /**
   * Screen-reader label for the scrim's dismiss action.
   * @default 'Close navigation drawer'
   */
  scrimAccessibilityLabel?: string
}

interface NavigationDrawerStandardProps {
  variant: 'standard'
  visible?: never
  onDismiss?: never
  dismissable?: never
  dismissOnSelect?: never
  hostName?: never
  scrimStyle?: never
  scrimAccessibilityLabel?: never
}

/**
 * A modal drawer takes `visible` and `onDismiss`; a standard drawer takes
 * neither. The type rejects a standard drawer with modal props.
 */
export type NavigationDrawerProps = NavigationDrawerCommonProps &
  (NavigationDrawerModalProps | NavigationDrawerStandardProps)

export interface NavigationDrawerItemProps extends Omit<
  PressableProps,
  'children' | 'style' | 'onPress' | 'disabled' | 'role'
> {
  /** Stable identifier used for selection state and the change callback. */
  value: string
  /** Text label. One line — a label that doesn't fit is truncated. */
  label: string
  /**
   * Leading icon at 24dp. Accepts a string name (resolved via the theme's
   * `iconResolver`), a pre-rendered element, or a render function. MD3
   * allows a drawer destination with no icon.
   */
  icon?: IconSource
  /**
   * Icon shown while the destination is active — MD3 pairs an outlined
   * resting icon with its filled counterpart. Falls back to `icon`.
   */
  selectedIcon?: IconSource
  /**
   * Trailing badge text, such as an unread count. Rendered as text at the end
   * of the row, per the MD3 drawer anatomy. Add it to `accessibilityLabel` so
   * a screen reader announces it.
   */
  badge?: number | string
  /**
   * Called when the destination is pressed, after the drawer's
   * `onValueChange`.
   */
  onPress?: () => void
  /** Greys the destination out at 38% and stops it responding. */
  disabled?: boolean
  /**
   * Style applied to this destination's label `Text`. Merged over the
   * drawer's `labelStyle`.
   */
  labelStyle?: StyleProp<TextStyle>
  /** Style applied to the destination row. */
  style?: StyleProp<ViewStyle>
  /** Screen-reader label. Defaults to `label`. */
  accessibilityLabel?: string
  /**
   * Test id applied to the row. The indicator carries `<testID>-indicator`.
   */
  testID?: string
}

export interface NavigationDrawerSectionProps extends Omit<
  ViewProps,
  'children' | 'style'
> {
  /**
   * Section headline in `titleSmall`, above the destinations. Omit it for a
   * group with no title.
   */
  headline?: string
  /**
   * The outline level of the headline on web, where it renders as `<hN>`.
   * Native has no heading levels and ignores it.
   * @default 2
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  /** The section's `NavigationDrawer.Item`s. */
  children?: ReactNode
  /** Style applied to the headline `Text`. */
  headlineStyle?: StyleProp<TextStyle>
  /** Style applied to the section container. */
  style?: StyleProp<ViewStyle>
}

/**
 * A `Divider` with the MD3 drawer insets. `orientation` and the insets are
 * fixed.
 */
export type NavigationDrawerDividerProps = Omit<
  DividerProps,
  'orientation' | 'insetStart' | 'insetEnd'
>
