import type { MaterialTheme } from '@rootnative/core'
import { StyleSheet } from 'react-native'
import { NAV_RAIL_ITEM_WIDTH } from '../navigation-bar/styles'
import type { NavigationRailAlign } from './types'

/**
 * MD3 navigation rail metrics.
 * Source: androidx.compose.material3 NavigationRailTokens + NavigationRail.kt —
 * `ContainerColor = surface`, `ContainerElevation = Level0`,
 * `ContainerWidth = 80.dp`, `NavigationRailVerticalPadding = 4.dp` (the
 * column's top and bottom padding, and the space between destinations),
 * `NavigationRailHeaderPadding = 8.dp` (below the header).
 *
 * The destination tokens (56×32dp `secondaryContainer` pill, 24dp icon,
 * `labelMedium` label, `onSecondaryContainer` active icon, `secondary` active
 * label, `onSurfaceVariant` inactive) are the ones `NavigationItem` already
 * paints for the bar, so the two components agree on the active destination.
 * The Expressive 96dp collapsed wide rail is a possible 1.x variant; this
 * rail uses compose's `NavigationRail`.
 */
export const NAVIGATION_RAIL_WIDTH = NAV_RAIL_ITEM_WIDTH
export const NAV_RAIL_VERTICAL_PADDING = 4
export const NAV_RAIL_HEADER_PADDING = 8

const ALIGN_TO_JUSTIFY: Record<
  NavigationRailAlign,
  'flex-start' | 'center' | 'flex-end'
> = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
}

export function createNavigationRailStyles(
  theme: MaterialTheme,
  align: NavigationRailAlign,
  containerColor?: string,
) {
  return StyleSheet.create({
    root: {
      width: NAVIGATION_RAIL_WIDTH,
      alignSelf: 'stretch',
      alignItems: 'center',
      paddingVertical: NAV_RAIL_VERTICAL_PADDING,
      backgroundColor: containerColor ?? theme.colors.surface,
    },
    header: {
      alignItems: 'center',
      paddingBottom: NAV_RAIL_HEADER_PADDING,
    },
    // Grows to the rest of the rail so `align` has a full column to place
    // the destinations in.
    destinations: {
      flexGrow: 1,
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: ALIGN_TO_JUSTIFY[align],
      gap: NAV_RAIL_VERTICAL_PADDING,
    },
  })
}
