import type { MaterialTheme } from '@rootnative/core'
import { elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'

/**
 * MD3 bottom app bar metrics.
 * Source: androidx.compose.material3 BottomAppBarTokens + BottomAppBar.kt —
 * `ContainerColor = surfaceContainer`, `ContainerElevation = Level2`,
 * `ContainerHeight = 80.dp`, `BottomAppBarHorizontalPadding = 4.dp` (16dp
 * minus the 12dp that a 48dp icon button carries around its 24dp icon), and
 * the FAB 16dp from the end edge. The FAB is 56dp, so it sits 12dp from the
 * top and the bottom of the bar. Compose gives the FAB
 * `bottomAppBarFabElevation()`, which is 0 in every state, and
 * `FabSecondaryTokens.ContainerColor`.
 */
export const BOTTOM_APP_BAR_HEIGHT = 80
export const BOTTOM_APP_BAR_HORIZONTAL_PADDING = 4
export const BOTTOM_APP_BAR_FAB_END_PADDING = 16
export const BOTTOM_APP_BAR_ICON_FRAME_SIZE = 48

export function createStyles(theme: MaterialTheme, containerColor?: string) {
  return StyleSheet.create({
    root: {
      backgroundColor: containerColor ?? theme.colors.surfaceContainer,
      ...elevationStyle(theme.elevation.level2),
    },
    row: {
      height: BOTTOM_APP_BAR_HEIGHT,
      paddingStart: BOTTOM_APP_BAR_HORIZONTAL_PADDING,
      flexDirection: 'row',
      alignItems: 'center',
    },
    slot: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 1,
      minWidth: 0,
    },
    // No fixed height: a row that stretches an `IconButton` keeps the button
    // at the top of the space it gets. A row centres it on the main axis,
    // and the parent centres this content-height frame.
    iconFrame: {
      width: BOTTOM_APP_BAR_ICON_FRAME_SIZE,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    spacer: {
      flex: 1,
    },
    fabFrame: {
      paddingEnd: BOTTOM_APP_BAR_FAB_END_PADDING,
    },
  })
}
