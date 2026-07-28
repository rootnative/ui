import type { ReactNode } from 'react'
import type { StyleProp, ViewProps, ViewStyle } from 'react-native'

/**
 * `'modal'` blocks the screen behind a scrim. `'standard'` overlays the bottom
 * edge without a scrim, leaving the rest of the screen interactive.
 */
export type BottomSheetVariant = 'modal' | 'standard'

/**
 * A snap point is the sheet's visible height at rest — a number in dp, or a
 * percentage string (`'50%'`) of the portal host's height.
 */
export type BottomSheetSnapPoint = number | `${number}%`

export interface BottomSheetProps extends ViewProps {
  /** Whether the sheet is shown. Exit animations run before it unmounts. */
  visible: boolean
  /**
   * Called when the user dismisses the sheet — a drag below the lowest snap
   * point, a scrim tap, or the Android back button. Set `visible` to `false`
   * in response, or the sheet stays mounted off screen.
   */
  onDismiss: () => void
  /** Sheet content. Renders below the drag handle; scrolling is yours. */
  children?: ReactNode
  /**
   * Sheet behavior.
   * @default 'modal'
   */
  variant?: BottomSheetVariant
  /**
   * Resting heights the sheet snaps to, e.g. `[240, '90%']`. The sheet is
   * sized to the tallest one; indices used by `snapIndex` /
   * `defaultSnapIndex` / `onSnapIndexChange` refer to the points sorted
   * ascending by resolved height. Omit to size the sheet to its content with
   * a single snap.
   */
  snapPoints?: BottomSheetSnapPoint[]
  /**
   * Snap index to settle at. Changing it animates the sheet there; the user
   * can still drag to other snaps, reported through `onSnapIndexChange`.
   */
  snapIndex?: number
  /**
   * Snap index the sheet opens at.
   * @default 0
   */
  defaultSnapIndex?: number
  /** Called when the sheet settles at a different snap point. */
  onSnapIndexChange?: (index: number) => void
  /**
   * Whether the scrim tap, the Android back button, and a downward drag past
   * the lowest snap point dismiss the sheet. When `false`, drags below the
   * lowest snap rubber-band back.
   * @default true
   */
  dismissable?: boolean
  /**
   * Whether the drag handle is shown. Without it the sheet cannot be dragged —
   * dismissal is limited to the scrim and the back button.
   * @default true
   */
  showDragHandle?: boolean
  /**
   * Whether the sheet's content is padded by the bottom safe-area inset. The
   * container color still extends under the inset.
   * @default true
   */
  insetBottom?: boolean
  /**
   * Override the container (surface) color.
   * @default surfaceContainerLow
   */
  containerColor?: string
  /** Render into a specific named `PortalHost`. */
  hostName?: string
  /** Style applied to the sheet surface. */
  style?: StyleProp<ViewStyle>
  /** Style applied to the scrim. Ignored by the standard variant. */
  scrimStyle?: StyleProp<ViewStyle>
  /** Screen-reader label for the scrim's dismiss action. @default 'Close sheet' */
  scrimAccessibilityLabel?: string
  /** Screen-reader label for the drag handle. @default 'Drag handle' */
  dragHandleAccessibilityLabel?: string
  /** Test id applied to the sheet surface. */
  testID?: string
}
