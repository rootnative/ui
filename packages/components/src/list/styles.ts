import type { MaterialTheme } from '@rootnative/core'
import { alphaColor, blendColor } from '@rootnative/utils'
import { StyleSheet } from 'react-native'
import type { ListItemLines } from './types'

const ITEM_PADDING_VERTICAL = 12
const INSET_START = 56

export const LIST_ITEM_FOCUS_RING_INSET = 2
export const LIST_ITEM_FOCUS_RING_WIDTH = 3

const MIN_HEIGHT: Record<ListItemLines, number> = {
  1: 56,
  2: 72,
  3: 88,
}

export function createListStyles(theme: MaterialTheme) {
  return StyleSheet.create({
    container: {
      paddingVertical: theme.spacing.sm,
    },
  })
}

export interface ListItemColors {
  backgroundColor: string
  hoveredBackgroundColor: string
  focusedBackgroundColor: string
  pressedBackgroundColor: string
}

export function getResolvedListItemColors(
  theme: MaterialTheme,
  containerColor?: string,
): ListItemColors {
  if (containerColor) {
    return {
      backgroundColor: containerColor,
      hoveredBackgroundColor: blendColor(
        containerColor,
        theme.colors.onSurface,
        theme.stateLayer.hoveredOpacity,
      ),
      focusedBackgroundColor: blendColor(
        containerColor,
        theme.colors.onSurface,
        theme.stateLayer.focusedOpacity,
      ),
      pressedBackgroundColor: blendColor(
        containerColor,
        theme.colors.onSurface,
        theme.stateLayer.pressedOpacity,
      ),
    }
  }

  return {
    backgroundColor: 'transparent',
    hoveredBackgroundColor: alphaColor(
      theme.colors.onSurface,
      theme.stateLayer.hoveredOpacity,
    ),
    focusedBackgroundColor: alphaColor(
      theme.colors.onSurface,
      theme.stateLayer.focusedOpacity,
    ),
    pressedBackgroundColor: alphaColor(
      theme.colors.onSurface,
      theme.stateLayer.pressedOpacity,
    ),
  }
}

export function createListItemStyles(
  theme: MaterialTheme,
  lines: ListItemLines,
  containerColor?: string,
  contentColor?: string,
) {
  const colors = getResolvedListItemColors(theme, containerColor)
  const headlineColor = contentColor ?? theme.colors.onSurface

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: lines === 3 ? 'flex-start' : 'center',
      minHeight: MIN_HEIGHT[lines],
      // MD3 list item padding: 16dp leading / 24dp trailing.
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.lg,
      paddingVertical: ITEM_PADDING_VERTICAL,
      backgroundColor: colors.backgroundColor,
    },
    interactiveContainer: {
      cursor: 'pointer',
    },
    disabledContainer: {
      cursor: 'auto',
    },
    focusRing: {
      position: 'absolute' as const,
      top: LIST_ITEM_FOCUS_RING_INSET,
      left: LIST_ITEM_FOCUS_RING_INSET,
      right: LIST_ITEM_FOCUS_RING_INSET,
      bottom: LIST_ITEM_FOCUS_RING_INSET,
      borderWidth: LIST_ITEM_FOCUS_RING_WIDTH,
      borderColor: theme.colors.secondary,
      borderRadius: theme.shape.cornerExtraSmall,
    },
    disabledContentWrapper: {
      flexDirection: 'row',
      flex: 1,
      opacity: theme.stateLayer.disabledOpacity,
    },
    leadingContent: {
      marginEnd: theme.spacing.md,
    },
    textBlock: {
      flex: 1,
    },
    overlineText: {
      ...theme.typography.labelSmall,
      color: theme.colors.onSurfaceVariant,
    },
    headlineText: {
      ...theme.typography.bodyLarge,
      color: headlineColor,
    },
    supportingText: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
    },
    trailingBlock: {
      marginStart: theme.spacing.md,
      alignItems: 'flex-end',
    },
    trailingSupportingText: {
      ...theme.typography.labelSmall,
      color: theme.colors.onSurfaceVariant,
    },
  })
}

export function createDividerStyles(theme: MaterialTheme, inset: boolean) {
  return StyleSheet.create({
    divider: {
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
      ...(inset ? { marginStart: INSET_START } : undefined),
    },
  })
}
