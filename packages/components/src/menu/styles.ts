import type { MaterialTheme } from '@rootnative/core'
import { elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'

/**
 * MD3 menu metrics.
 * Source: androidx.compose.material3.MenuKt + MenuTokens —
 * `DropdownMenuItemDefaultMinWidth = 112.dp`,
 * `DropdownMenuItemDefaultMaxWidth = 280.dp`,
 * `DropdownMenuVerticalPadding = 8.dp`,
 * `DropdownMenuItemHorizontalPadding = 12.dp`,
 * `MenuListItemContainerHeight = 48.dp`,
 * `MenuTokens.ContainerShape = CornerExtraSmall` (4dp),
 * `MenuTokens.ContainerColor = surfaceContainer`,
 * `MenuTokens.ContainerElevation = Level2`,
 * `MenuTokens.ListItemLabelTextFont = LabelLarge`,
 * `MenuTokens.ListItemLabelTextColor = onSurface`,
 * `MenuTokens.ListItemLeadingIconColor = onSurfaceVariant`,
 * `MenuTokens.ListItemTrailingIconColor = onSurfaceVariant`.
 */
export const MENU_MIN_WIDTH = 112
export const MENU_MAX_WIDTH = 280
export const MENU_VERTICAL_PADDING = 8
export const MENU_ITEM_HORIZONTAL_PADDING = 12
export const MENU_ITEM_HEIGHT = 48
export const MENU_ITEM_ICON_SIZE = 24

const ITEM_FOCUS_RING_INSET = 2
const ITEM_FOCUS_RING_WIDTH = 3

export function createMenuStyles(
  theme: MaterialTheme,
  containerColor?: string,
) {
  return StyleSheet.create({
    // Absolute-fills the portal layer, giving the anchor-relative surface a
    // coordinate space and the dismiss region something to cover.
    layer: {
      ...StyleSheet.absoluteFillObject,
    },
    // MD3 menus have no scrim — this is a transparent press target, not a dim.
    dismissRegion: {
      ...StyleSheet.absoluteFillObject,
    },
    surface: {
      position: 'absolute',
      minWidth: MENU_MIN_WIDTH,
      maxWidth: MENU_MAX_WIDTH,
      borderRadius: theme.shape.cornerExtraSmall,
      backgroundColor: containerColor ?? theme.colors.surfaceContainer,
      ...elevationStyle(theme.elevation.level2),
    },
    // `flexShrink` is what makes the height cap work. The cap sits on the
    // surface, not here: a ScrollView reports its content height to its parent,
    // so a cap applied only to the ScrollView leaves the surface free to grow to
    // the full content height and run off screen. With the surface bounded, the
    // ScrollView shrinks into it and its content overflows into a real scroll.
    //
    // The rounding is repeated here, and the clip lives here rather than on the
    // surface: a first/last item's state layer would otherwise paint square over
    // the surface's corners, and `overflow: 'hidden'` on the surface would clip
    // the iOS elevation shadow that sits on the same view.
    list: {
      flexShrink: 1,
      borderRadius: theme.shape.cornerExtraSmall,
      overflow: 'hidden',
    },
    // MD3's 8dp block padding scrolls with the items, so the surface carries
    // none of it and the list's maxHeight is the whole vertical budget.
    listContent: {
      paddingVertical: MENU_VERTICAL_PADDING,
    },
  })
}

export function createMenuItemStyles(
  theme: MaterialTheme,
  contentColor?: string,
) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: MENU_ITEM_HEIGHT,
      minWidth: MENU_MIN_WIDTH,
      paddingHorizontal: MENU_ITEM_HORIZONTAL_PADDING,
    },
    interactiveContainer: {
      cursor: 'pointer',
    },
    disabledContainer: {
      cursor: 'auto',
    },
    // `flexGrow`/`flexShrink` rather than `flex: 1`: RN's `flex: 1` also sets
    // `flexBasis: 0%`, which would drop the label out of the surface's
    // intrinsic width and collapse the menu to its 112dp minimum.
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      flexGrow: 1,
      flexShrink: 1,
      gap: MENU_ITEM_HORIZONTAL_PADDING,
    },
    // Label and both icons dim together — MD3's disabled treatment, never
    // derived from `containerColor` / `contentColor`.
    disabledContent: {
      opacity: theme.stateLayer.disabledOpacity,
    },
    label: {
      ...theme.typography.labelLarge,
      color: contentColor ?? theme.colors.onSurface,
      flexGrow: 1,
      flexShrink: 1,
    },
    trailingText: {
      ...theme.typography.labelLarge,
      color: contentColor ?? theme.colors.onSurfaceVariant,
    },
    focusRing: {
      position: 'absolute',
      top: ITEM_FOCUS_RING_INSET,
      left: ITEM_FOCUS_RING_INSET,
      right: ITEM_FOCUS_RING_INSET,
      bottom: ITEM_FOCUS_RING_INSET,
      borderWidth: ITEM_FOCUS_RING_WIDTH,
      borderColor: theme.colors.secondary,
      borderRadius: theme.shape.cornerExtraSmall,
    },
  })
}
