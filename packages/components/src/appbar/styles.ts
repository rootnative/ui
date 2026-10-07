import { defaultTopAppBarTokens } from '@rootnative/core'
import type { MaterialTheme } from '@rootnative/core'
import { StyleSheet } from 'react-native'
import type { AppBarColorScheme } from './types'

export interface AppBarColorSchemeColors {
  containerColor: string
  elevatedContainerColor: string
  contentColor: string
  subtitleColor: string
}

export function getColorSchemeColors(
  theme: MaterialTheme,
  colorScheme: AppBarColorScheme,
): AppBarColorSchemeColors {
  switch (colorScheme) {
    case 'surfaceContainerLowest':
      return {
        containerColor: theme.colors.surfaceContainerLowest,
        elevatedContainerColor: theme.colors.surfaceContainerLowest,
        contentColor: theme.colors.onSurface,
        subtitleColor: theme.colors.onSurfaceVariant,
      }
    case 'surfaceContainerLow':
      return {
        containerColor: theme.colors.surfaceContainerLow,
        elevatedContainerColor: theme.colors.surfaceContainerLow,
        contentColor: theme.colors.onSurface,
        subtitleColor: theme.colors.onSurfaceVariant,
      }
    case 'surfaceContainer':
      return {
        containerColor: theme.colors.surfaceContainer,
        elevatedContainerColor: theme.colors.surfaceContainer,
        contentColor: theme.colors.onSurface,
        subtitleColor: theme.colors.onSurfaceVariant,
      }
    case 'surfaceContainerHigh':
      return {
        containerColor: theme.colors.surfaceContainerHigh,
        elevatedContainerColor: theme.colors.surfaceContainerHigh,
        contentColor: theme.colors.onSurface,
        subtitleColor: theme.colors.onSurfaceVariant,
      }
    case 'surfaceContainerHighest':
      return {
        containerColor: theme.colors.surfaceContainerHighest,
        elevatedContainerColor: theme.colors.surfaceContainerHighest,
        contentColor: theme.colors.onSurface,
        subtitleColor: theme.colors.onSurfaceVariant,
      }
    case 'primary':
      return {
        containerColor: theme.colors.primary,
        elevatedContainerColor: theme.colors.primary,
        contentColor: theme.colors.onPrimary,
        subtitleColor: theme.colors.onPrimary,
      }
    case 'primaryContainer':
      return {
        containerColor: theme.colors.primaryContainer,
        elevatedContainerColor: theme.colors.primaryContainer,
        contentColor: theme.colors.onPrimaryContainer,
        subtitleColor: theme.colors.onPrimaryContainer,
      }
    case 'surface':
    default:
      return {
        containerColor: theme.colors.surface,
        elevatedContainerColor: theme.colors.surfaceContainer,
        contentColor: theme.colors.onSurface,
        subtitleColor: theme.colors.onSurfaceVariant,
      }
  }
}

export function createStyles(
  theme: MaterialTheme,
  schemeColors: AppBarColorSchemeColors,
) {
  const topAppBar = theme.topAppBar ?? defaultTopAppBarTokens

  return StyleSheet.create({
    root: {
      backgroundColor: schemeColors.containerColor,
    },
    safeArea: {
      backgroundColor: schemeColors.containerColor,
    },
    smallContainer: {
      height: topAppBar.smallContainerHeight,
      position: 'relative',
    },
    expandedContainer: {
      position: 'relative',
    },
    topRow: {
      height: topAppBar.topRowHeight,
      paddingHorizontal: topAppBar.horizontalPadding,
      flexDirection: 'row',
      alignItems: 'center',
    },
    // Its own layer over the whole container, not a row under the top row:
    // the medium title (32dp line) plus its 24dp bottom padding is 56dp, and
    // the 112dp container leaves only 48dp under the 64dp top row, so a row
    // clipped the title's descenders. The layer lets the title rise to the
    // Compose geometry (112 - 24 - 32 = 56dp from the top), which is where
    // the top row's icons end.
    expandedTitleContainer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      start: 0,
      end: 0,
      justifyContent: 'flex-end',
      minWidth: 0,
      paddingEnd: theme.spacing.md,
      pointerEvents: 'none',
    },
    topRowSpacer: {
      flex: 1,
    },
    sideSlot: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: topAppBar.sideSlotMinHeight,
    },
    // The side slot centres this view, and this view is only as tall as its
    // content. A direct child of the slot with its own `alignSelf` escapes
    // the slot's `alignItems`: `IconButton` sets `flex-start` and sat 4pt
    // above the title. The minimum width gives a custom 40dp `IconButton`
    // the 48dp footprint of an MD3 icon button.
    slotContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: topAppBar.iconFrameSize,
    },
    // No fixed height: `IconButton` sets `alignSelf: 'flex-start'`, which
    // beats `alignItems` on the cross axis of any frame. A row centres it on
    // the main axis, and the parent centres this content-height frame.
    iconFrame: {
      width: topAppBar.iconFrameSize,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    overlayTitleContainer: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      minWidth: 0,
      pointerEvents: 'none',
    },
    // Collapse-on-scroll title host: start/top/height/end are animated from the
    // collapse progress in AppBar.tsx.
    collapsibleTitleContainer: {
      position: 'absolute',
      justifyContent: 'center',
      minWidth: 0,
      pointerEvents: 'none',
    },
    centeredTitle: {
      textAlign: 'center',
    },
    // The centred title is a row so the title node keeps its natural width
    // and a start margin can place it at the screen's centre.
    centeredTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    centeredTitleNode: {
      flexShrink: 1,
      minWidth: 0,
    },
    startAlignedTitle: {
      textAlign: 'auto',
    },
    mediumTitlePadding: {
      paddingBottom: topAppBar.mediumTitleBottomPadding,
    },
    largeTitlePadding: {
      paddingBottom: topAppBar.largeTitleBottomPadding,
    },
    title: {
      flexShrink: 1,
      maxWidth: '100%',
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    subtitleColor: {
      color: schemeColors.subtitleColor,
    },
  })
}
