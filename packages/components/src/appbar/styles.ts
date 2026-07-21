import { defaultTopAppBarTokens } from '@rootnative/core'
import type { MaterialTheme } from '@rootnative/core'
import { StyleSheet } from 'react-native'
import type { AppBarColorScheme } from './types'

export interface AppBarColorSchemeColors {
  containerColor: string
  elevatedContainerColor: string
  contentColor: string
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
      }
    case 'surfaceContainerLow':
      return {
        containerColor: theme.colors.surfaceContainerLow,
        elevatedContainerColor: theme.colors.surfaceContainerLow,
        contentColor: theme.colors.onSurface,
      }
    case 'surfaceContainer':
      return {
        containerColor: theme.colors.surfaceContainer,
        elevatedContainerColor: theme.colors.surfaceContainer,
        contentColor: theme.colors.onSurface,
      }
    case 'surfaceContainerHigh':
      return {
        containerColor: theme.colors.surfaceContainerHigh,
        elevatedContainerColor: theme.colors.surfaceContainerHigh,
        contentColor: theme.colors.onSurface,
      }
    case 'surfaceContainerHighest':
      return {
        containerColor: theme.colors.surfaceContainerHighest,
        elevatedContainerColor: theme.colors.surfaceContainerHighest,
        contentColor: theme.colors.onSurface,
      }
    case 'primary':
      return {
        containerColor: theme.colors.primary,
        elevatedContainerColor: theme.colors.primary,
        contentColor: theme.colors.onPrimary,
      }
    case 'primaryContainer':
      return {
        containerColor: theme.colors.primaryContainer,
        elevatedContainerColor: theme.colors.primaryContainer,
        contentColor: theme.colors.onPrimaryContainer,
      }
    case 'surface':
    default:
      return {
        containerColor: theme.colors.surface,
        elevatedContainerColor: theme.colors.surfaceContainer,
        contentColor: theme.colors.onSurface,
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
    mediumContainer: {
      height: topAppBar.mediumContainerHeight,
    },
    largeContainer: {
      height: topAppBar.largeContainerHeight,
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
    expandedTitleContainer: {
      flex: 1,
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
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconFrame: {
      width: topAppBar.iconFrameSize,
      height: topAppBar.iconFrameSize,
      alignItems: 'center',
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
    // Collapse-on-scroll title host: top/height/end are animated from the
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
  })
}
