import type { IconSource } from '@rootnative/utils'
import type { ReactNode } from 'react'
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native'

/**
 * `'modal'` slides in over the content behind a scrim and renders through
 * `Portal`. `'standard'` renders in place, beside the main content, which
 * stays interactive.
 */
export type SideSheetVariant = 'modal' | 'standard'

/** Screen edge a modal side sheet enters from. Follows the layout direction. */
export type SideSheetEdge = 'start' | 'end'

interface SideSheetCommonProps extends Omit<ViewProps, 'children' | 'style'> {
  /** Sheet content. It scrolls between the header and the actions. */
  children?: ReactNode
  /**
   * Headline in `titleLarge` at the top of the sheet. It is also the
   * accessible name of the sheet when `accessibilityLabel` is not set.
   */
  headline?: string
  /**
   * The outline level of the headline on web, where it renders as `<hN>`.
   * Native has no heading levels and ignores it.
   * @default 2
   */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
  /**
   * Shows a back button before the headline and calls this on press. Use it
   * when the sheet shows a second level of content.
   */
  onBack?: () => void
  /**
   * Icon for the back button.
   * @default 'arrow-left' ('arrow-right' in RTL)
   */
  backIcon?: IconSource
  /**
   * Screen-reader label for the back button.
   * @default 'Back'
   */
  backAccessibilityLabel?: string
  /**
   * Icon for the close button. The close button shows when the sheet has an
   * `onDismiss`.
   * @default 'close'
   */
  closeIcon?: IconSource
  /**
   * Screen-reader label for the close button.
   * @default 'Close'
   */
  closeAccessibilityLabel?: string
  /**
   * Action buttons in a row below the content, such as a filled "Save" and an
   * outlined "Cancel". The row stays in place while the content scrolls.
   */
  actions?: ReactNode
  /**
   * Whether a divider separates the actions from the content. Ignored
   * without `actions`.
   * @default true
   */
  showActionsDivider?: boolean
  /**
   * Whether the sheet is detached from the screen edges by a 16dp margin,
   * with all four corners rounded.
   * @default false
   */
  detached?: boolean
  /**
   * Width of the sheet in dp. A modal sheet shrinks on a narrow window, so a
   * strip of scrim stays visible. Set the width here and not in `style`: the
   * slide distance of a modal sheet comes from this value.
   * @default 256
   */
  width?: number
  /**
   * Whether the sheet's content is padded by the top safe-area inset. The
   * container color still extends under the inset.
   * @default true for 'modal', false for 'standard'
   */
  insetTop?: boolean
  /**
   * Whether the sheet's content is padded by the bottom safe-area inset.
   * @default true for 'modal', false for 'standard'
   */
  insetBottom?: boolean
  /**
   * Override the sheet background.
   * @default surfaceContainerLow for 'modal', surface for 'standard'
   */
  containerColor?: string
  /**
   * Override the color of the headline and of the back and close icons. The
   * hover and press layers of the two buttons derive from it.
   * @default onSurface for the headline, onSurfaceVariant for the icons
   */
  contentColor?: string
  /** Style applied to the headline `Text`. */
  headlineStyle?: StyleProp<TextStyle>
  /** Style applied to the sheet surface. */
  style?: StyleProp<ViewStyle>
  /**
   * Screen-reader label for the sheet. Defaults to `headline`. A modal sheet
   * is announced as a dialog, so it needs a name.
   */
  accessibilityLabel?: string
  /**
   * Test id applied to the sheet surface. A modal sheet's scrim carries
   * `<testID>-scrim`, and the layer that slides carries `<testID>-layer`.
   */
  testID?: string
}

interface SideSheetModalProps {
  /** @default 'modal' */
  variant?: 'modal'
  /** Whether the sheet is shown. Exit animations run before it unmounts. */
  visible: boolean
  /**
   * Called when the user dismisses the sheet: the close button, a scrim
   * press, the Android back button, or Escape on web. Set `visible` to
   * `false` in response.
   */
  onDismiss: () => void
  /**
   * Whether the scrim press, the Android back button, and Escape dismiss the
   * sheet. The close button always calls `onDismiss`.
   * @default true
   */
  dismissable?: boolean
  /**
   * Screen edge the sheet enters from. `'end'` is the right edge in LTR and
   * the left edge in RTL.
   * @default 'end'
   */
  edge?: SideSheetEdge
  /** Render into a specific named `PortalHost`. */
  hostName?: string
  /** Style applied to the scrim. */
  scrimStyle?: StyleProp<ViewStyle>
  /**
   * Screen-reader label for the scrim's dismiss action.
   * @default 'Close side sheet'
   */
  scrimAccessibilityLabel?: string
}

interface SideSheetStandardProps {
  variant: 'standard'
  /**
   * Called by the close button. Omit it for a sheet with no close button.
   * Remove the sheet from the layout in response.
   */
  onDismiss?: () => void
  visible?: never
  dismissable?: never
  edge?: never
  hostName?: never
  scrimStyle?: never
  scrimAccessibilityLabel?: never
}

/**
 * A modal sheet takes `visible` and `onDismiss`. A standard sheet takes an
 * optional `onDismiss` for its close button, and the type rejects the other
 * modal props on it.
 */
export type SideSheetProps = SideSheetCommonProps &
  (SideSheetModalProps | SideSheetStandardProps)
