import type { MaterialTheme } from '@rootnative/core'
import { StyleSheet } from 'react-native'
import type { TabsVariant } from './types'

/**
 * MD3 tab metrics.
 * Source: androidx.compose.material3 PrimaryNavigationTabTokens /
 * SecondaryNavigationTabTokens + Tab.kt + TabRow.kt —
 * `ContainerColor = surface`, `ContainerHeight = 48.dp`,
 * `ContainerElevation = Level0`, `ContainerShape = CornerNone`,
 * `IconAndLabelTextContainerHeight = 64.dp`, `IconSize = 24.dp`,
 * `LabelTextFont = TitleSmall`,
 * primary `ActiveLabelTextColor / ActiveIconColor = primary`,
 * secondary `ActiveLabelTextColor / ActiveIconColor = onSurface`,
 * both `Inactive… = onSurfaceVariant`,
 * `ActiveIndicatorColor = primary`, `ActiveIndicatorHeight = 3.dp`,
 * `TabRowDefaults.PrimaryIndicator(shape = RoundedCornerShape(topStart = 3.dp,
 * topEnd = 3.dp))` — capped on top, flush on the bottom,
 * `HorizontalTextPadding = 16.dp`, `TextDistanceFromLeadingIcon = 8.dp`,
 * `ScrollableTabRowMinTabWidth = 90.dp`,
 * `ScrollableTabRowEdgeStartPadding = 52.dp`,
 * `TabRowDefaults.PrimaryIndicator(width = 24.dp)` as the floor for the
 * label-width-matched primary indicator.
 */
export const TAB_HEIGHT = 48
export const TAB_ICON_AND_LABEL_HEIGHT = 64
export const TAB_ICON_SIZE = 24
export const TAB_HORIZONTAL_PADDING = 16
export const TAB_ICON_LABEL_GAP = 8
export const PRIMARY_INDICATOR_HEIGHT = 3
export const PRIMARY_INDICATOR_MIN_WIDTH = 24
export const SCROLLABLE_MIN_TAB_WIDTH = 90
export const SCROLLABLE_EDGE_PADDING = 52

/**
 * MD3 gives the secondary indicator 2dp against the primary's 3dp. Compose
 * doesn't: `SecondaryNavigationTabTokens` declares no indicator at all, so
 * `TabRowDefaults.SecondaryIndicator` falls back to the primary token's 3dp.
 * The spec value wins here — the two variants are meant to read differently.
 */
export const SECONDARY_INDICATOR_HEIGHT = 2

/**
 * Only the primary indicator is a shape; the secondary one is a plain rule.
 * `TabRowDefaults.SecondaryIndicator` takes no shape at all, and material-web
 * gives `--md-primary-tab-active-indicator-shape` a `3px 3px 0 0` against the
 * secondary tab's unset one. Both agree the bottom corners stay square, so the
 * radius goes on the top edge only — the indicator sits flush against the tab
 * it marks.
 */
const PRIMARY_INDICATOR_RADIUS = 3
const SECONDARY_INDICATOR_RADIUS = 0

/**
 * Vertical gap between a stacked icon and label on a primary tab.
 *
 * An approximation, like Tooltip's `RICH_SUBHEAD_GAP`: Compose spaces the two
 * with `IconDistanceFromBaseline`, a baseline offset React Native has no
 * equivalent for. 2dp between the line boxes lands on the same visual gap for
 * the MD3 type scale inside the 64dp icon-and-label height.
 */
const STACKED_GAP = 2

/** Focus-ring geometry, matching the rest of the library. */
const FOCUS_RING_INSET = 2
const FOCUS_RING_WIDTH = 3

export interface TabColors {
  content: string
  selectedContent: string
  indicator: string
}

export function getTabColors(
  theme: MaterialTheme,
  variant: TabsVariant,
  contentColor?: string,
  selectedContentColor?: string,
  indicatorColor?: string,
): TabColors {
  return {
    content: contentColor ?? theme.colors.onSurfaceVariant,
    selectedContent:
      selectedContentColor ??
      (variant === 'primary' ? theme.colors.primary : theme.colors.onSurface),
    indicator: indicatorColor ?? theme.colors.primary,
  }
}

export function createTabsStyles(
  theme: MaterialTheme,
  variant: TabsVariant,
  colors: TabColors,
  edgePadding: number,
  containerColor?: string,
) {
  const isPrimary = variant === 'primary'
  const indicatorHeight = isPrimary
    ? PRIMARY_INDICATOR_HEIGHT
    : SECONDARY_INDICATOR_HEIGHT
  const indicatorRadius = isPrimary
    ? PRIMARY_INDICATOR_RADIUS
    : SECONDARY_INDICATOR_RADIUS

  return StyleSheet.create({
    root: {
      backgroundColor: containerColor ?? theme.colors.surface,
    },
    // `stretch` is what makes every tab as tall as the tallest one, so a row
    // that mixes icon+label tabs with label-only tabs stays a single band.
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    // `flexGrow` so a short scrollable row still fills the viewport — without
    // it the divider below would stop where the tabs do.
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: edgePadding,
    },
    divider: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    // Positioned from the physical left with a translate, not from `start`:
    // the measured offsets are physical too, so the same math holds in RTL.
    // Both top corners take the same radius, so the physical spelling is
    // RTL-safe here too.
    indicator: {
      position: 'absolute',
      left: 0,
      bottom: 0,
      height: indicatorHeight,
      borderTopLeftRadius: indicatorRadius,
      borderTopRightRadius: indicatorRadius,
      backgroundColor: colors.indicator,
    },
  })
}

export function createTabStyles(
  theme: MaterialTheme,
  variant: TabsVariant,
  selected: boolean,
  colors: TabColors,
  hasIcon: boolean,
  hasLabel: boolean,
  scrollable: boolean,
) {
  const contentColor = selected ? colors.selectedContent : colors.content
  // Only a primary tab stacks; a secondary one keeps its icon inline and its
  // 48dp height.
  const isStacked = variant === 'primary' && hasIcon && hasLabel

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: isStacked ? TAB_ICON_AND_LABEL_HEIGHT : TAB_HEIGHT,
      paddingHorizontal: TAB_HORIZONTAL_PADDING,
      // Fixed rows divide the width equally; scrollable rows take each tab's
      // natural width, floored at the MD3 minimum.
      ...(scrollable
        ? { minWidth: SCROLLABLE_MIN_TAB_WIDTH }
        : { flexGrow: 1, flexShrink: 1, flexBasis: 0 }),
    },
    interactiveContainer: {
      cursor: 'pointer',
    },
    disabledContainer: {
      cursor: 'auto',
    },
    // Measured to size the primary indicator, so it wraps the icon and label
    // and nothing else — the tab's horizontal padding is not part of it.
    content: {
      flexDirection: isStacked ? 'column' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isStacked ? STACKED_GAP : TAB_ICON_LABEL_GAP,
    },
    disabledContent: {
      opacity: theme.stateLayer.disabledOpacity,
    },
    label: {
      ...theme.typography.titleSmall,
      color: contentColor,
      textAlign: 'center',
    },
    focusRing: {
      position: 'absolute',
      top: FOCUS_RING_INSET,
      left: FOCUS_RING_INSET,
      right: FOCUS_RING_INSET,
      bottom: FOCUS_RING_INSET,
      borderWidth: FOCUS_RING_WIDTH,
      borderColor: theme.colors.secondary,
      borderRadius: theme.shape.cornerExtraSmall,
    },
  })
}
