import type { MaterialTheme } from '@rootnative/core'
import { elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'
import type { TooltipVariant } from './types'

/**
 * MD3 tooltip metrics.
 * Source: androidx.compose.material3.Tooltip.kt + PlainTooltipTokens /
 * RichTooltipTokens —
 * `SpacingBetweenTooltipAndAnchor = 4.dp`,
 * `TooltipMinWidth = 40.dp`, `TooltipMinHeight = 24.dp`,
 * `TooltipDefaults.plainTooltipMaxWidth = 200.dp`,
 * `PlainTooltipContentPadding = PaddingValues(8.dp, 4.dp)`,
 * `PlainTooltipTokens.ContainerColor = inverseSurface`,
 * `PlainTooltipTokens.ContainerShape = CornerExtraSmall` (4dp),
 * `PlainTooltipTokens.SupportingTextFont = BodySmall`,
 * `PlainTooltipTokens.SupportingTextColor = inverseOnSurface`,
 * `TooltipDefaults.richTooltipMaxWidth = 320.dp`,
 * `RichTooltipHorizontalPadding = 16.dp`,
 * `ActionLabelMinHeight = 36.dp`, `ActionLabelBottomPadding = 8.dp`,
 * `RichTooltipTokens.ContainerColor = surfaceContainer`,
 * `RichTooltipTokens.ContainerShape = CornerMedium` (12dp),
 * `RichTooltipTokens.ContainerElevation = Level2`,
 * `RichTooltipTokens.SubheadFont = TitleSmall`,
 * `RichTooltipTokens.SupportingTextFont = BodyMedium`,
 * both in `RichTooltipTokens.SubheadColor / SupportingTextColor =
 * onSurfaceVariant`.
 */
export const TOOLTIP_ANCHOR_SPACING = 4
export const TOOLTIP_MIN_WIDTH = 40
export const TOOLTIP_MIN_HEIGHT = 24
export const PLAIN_TOOLTIP_MAX_WIDTH = 200
export const RICH_TOOLTIP_MAX_WIDTH = 320
export const TOOLTIP_ACTION_MIN_HEIGHT = 36

/** MD3's `BasicTooltipDefaults.TooltipDuration = 1500L`. */
export const PLAIN_TOOLTIP_DURATION = 1500

const PLAIN_PADDING_HORIZONTAL = 8
const PLAIN_PADDING_VERTICAL = 4
const RICH_PADDING_HORIZONTAL = 16
const RICH_PADDING_VERTICAL = 12
const RICH_ACTIONS_PADDING_BOTTOM = 8

/**
 * Compose spaces the rich tooltip's text from its subhead with
 * `paddingFromBaseline`, which React Native has no equivalent for. 4dp between
 * the two line boxes lands on the same visual gap for the MD3 type scale.
 */
const RICH_SUBHEAD_GAP = 4

export function createTooltipStyles(
  theme: MaterialTheme,
  variant: TooltipVariant,
  hasActions: boolean,
  containerColor?: string,
  contentColor?: string,
) {
  const isRich = variant === 'rich'

  return StyleSheet.create({
    // The anchor's wrapper is a `Pressable` (hover has to be caught above the
    // anchor, not injected into it), and react-native-web gives every Pressable
    // `cursor: 'pointer'`. Undo it: the wrapper is not a control, and an anchor
    // that is one paints its own cursor on top of this.
    anchorWrapper: {
      cursor: 'auto',
    },
    // Absolute-fills the portal layer, giving the anchor-relative surface a
    // coordinate space to be positioned in.
    layer: {
      ...StyleSheet.absoluteFillObject,
    },
    // Rich tooltips are persistent, so they need a way out. Transparent, never
    // a scrim — a tooltip does not dim what it describes.
    dismissRegion: {
      ...StyleSheet.absoluteFillObject,
    },
    surface: {
      position: 'absolute',
      minWidth: TOOLTIP_MIN_WIDTH,
      minHeight: TOOLTIP_MIN_HEIGHT,
      maxWidth: isRich ? RICH_TOOLTIP_MAX_WIDTH : PLAIN_TOOLTIP_MAX_WIDTH,
      justifyContent: 'center',
      borderRadius: isRich
        ? theme.shape.cornerMedium
        : theme.shape.cornerExtraSmall,
      backgroundColor:
        containerColor ??
        (isRich ? theme.colors.surfaceContainer : theme.colors.inverseSurface),
      paddingHorizontal: isRich
        ? RICH_PADDING_HORIZONTAL
        : PLAIN_PADDING_HORIZONTAL,
      paddingTop: isRich ? RICH_PADDING_VERTICAL : PLAIN_PADDING_VERTICAL,
      paddingBottom: isRich
        ? hasActions
          ? RICH_ACTIONS_PADDING_BOTTOM
          : RICH_PADDING_VERTICAL
        : PLAIN_PADDING_VERTICAL,
      // Plain tooltips carry no elevation of their own in MD3 — the inverse
      // surface is what separates them from the content behind.
      ...(isRich ? elevationStyle(theme.elevation.level2) : null),
    },
    subhead: {
      ...theme.typography.titleSmall,
      color: contentColor ?? theme.colors.onSurfaceVariant,
      marginBottom: RICH_SUBHEAD_GAP,
    },
    text: isRich
      ? {
          ...theme.typography.bodyMedium,
          color: contentColor ?? theme.colors.onSurfaceVariant,
        }
      : {
          ...theme.typography.bodySmall,
          color: contentColor ?? theme.colors.inverseOnSurface,
        },
    // Start-aligned, matching the `Column` the compose implementation lays the
    // action out in — the opposite of a dialog's end-aligned actions.
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: theme.spacing.sm,
      minHeight: TOOLTIP_ACTION_MIN_HEIGHT,
      marginTop: RICH_PADDING_VERTICAL,
    },
  })
}
