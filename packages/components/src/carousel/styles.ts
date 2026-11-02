import type { MaterialTheme } from '@rootnative/core'
import { StyleSheet } from 'react-native'

/**
 * MD3 carousel metrics.
 * Source: androidx.compose.material3.carousel — `CarouselDefaults`,
 * `HorizontalMultiBrowseCarouselSample`: item shape
 * `MaterialTheme.shapes.extraLarge` (28dp), `itemSpacing = 8.dp`,
 * `preferredItemWidth = 186.dp`, item height `205.dp`,
 * `MinSmallItemSize = 40.dp`, `MaxSmallItemSize = 56.dp`.
 */
export const DEFAULT_ITEM_WIDTH = 186
export const DEFAULT_ITEM_HEIGHT = 205
export const ITEM_GAP = 8

/** Focus-ring geometry, drawn inside the item so the mask does not clip it. */
const FOCUS_RING_INSET = 2
const FOCUS_RING_WIDTH = 3

export function createCarouselStyles(
  theme: MaterialTheme,
  vertical: boolean,
  gap: number,
  contentPadding: number,
  containerColor?: string,
) {
  const radius = theme.shape.cornerExtraLarge
  return StyleSheet.create({
    root: {
      overflow: 'hidden',
    },
    content: {
      flexDirection: vertical ? 'column' : 'row',
      gap,
      ...(vertical
        ? { paddingVertical: contentPadding }
        : { paddingHorizontal: contentPadding }),
    },
    // One slot per item, of the large size. The mask inside moves and
    // narrows; the slot keeps the scroll content at the nominal width.
    slot: {
      flexDirection: 'row',
    },
    mask: {
      overflow: 'hidden',
      borderRadius: radius,
    },
    maskContent: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: containerColor ?? theme.colors.surfaceContainerHighest,
      borderRadius: radius,
      overflow: 'hidden',
    },
    interactiveContainer: {
      cursor: 'pointer',
    },
    focusRing: {
      position: 'absolute',
      top: FOCUS_RING_INSET,
      left: FOCUS_RING_INSET,
      right: FOCUS_RING_INSET,
      bottom: FOCUS_RING_INSET,
      borderWidth: FOCUS_RING_WIDTH,
      borderColor: theme.colors.secondary,
      borderRadius: Math.max(0, radius - FOCUS_RING_INSET),
    },
  })
}
