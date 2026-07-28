import type { ReactNode } from 'react'
import type { StyleProp, TextStyle, ViewProps, ViewStyle } from 'react-native'

/**
 * `'plain'` is the transient one-liner that describes a control. `'rich'` is
 * the persistent surface with an optional subhead and actions — it stays up
 * until it is dismissed.
 */
export type TooltipVariant = 'plain' | 'rich'

/** Side of the anchor the tooltip opens on when it fits there. */
export type TooltipSide = 'top' | 'bottom'

/**
 * Cross-axis alignment against the anchor, in logical terms — `'start'` is the
 * anchor's left edge in LTR and its right edge in RTL.
 */
export type TooltipAlign = 'start' | 'center' | 'end'

export interface TooltipProps extends ViewProps {
  /**
   * The control the tooltip describes. Rendered where the `<Tooltip>` sits in
   * the tree, wrapped in a measuring view that watches for hover.
   *
   * Touch devices open the tooltip on a long press, which needs the anchor to
   * accept `onLongPress` — every RootNative pressable does. Its own
   * `onLongPress` still fires.
   */
  anchor: ReactNode
  /**
   * Supporting text, or arbitrary nodes when a plain string isn't enough.
   * Strings and numbers are wrapped in the variant's supporting-text styling.
   */
  children?: ReactNode
  /**
   * Tooltip anatomy.
   * @default 'plain'
   */
  variant?: TooltipVariant
  /** Subhead above the supporting text. Rich tooltips only. */
  subhead?: string
  /**
   * Action buttons below the supporting text — text `Button`s per MD3. Rich
   * tooltips only.
   */
  actions?: ReactNode
  /**
   * Controlled visibility. Omit to let the tooltip show itself on hover or a
   * long press, and hide itself on hover out, on an anchor press, after
   * `duration` (plain), or on an outside press / Android back (rich).
   */
  visible?: boolean
  /**
   * Called when the tooltip hides — hover out, anchor press, the plain
   * variant's timeout, or a rich tooltip's outside press / Android back.
   * Required to close a controlled tooltip; optional otherwise.
   */
  onDismiss?: () => void
  /**
   * Side of the anchor the tooltip prefers. It flips to the other side when it
   * does not fit and that side is roomier.
   * @default 'top'
   */
  side?: TooltipSide
  /**
   * Cross-axis alignment against the anchor.
   * @default 'center'
   */
  align?: TooltipAlign
  /**
   * Gap between the anchor edge and the tooltip, in dp.
   * @default 4
   */
  offset?: number
  /**
   * Minimum distance the tooltip keeps from every screen edge, in dp.
   * @default 8
   */
  screenMargin?: number
  /**
   * How long a plain tooltip stays up, in milliseconds. `0` keeps it up until
   * something else hides it. Ignored by the rich variant, which is persistent
   * by definition.
   * @default 1500
   */
  duration?: number
  /**
   * Override the container (surface) color.
   * @default inverseSurface (plain) / surfaceContainer (rich)
   */
  containerColor?: string
  /**
   * Override the text color — the supporting text, plus the subhead on a rich
   * tooltip. Nodes passed as `children` or `actions` are yours to color.
   * @default inverseOnSurface (plain) / onSurfaceVariant (rich)
   */
  contentColor?: string
  /**
   * Name of the `PortalHost` to render into. Defaults to the root host, which
   * is what puts the tooltip above every other layer.
   */
  hostName?: string
  /** Style applied to the tooltip surface. */
  style?: StyleProp<ViewStyle>
  /** Style applied to the supporting-text `Text` only. */
  textStyle?: StyleProp<TextStyle>
  /** Style applied to the view wrapping the anchor. */
  anchorStyle?: StyleProp<ViewStyle>
  /**
   * Screen-reader label for the region that closes a rich tooltip on an
   * outside press. Plain tooltips never render one.
   * @default 'Close tooltip'
   */
  dismissAccessibilityLabel?: string
  /** Test id applied to the tooltip surface. */
  testID?: string
}
