import type { MaterialTheme } from '@rootnative/core'
import { elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'

/**
 * MD3 navigation bar metrics.
 * Source: androidx.compose.material3 NavigationBarTokens /
 * NavigationBarVerticalItemTokens + NavigationBar.kt —
 * `ContainerColor = surfaceContainer`, `ContainerElevation = Level2`,
 * `TallContainerHeight = 80.dp` (what compose's `NavigationBar` uses;
 * `ContainerHeight = 64.dp` is the Expressive short bar, a 1.x variant),
 * `ActiveIndicatorWidth = 56.dp`, `ActiveIndicatorHeight = 32.dp`,
 * `ItemActiveIndicatorShape = CornerFull`,
 * `ItemActiveIndicatorColor = secondaryContainer`,
 * `ItemActiveIconColor = onSecondaryContainer`,
 * `ItemActiveLabelTextColor = secondary`,
 * `ItemInactiveIconColor / ItemInactiveLabelTextColor = onSurfaceVariant`,
 * `LabelTextFont = LabelMedium`, `IconSize = 24.dp`,
 * `NavigationBarIndicatorToLabelPadding = 4.dp`,
 * `NavigationBarItemHorizontalPadding = 8.dp`, `ItemBetweenSpace = 0.dp`.
 *
 * The 1.0 plan pinned the pre-Expressive anatomy — a 64dp-wide indicator and
 * an `onSurface` active label. The current androidx tokens are
 * Expressive-updated (56dp pill, `secondary` label), and Expressive wins per
 * the audit convention.
 */
export const NAVIGATION_BAR_HEIGHT = 80
export const NAV_ITEM_ICON_SIZE = 24
export const NAV_INDICATOR_WIDTH = 56
export const NAV_INDICATOR_HEIGHT = 32
export const NAV_INDICATOR_LABEL_GAP = 4
export const NAV_ITEM_HORIZONTAL_PADDING = 8

/**
 * MD3 navigation rail item metrics, for the same `NavigationItem` placed in a
 * rail. Source: androidx.compose.material3 NavigationRailTokens +
 * NavigationRail.kt — `ContainerWidth = 80.dp` (also the item width),
 * `NoLabelActiveIndicatorHeight = 56.dp` (the item height, and the indicator
 * size when labels are hidden), `NavigationRailItemVerticalPadding = 4.dp`.
 * The indicator, icon, and label tokens are the ones above.
 */
export const NAV_RAIL_ITEM_WIDTH = 80
export const NAV_RAIL_ITEM_HEIGHT = 56
export const NAV_RAIL_ITEM_VERTICAL_PADDING = 4
export const NAV_RAIL_NO_LABEL_INDICATOR_SIZE = 56

/** Where a `NavigationItem` sits: the horizontal bar or the vertical rail. */
export type NavigationItemPlacement = 'bar' | 'rail'

/** Focus-ring geometry, matching the rest of the library. */
const FOCUS_RING_OFFSET = 2
const FOCUS_RING_WIDTH = 3

export interface NavigationBarColors {
  /** Inactive icon + label. */
  content: string
  /** Active icon. */
  selectedIcon: string
  /** Active label. */
  selectedLabel: string
  /** Active indicator pill. */
  indicator: string
}

export function getNavigationBarColors(
  theme: MaterialTheme,
  contentColor?: string,
  selectedContentColor?: string,
  indicatorColor?: string,
): NavigationBarColors {
  return {
    content: contentColor ?? theme.colors.onSurfaceVariant,
    selectedIcon: selectedContentColor ?? theme.colors.onSecondaryContainer,
    selectedLabel: selectedContentColor ?? theme.colors.secondary,
    indicator: indicatorColor ?? theme.colors.secondaryContainer,
  }
}

export function createNavigationBarStyles(
  theme: MaterialTheme,
  containerColor?: string,
) {
  return StyleSheet.create({
    root: {
      backgroundColor: containerColor ?? theme.colors.surfaceContainer,
      ...elevationStyle(theme.elevation.level2),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      height: NAVIGATION_BAR_HEIGHT,
    },
  })
}

export function createNavigationItemStyles(
  theme: MaterialTheme,
  selected: boolean,
  colors: NavigationBarColors,
  placement: NavigationItemPlacement = 'bar',
  labelVisible = true,
) {
  const inRail = placement === 'rail'
  // A rail with no labels grows the indicator to a 56dp circle
  // (`NoLabelActiveIndicatorHeight`); the bar keeps its 56×32 pill in every
  // label mode.
  const indicatorHeight =
    inRail && !labelVisible
      ? NAV_RAIL_NO_LABEL_INDICATOR_SIZE
      : NAV_INDICATOR_HEIGHT

  return StyleSheet.create({
    // In the bar, `ItemBetweenSpace` is 0: destinations split the row equally
    // and meet edge to edge, so the whole 80dp band is pressable. In the rail
    // each destination is an 80dp-wide block, at least 56dp tall.
    container: inRail
      ? {
          width: NAV_RAIL_ITEM_WIDTH,
          minHeight: NAV_RAIL_ITEM_HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: NAV_RAIL_ITEM_VERTICAL_PADDING,
        }
      : {
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: 0,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: NAV_ITEM_HORIZONTAL_PADDING,
        },
    interactiveContainer: {
      cursor: 'pointer',
    },
    disabledContainer: {
      cursor: 'auto',
    },
    content: {
      alignItems: 'center',
      gap: NAV_INDICATOR_LABEL_GAP,
    },
    disabledContent: {
      opacity: theme.stateLayer.disabledOpacity,
    },
    // The pill is laid out at full indicator size whether or not the
    // destination is active — the indicator and state layer paint inside it,
    // so activation never shifts the icon.
    pill: {
      width: NAV_INDICATOR_WIDTH,
      height: indicatorHeight,
      borderRadius: theme.shape.cornerFull,
      alignItems: 'center',
      justifyContent: 'center',
    },
    indicator: {
      ...StyleSheet.absoluteFill,
      borderRadius: theme.shape.cornerFull,
      backgroundColor: colors.indicator,
    },
    stateLayer: {
      ...StyleSheet.absoluteFill,
      borderRadius: theme.shape.cornerFull,
    },
    label: {
      ...theme.typography.labelMedium,
      color: selected ? colors.selectedLabel : colors.content,
      textAlign: 'center',
    },
    focusRing: {
      position: 'absolute',
      top: -FOCUS_RING_OFFSET,
      left: -FOCUS_RING_OFFSET,
      right: -FOCUS_RING_OFFSET,
      bottom: -FOCUS_RING_OFFSET,
      borderWidth: FOCUS_RING_WIDTH,
      borderColor: theme.colors.secondary,
      borderRadius: theme.shape.cornerFull,
    },
  })
}
