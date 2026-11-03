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

/**
 * Floating navigation bar metrics. MD3 has no floating navigation bar. The
 * capsule takes the height, the screen offset and the item gap of the MD3
 * floating toolbar (FloatingToolbarTokens: `ContainerHeight = 64.dp`,
 * `ContainerExternalPadding = 16.dp`, `ContainerBetweenSpace = 4.dp`). Its
 * level 3 elevation is not an MD3 value for this surface: the floating
 * toolbar is level 0, or level 1 beside a FAB. The active indicator fills
 * the cell of its destination.
 */
export const FLOATING_BAR_HEIGHT = 64
/** The gap between the capsule and each side and the bottom of the window. */
export const FLOATING_BAR_GAP = 16
/** Wider than this, the destinations sit too far apart for one thumb. */
export const FLOATING_BAR_MAX_WIDTH = 480
/** The room between the edge of the capsule and its destinations. */
export const FLOATING_BAR_PADDING = 6
export const FLOATING_BAR_ITEM_GAP = 4
/**
 * A bottom inset of this height or less holds only a gesture handle: the iOS
 * home indicator or the Android gesture bar. The capsule floats over it. A
 * taller inset holds the Android navigation buttons, and the capsule stays
 * above it.
 */
export const FLOATING_BAR_HANDLE_INSET = 40

/** The distance from the bottom edge of the parent to the capsule. */
export function floatingBarBottom(insetBottom: number): number {
  return insetBottom <= FLOATING_BAR_HANDLE_INSET
    ? FLOATING_BAR_GAP
    : insetBottom + FLOATING_BAR_GAP
}

/**
 * Where a `NavigationItem` sits: the horizontal bar, the vertical rail, or
 * the floating capsule.
 */
export type NavigationItemPlacement = 'bar' | 'rail' | 'floating'

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

export function createFloatingNavigationBarStyles(
  theme: MaterialTheme,
  containerColor?: string,
) {
  return StyleSheet.create({
    // The track spans the parent, so the capsule can center in it. Its empty
    // sides let a touch through to the content.
    track: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    capsule: {
      width: '100%',
      maxWidth: FLOATING_BAR_MAX_WIDTH,
      borderRadius: theme.shape.cornerFull,
      backgroundColor: containerColor ?? theme.colors.surfaceContainer,
      ...elevationStyle(theme.elevation.level3),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      height: FLOATING_BAR_HEIGHT,
      padding: FLOATING_BAR_PADDING,
      gap: FLOATING_BAR_ITEM_GAP,
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
  const floating = placement === 'floating'
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
    // each destination is an 80dp-wide block, at least 56dp tall. In the
    // floating capsule the destinations split the row too, and the content
    // fills each one.
    container: inRail
      ? {
          width: NAV_RAIL_ITEM_WIDTH,
          minHeight: NAV_RAIL_ITEM_HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: NAV_RAIL_ITEM_VERTICAL_PADDING,
        }
      : floating
        ? {
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: 0,
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
    content: floating
      ? { flexGrow: 1 }
      : {
          alignItems: 'center',
          gap: NAV_INDICATOR_LABEL_GAP,
        },
    disabledContent: {
      opacity: theme.stateLayer.disabledOpacity,
    },
    // The pill is laid out at full indicator size whether or not the
    // destination is active — the indicator and state layer paint inside it,
    // so activation never shifts the icon. In the floating capsule the pill
    // fills the destination.
    pill: {
      ...(floating
        ? { flexGrow: 1 }
        : { width: NAV_INDICATOR_WIDTH, height: indicatorHeight }),
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
