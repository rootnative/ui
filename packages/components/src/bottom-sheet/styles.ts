import type { MaterialTheme } from '@rootnative/core'
import { alphaColor, elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'

/**
 * MD3 bottom-sheet metrics.
 * Source: androidx.compose.material3.SheetBottomTokens + SheetDefaults —
 * `DockedContainerColor = surfaceContainerLow`,
 * `DockedContainerShape = CornerExtraLargeTop` (28dp),
 * `DockedModalContainerElevation = DockedStandardContainerElevation = Level1`,
 * `DockedDragHandleWidth = 32.dp`, `DockedDragHandleHeight = 4.dp`,
 * `DragHandleVerticalPadding = 22.dp`, `SheetMaxWidth = 640.dp`.
 */
export const SHEET_MAX_WIDTH = 640
export const DRAG_HANDLE_WIDTH = 32
export const DRAG_HANDLE_HEIGHT = 4
/** 4dp handle + 22dp above and below = the 48dp drag touch target. */
const DRAG_HANDLE_VERTICAL_PADDING = 22

/** MD3 scrim opacity for modal surfaces. */
export const SHEET_SCRIM_OPACITY = 0.32

/**
 * Extra surface painted below the sheet's bottom edge so the rubber-band
 * overdrag above the tallest snap (and a settle spring's overshoot) never
 * opens a gap between the sheet and the screen edge.
 */
const OVERDRAG_COVER_HEIGHT = 120

export function createBottomSheetStyles(
  theme: MaterialTheme,
  containerColor?: string,
) {
  const surfaceColor = containerColor ?? theme.colors.surfaceContainerLow

  return StyleSheet.create({
    // Absolute-fills the portal layer. `box-none` at the call site so a
    // standard sheet leaves the screen behind it interactive.
    layer: {
      ...StyleSheet.absoluteFillObject,
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: alphaColor(theme.colors.scrim, SHEET_SCRIM_OPACITY),
    },
    // The press target inside the scrim stays transparent — giving it the
    // scrim color too would composite two 32% layers into ~54%.
    scrimPressArea: {
      ...StyleSheet.absoluteFillObject,
    },
    // Bottom-anchors the surface; centering handles large screens where the
    // sheet is narrower than the window.
    sheetLayer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    surface: {
      width: '100%',
      maxWidth: SHEET_MAX_WIDTH,
      borderTopLeftRadius: theme.shape.cornerExtraLarge,
      borderTopRightRadius: theme.shape.cornerExtraLarge,
      backgroundColor: surfaceColor,
      ...elevationStyle(theme.elevation.level1),
    },
    // Hides the surface between mount and its first layout pass — the sheet
    // has to be measured before the enter slide knows its travel, and it
    // would otherwise flash fully open for a frame.
    surfaceUnmeasured: {
      opacity: 0,
    },
    overdragCover: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      height: OVERDRAG_COVER_HEIGHT,
      backgroundColor: surfaceColor,
    },
    dragHandleArea: {
      alignItems: 'center',
      paddingVertical: DRAG_HANDLE_VERTICAL_PADDING,
      // RN's style type only knows 'auto' | 'pointer' — 'grab' would be more
      // honest on web, but it isn't expressible without a cast.
      cursor: 'pointer',
    },
    // Intentional deviation from the catalog plan's "onSurfaceVariant @ 40%":
    // current compose (Expressive-updated) dropped the alpha —
    // `BottomSheetDefaults.DragHandle` uses `DockedDragHandleColor` at full
    // opacity — and per the audit convention the Expressive value wins.
    dragHandle: {
      width: DRAG_HANDLE_WIDTH,
      height: DRAG_HANDLE_HEIGHT,
      borderRadius: DRAG_HANDLE_HEIGHT / 2,
      backgroundColor: theme.colors.onSurfaceVariant,
    },
    // `flexShrink` lets a fixed-height sheet bound its content, so a consumer
    // ScrollView shrinks into the surface and scrolls instead of growing it.
    content: {
      flexShrink: 1,
    },
  })
}
