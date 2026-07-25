import type { MaterialTheme } from '@rootnative/core'
import { alphaColor, elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'
import type { DialogVariant } from './types'

/**
 * MD3 basic-dialog metrics.
 * Source: androidx.compose.material3.AlertDialog / DialogTokens —
 * `DialogPadding = 24.dp`, `IconPadding = bottom 16.dp`,
 * `TitlePadding = bottom 16.dp`, `TextPadding = bottom 24.dp`,
 * `DialogMinWidth = 280.dp`, `DialogMaxWidth = 560.dp`.
 */
export const DIALOG_PADDING = 24
export const DIALOG_MIN_WIDTH = 280
export const DIALOG_MAX_WIDTH = 560
export const DIALOG_ICON_SIZE = 24
const ICON_BOTTOM_PADDING = 16
const TITLE_BOTTOM_PADDING = 16
const CONTENT_BOTTOM_PADDING = 24
const ACTION_GAP = 8

/** MD3 scrim opacity for modal surfaces. */
export const DIALOG_SCRIM_OPACITY = 0.32

/** MD3 full-screen dialog header height. */
const FULLSCREEN_HEADER_HEIGHT = 56
/** Distance the fullscreen surface travels on enter/exit. */
export const FULLSCREEN_SLIDE = 48

export function createDialogStyles(
  theme: MaterialTheme,
  variant: DialogVariant,
  containerColor?: string,
) {
  const isFullscreen = variant === 'fullscreen'
  const surfaceColor =
    containerColor ??
    (isFullscreen ? theme.colors.surface : theme.colors.surfaceContainerHigh)

  return StyleSheet.create({
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: alphaColor(theme.colors.scrim, DIALOG_SCRIM_OPACITY),
    },
    // Centering layer for the basic variant. `box-none` so taps on the empty
    // area fall through to the scrim below and dismiss.
    centerLayer: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.lg,
    },
    fullscreenLayer: {
      ...StyleSheet.absoluteFillObject,
    },
    container: {
      minWidth: DIALOG_MIN_WIDTH,
      maxWidth: DIALOG_MAX_WIDTH,
      width: '100%',
      padding: DIALOG_PADDING,
      borderRadius: theme.shape.cornerExtraLarge,
      backgroundColor: surfaceColor,
      ...elevationStyle(theme.elevation.level3),
    },
    fullscreenContainer: {
      flex: 1,
      backgroundColor: surfaceColor,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: FULLSCREEN_HEADER_HEIGHT,
      paddingStart: theme.spacing.xs,
      paddingEnd: theme.spacing.md,
      gap: theme.spacing.md,
    },
    headerTitle: {
      flex: 1,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ACTION_GAP,
    },
    fullscreenBody: {
      flexGrow: 1,
      padding: DIALOG_PADDING,
    },
    icon: {
      alignItems: 'center',
      paddingBottom: ICON_BOTTOM_PADDING,
    },
    title: {
      ...theme.typography.headlineSmall,
      color: theme.colors.onSurface,
      paddingBottom: TITLE_BOTTOM_PADDING,
      // MD3 centers the headline only when the dialog carries an icon; the
      // icon slot applies that override.
      textAlign: 'left',
    },
    titleCentered: {
      textAlign: 'center',
    },
    fullscreenTitle: {
      ...theme.typography.titleLarge,
      color: theme.colors.onSurface,
      paddingBottom: 0,
    },
    content: {
      paddingBottom: CONTENT_BOTTOM_PADDING,
    },
    contentFlush: {
      paddingBottom: 0,
    },
    supportingText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: ACTION_GAP,
    },
  })
}
