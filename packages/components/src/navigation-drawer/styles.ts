import type { MaterialTheme } from '@rootnative/core'
import { alphaColor, elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'
import type { NavigationDrawerVariant } from './types'

/**
 * MD3 navigation drawer metrics.
 * Source: androidx.compose.material3 NavigationDrawerTokens +
 * NavigationDrawer.kt — `ContainerWidth = 360.dp`,
 * `ContainerShape = CornerLargeEnd` (16dp on the end corners of a modal
 * drawer; a standard drawer is rectangular),
 * `ModalContainerColor = surfaceContainerLow`,
 * `StandardContainerColor = surface`,
 * `ModalContainerElevation = Level1`, `StandardContainerElevation = Level0`,
 * `ActiveIndicatorWidth = 336.dp`, `ActiveIndicatorHeight = 56.dp`,
 * `ActiveIndicatorShape = CornerFull`,
 * `ActiveIndicatorColor = secondaryContainer`,
 * `ActiveIconColor = ActiveLabelTextColor = onSecondaryContainer`,
 * `InactiveIconColor = InactiveLabelTextColor = onSurfaceVariant`,
 * `LabelTextFont = LabelLarge`, `IconSize = 24.dp`,
 * `HeadlineFont = TitleSmall`, `HeadlineColor = onSurfaceVariant`,
 * `NavigationDrawerItemDefaults.ItemPadding = 12.dp` horizontal (so the
 * 336dp indicator sits inside the 360dp sheet), the item row padded 16dp at
 * the start and 24dp at the end with 12dp between icon and label, and
 * `DrawerDefaults.ScrimOpacity = 0.32`. The headline and the divider sit at
 * 28dp from the sheet edge: the 12dp item inset plus 16dp.
 */
export const DRAWER_WIDTH = 360
export const DRAWER_ITEM_HEIGHT = 56
export const DRAWER_ICON_SIZE = 24
export const DRAWER_INSET = 12
export const DRAWER_ITEM_PADDING_START = 16
export const DRAWER_ITEM_PADDING_END = 24
export const DRAWER_ITEM_GAP = 12
/** Inset of the headline and the divider, inside the 12dp item inset. */
export const DRAWER_SECTION_INSET = 16
export const DRAWER_VERTICAL_PADDING = 12
/** MD3 scrim opacity for modal surfaces. */
export const DRAWER_SCRIM_OPACITY = 0.32
/**
 * Least width of screen a modal drawer leaves uncovered, so there is always
 * a scrim to press on a narrow window.
 */
export const DRAWER_MIN_SCRIM_WIDTH = 56

/** Focus-ring geometry, matching the rest of the library. */
const FOCUS_RING_OFFSET = 2
const FOCUS_RING_WIDTH = 3

export interface NavigationDrawerColors {
  /** Inactive icon, label, badge, and section headline. */
  content: string
  /** Active icon, label, and badge. */
  selectedContent: string
  /** Active indicator. */
  indicator: string
}

export function getNavigationDrawerColors(
  theme: MaterialTheme,
  contentColor?: string,
  selectedContentColor?: string,
  indicatorColor?: string,
): NavigationDrawerColors {
  return {
    content: contentColor ?? theme.colors.onSurfaceVariant,
    selectedContent: selectedContentColor ?? theme.colors.onSecondaryContainer,
    indicator: indicatorColor ?? theme.colors.secondaryContainer,
  }
}

export function createNavigationDrawerStyles(
  theme: MaterialTheme,
  variant: NavigationDrawerVariant,
  containerColor?: string,
) {
  const isModal = variant === 'modal'
  const surfaceColor =
    containerColor ??
    (isModal ? theme.colors.surfaceContainerLow : theme.colors.surface)

  return StyleSheet.create({
    layer: {
      ...StyleSheet.absoluteFill,
    },
    scrim: {
      ...StyleSheet.absoluteFill,
      backgroundColor: alphaColor(theme.colors.scrim, DRAWER_SCRIM_OPACITY),
    },
    // The press target inside the scrim stays transparent — giving it the
    // scrim color too would composite two 32% layers into ~54%.
    scrimPressArea: {
      ...StyleSheet.absoluteFill,
    },
    // Start-anchors the surface. The end padding keeps a strip of scrim
    // visible on a window narrower than the sheet plus that strip.
    sheetLayer: {
      ...StyleSheet.absoluteFill,
      alignItems: 'flex-start',
      paddingEnd: DRAWER_MIN_SCRIM_WIDTH,
    },
    surface: isModal
      ? {
          width: '100%',
          maxWidth: DRAWER_WIDTH,
          height: '100%',
          borderTopEndRadius: theme.shape.cornerLarge,
          borderBottomEndRadius: theme.shape.cornerLarge,
          backgroundColor: surfaceColor,
          ...elevationStyle(theme.elevation.level1),
        }
      : {
          width: DRAWER_WIDTH,
          alignSelf: 'stretch',
          backgroundColor: surfaceColor,
        },
    safeArea: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingVertical: DRAWER_VERTICAL_PADDING,
      paddingHorizontal: DRAWER_INSET,
    },
  })
}

export function createNavigationDrawerItemStyles(
  theme: MaterialTheme,
  selected: boolean,
  colors: NavigationDrawerColors,
) {
  const contentColor = selected ? colors.selectedContent : colors.content

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      height: DRAWER_ITEM_HEIGHT,
      paddingStart: DRAWER_ITEM_PADDING_START,
      paddingEnd: DRAWER_ITEM_PADDING_END,
      gap: DRAWER_ITEM_GAP,
      borderRadius: theme.shape.cornerFull,
    },
    interactiveContainer: {
      cursor: 'pointer',
    },
    disabledContainer: {
      cursor: 'auto',
    },
    disabledContent: {
      opacity: theme.stateLayer.disabledOpacity,
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
      ...theme.typography.labelLarge,
      color: contentColor,
      flexGrow: 1,
      flexShrink: 1,
    },
    badge: {
      ...theme.typography.labelLarge,
      color: contentColor,
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

export function createNavigationDrawerSectionStyles(
  theme: MaterialTheme,
  colors: NavigationDrawerColors,
) {
  return StyleSheet.create({
    headline: {
      ...theme.typography.titleSmall,
      color: colors.content,
      height: DRAWER_ITEM_HEIGHT,
      paddingHorizontal: DRAWER_SECTION_INSET,
      textAlignVertical: 'center',
      // `textAlignVertical` is Android only; the line height centres the
      // single line on iOS and web.
      lineHeight: DRAWER_ITEM_HEIGHT,
    },
  })
}
