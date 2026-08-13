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

/**
 * The `bottomOffset` that clears an element of `height` sitting at the bottom
 * edge — usually a FAB. Pass `FAB_SIZES[size]` from `@rootnative/components`.
 *
 * Exists because the alternative is a magic number. The layer already adds
 * `SNACKBAR_MARGIN` and the safe-area inset itself, so a consumer working the
 * clearance out by hand has to know both that the margin is applied and that
 * the inset is not theirs to add — and their number goes stale when a FAB size
 * or the margin changes. The `88` in the old docs was exactly that: 56 + 16 + 16.
 *
 * Takes a raw height rather than a `FABSize` on purpose. Importing `FAB_SIZES`
 * here would make `fab` a component dependency of `snackbar`, so every
 * `rootnative add snackbar` would copy the whole FAB component in for four
 * numbers. It also keeps the helper usable for a bottom bar or any other
 * bottom-anchored element.
 */
export function snackbarOffsetFor(height: number): number {
  return height + SNACKBAR_MARGIN
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
