import type { MaterialTheme } from '@rootnative/core'
import { elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'
import type { MenuVariant } from './types'

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

/**
 * MD3 Expressive vertical menu metrics.
 * Source: androidx.compose.material3 `SegmentedMenuTokens` 24.1.2, with
 * `MenuDefaults` and `Menu.kt` —
 * `ContainerShape = CornerLarge`, `GroupContainerColor = SurfaceContainerLow`,
 * `DropdownMenuGroupVerticalPadding = 2.dp`,
 * `DropdownMenuSelectableItemPadding = 4.dp` (the item inset),
 * `Item = 44.dp`, `ItemLeadingSpace = ItemTrailingSpace = 16.dp` from the
 * group edge (the inset plus 12), `ItemTopSpace = ItemBottomSpace = 8.dp`,
 * `ItemBetweenSpace = 12.dp`, `ItemLabelTextFont = BodyLarge`,
 * `ItemTrailingSupportingTextFont = LabelSmall`,
 * `ItemLeadingIconSize = ItemTrailingIconSize = 20.dp`,
 * `ItemShape = CornerExtraSmall`, `ItemSelectedShape = CornerMedium`, and
 * `CornerMedium` outer corners on the first and the last item
 * (`MenuDefaults.leadingItemShape`, `trailingItemShape`).
 *
 * Where the Compose code still differs from the tokens (each place is marked
 * "TODO replace with token"), these values follow the tokens.
 */
export const VERTICAL_MENU_VERTICAL_PADDING = 2
export const VERTICAL_MENU_ITEM_INSET = 4
export const VERTICAL_MENU_ITEM_HEIGHT = 44
export const VERTICAL_MENU_ITEM_HORIZONTAL_PADDING = 12
export const VERTICAL_MENU_ITEM_VERTICAL_PADDING = 8
export const VERTICAL_MENU_ITEM_GAP = 12
export const VERTICAL_MENU_ITEM_ICON_SIZE = 20

export const ITEM_FOCUS_RING_INSET = 2
const ITEM_FOCUS_RING_WIDTH = 3

export function createMenuStyles(
  theme: MaterialTheme,
  containerColor: string | undefined,
  variant: MenuVariant,
) {
  const isVertical = variant === 'vertical'
  const corner = isVertical
    ? theme.shape.cornerLarge
    : theme.shape.cornerExtraSmall
  const defaultContainerColor = isVertical
    ? theme.colors.surfaceContainerLow
    : theme.colors.surfaceContainer
  return StyleSheet.create({
    // Absolute-fills the portal layer, giving the anchor-relative surface a
    // coordinate space and the dismiss region something to cover.
    layer: {
      ...StyleSheet.absoluteFill,
    },
    // MD3 menus have no scrim — this is a transparent press target, not a dim.
    dismissRegion: {
      ...StyleSheet.absoluteFill,
    },
    surface: {
      position: 'absolute',
      minWidth: MENU_MIN_WIDTH,
      maxWidth: MENU_MAX_WIDTH,
      borderRadius: corner,
      backgroundColor: containerColor ?? defaultContainerColor,
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
      borderRadius: corner,
      overflow: 'hidden',
    },
    // MD3's 8dp block padding scrolls with the items, so the surface carries
    // none of it and the list's maxHeight is the whole vertical budget.
    listContent: {
      paddingVertical: isVertical
        ? VERTICAL_MENU_VERTICAL_PADDING
        : MENU_VERTICAL_PADDING,
    },
  })
}

export function createMenuItemStyles(
  theme: MaterialTheme,
  contentColor: string | undefined,
  variant: MenuVariant,
) {
  const isVertical = variant === 'vertical'
  return StyleSheet.create({
    // No `flexGrow` in an item. React Native's default layout conformance
    // keeps a legacy Yoga rule: a `flexGrow` child grows a row that is as
    // wide as its content to all the width it can get, so every menu opened
    // at its 280dp maximum. The item is a column, so the content row
    // stretches to the menu width only after the menu has its width, and the
    // trailing content takes the free space with an auto start margin.
    // The vertical item sits 4dp in from each side of the menu, so its own
    // minimum width is the menu minimum less the two insets.
    container: isVertical
      ? {
          justifyContent: 'center',
          minHeight: VERTICAL_MENU_ITEM_HEIGHT,
          minWidth: MENU_MIN_WIDTH - 2 * VERTICAL_MENU_ITEM_INSET,
          marginHorizontal: VERTICAL_MENU_ITEM_INSET,
          paddingHorizontal: VERTICAL_MENU_ITEM_HORIZONTAL_PADDING,
          paddingVertical: VERTICAL_MENU_ITEM_VERTICAL_PADDING,
        }
      : {
          justifyContent: 'center',
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
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isVertical ? VERTICAL_MENU_ITEM_GAP : MENU_ITEM_HORIZONTAL_PADDING,
    },
    // Label and both icons dim together — MD3's disabled treatment, never
    // derived from `containerColor` / `contentColor`.
    disabledContent: {
      opacity: theme.stateLayer.disabledOpacity,
    },
    label: {
      ...(isVertical
        ? theme.typography.bodyLarge
        : theme.typography.labelLarge),
      color: contentColor ?? theme.colors.onSurface,
      flexShrink: 1,
    },
    trailingText: {
      ...(isVertical
        ? theme.typography.labelSmall
        : theme.typography.labelLarge),
      color: contentColor ?? theme.colors.onSurfaceVariant,
    },
    trailingStart: {
      marginStart: 'auto',
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
