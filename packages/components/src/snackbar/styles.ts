import type { MaterialTheme } from '@rootnative/core'
import { elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'

/**
 * MD3 snackbar metrics.
 * Source: androidx.compose.material3.tokens.SnackbarTokens — container
 * `inverseSurface`, `ContainerShape` corner extra small (4dp),
 * `ContainerElevation` level3, supporting text `bodyMedium` in
 * `inverseOnSurface`, action label `labelLarge` in `inversePrimary`.
 */
export const SNACKBAR_MAX_WIDTH = 600
export const SNACKBAR_MARGIN = 16
export const SNACKBAR_CLOSE_ICON_SIZE = 24

/**
 * 48dp single-line / 68dp two-line comes out of centering a 20dp `bodyMedium`
 * line box in 14dp of vertical padding: 20 + 28 = 48, 40 + 28 = 68.
 */
const TEXT_PADDING_VERTICAL = 14

/** Distance the snackbar travels on enter/exit. */
export const SNACKBAR_SLIDE = 24

export function createSnackbarStyles(
  theme: MaterialTheme,
  bottomOffset: number,
  hasTrailing: boolean,
  containerColor?: string,
  contentColor?: string,
  actionColor?: string,
) {
  return StyleSheet.create({
    // Bottom-anchored layer. `box-none` so the rest of the overlay stays
    // tappable while a snackbar is up — snackbars never block the UI.
    layer: {
      position: 'absolute',
      start: 0,
      end: 0,
      bottom: 0,
      alignItems: 'center',
      paddingHorizontal: SNACKBAR_MARGIN,
      paddingBottom: SNACKBAR_MARGIN + bottomOffset,
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      // `width: '100%'` inside the 16dp-margined layer already produces the
      // MD3 compact behaviour (full width minus margins), so the 344dp minimum
      // would only ever fight small screens.
      width: '100%',
      maxWidth: SNACKBAR_MAX_WIDTH,
      minHeight: 48,
      borderRadius: theme.shape.cornerExtraSmall,
      backgroundColor: containerColor ?? theme.colors.inverseSurface,
      paddingStart: SNACKBAR_MARGIN,
      paddingEnd: hasTrailing ? theme.spacing.sm : SNACKBAR_MARGIN,
      ...elevationStyle(theme.elevation.level3),
    },
    message: {
      ...theme.typography.bodyMedium,
      color: contentColor ?? theme.colors.inverseOnSurface,
      flex: 1,
      paddingVertical: TEXT_PADDING_VERTICAL,
    },
    trailing: {
      flexDirection: 'row',
      alignItems: 'center',
      marginStart: theme.spacing.sm,
    },
    actionLabel: {
      ...theme.typography.labelLarge,
      color: actionColor ?? theme.colors.inversePrimary,
    },
  })
}

export function resolveActionColor(
  theme: MaterialTheme,
  actionColor?: string,
): string {
  return actionColor ?? theme.colors.inversePrimary
}

export function resolveContentColor(
  theme: MaterialTheme,
  contentColor?: string,
): string {
  return contentColor ?? theme.colors.inverseOnSurface
}
