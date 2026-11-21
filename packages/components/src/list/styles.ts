import type { MaterialTheme } from '@rootnative/core'
import { StyleSheet } from 'react-native'
import type { ViewStyle } from 'react-native'
import type { ListItemLines } from './types'

const ITEM_PADDING_VERTICAL = 12

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
    headline: {
      ...theme.typography.titleSmall,
      color: theme.colors.onSurfaceVariant,
      paddingVertical: theme.spacing.sm,
    },
  })
}

export interface ListItemColors {
  backgroundColor: string
}

export function getResolvedListItemColors(
  theme: MaterialTheme,
  containerColor?: string,
): ListItemColors {
  if (containerColor) {
    return {
      backgroundColor: containerColor,
    }
  }

  return {
    backgroundColor: 'transparent',
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
      // `sideInsetStyle` gives the side padding.
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
      alignItems: 'flex-end',
    },
    trailingSupportingText: {
      ...theme.typography.labelSmall,
      color: theme.colors.onSurfaceVariant,
    },
  })
}

// The one-sided styles take style keys that the caller resolves against the
// layout direction on each render. react-native-web resolves a logical key,
// such as `paddingStart`, as LTR under `<html dir="rtl">`, also in a
// `StyleSheet.create` style.

/**
 * The side padding of a headline and of an item. MD3 list item padding: 16dp
 * leading, 24dp trailing. A `StyleSheet` style, as before, so a consumer
 * `style` keeps its precedence on the web: react-native-web puts an inline key
 * above each of its classes.
 */
export function sideInsetStyle(
  theme: MaterialTheme,
  startKey: string,
  endKey: string,
): ViewStyle {
  return StyleSheet.create({
    inset: { [startKey]: theme.spacing.md, [endKey]: theme.spacing.lg },
  }).inset
}

/** The 16dp gap between the text and the leading or trailing content. */
export function contentGapStyle(
  theme: MaterialTheme,
  textSideKey: string,
): ViewStyle {
  return { [textSideKey]: theme.spacing.md }
}
