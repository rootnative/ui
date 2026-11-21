import type { MaterialTheme } from '@rootnative/core'
import { alphaColor, elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import type { EdgeInsets } from 'react-native-safe-area-context'
import { sideEdgesOfStyleKeys } from '../safe-area'
import type { Edge } from '../safe-area'
import type { SideSheetEdge, SideSheetVariant } from './types'

/**
 * MD3 side-sheet metrics.
 * Source: material-components-android `sidesheet/res/values/tokens.xml` —
 * `m3_comp_sheet_side_docked_container_width = 256dp`,
 * `docked_standard_container_color = colorSurface` at `level0` with
 * `Corner.None`, `docked_modal_container_color = colorSurfaceContainerLow` at
 * `level1` with `shapeAppearanceCornerLarge` on the corners that face the
 * content, and `detached_container_shape = shapeAppearanceCornerLarge` with
 * `m3_side_sheet_margin_detached = 16dp`. The header follows the MDC catalog
 * layout: a `titleLarge` headline in the default text color (onSurface) and a
 * close icon button tinted `colorOnSurfaceVariant` at the end.
 */
export const SIDE_SHEET_WIDTH = 256
export const SIDE_SHEET_DETACHED_MARGIN = 16
/** MD3 scrim opacity for modal surfaces. */
export const SIDE_SHEET_SCRIM_OPACITY = 0.32
/**
 * Least width of screen a modal sheet leaves uncovered, so there is always a
 * scrim to press on a narrow window. The same strip as the modal drawer.
 */
export const SIDE_SHEET_MIN_SCRIM_WIDTH = 56

/** Distance from the sheet edge to the headline, the content and the actions. */
const SIDE_SHEET_PADDING = 24
/**
 * Distance from the sheet edge to a 40dp header button. Its 24dp glyph then
 * starts on the same 24dp line as the text.
 */
const HEADER_BUTTON_INSET = 16
const HEADER_VERTICAL_PADDING = 16
/**
 * A 40dp header button plus the vertical padding. The content starts at the
 * same height with or without header buttons.
 */
const HEADER_MIN_HEIGHT = 72
const HEADER_GAP = 8
const ACTIONS_VERTICAL_PADDING = 16
const ACTION_GAP = 8

interface SurfaceShape {
  margin?: number
  borderRadius?: number
}

function surfaceShape(theme: MaterialTheme, detached: boolean): SurfaceShape {
  if (!detached) return {}
  return {
    margin: SIDE_SHEET_DETACHED_MARGIN,
    borderRadius: theme.shape.cornerLarge,
  }
}

// The one-sided styles take style keys that the caller resolves against the
// layout direction on each render. react-native-web resolves a logical key,
// such as `paddingStart`, as LTR under `<html dir="rtl">`, also in a
// `StyleSheet.create` style.

/** The strip of scrim on the far side, which stays on a narrow window. */
export function scrimGapStyle(farSideKey: string): ViewStyle {
  return { [farSideKey]: SIDE_SHEET_MIN_SCRIM_WIDTH }
}

/** The side padding of the header. A header button takes the smaller inset. */
export function headerInsetStyle(
  startKey: string,
  endKey: string,
  hasBack: boolean,
  hasClose: boolean,
): ViewStyle {
  return {
    [startKey]: hasBack ? HEADER_BUTTON_INSET : SIDE_SHEET_PADDING,
    [endKey]: hasClose ? HEADER_BUTTON_INSET : SIDE_SHEET_PADDING,
  }
}

/** The rounded corners of a docked modal sheet, on the side of the content. */
export function contentCornerStyle(
  theme: MaterialTheme,
  topKey: string,
  bottomKey: string,
): ViewStyle {
  return {
    [topKey]: theme.shape.cornerLarge,
    [bottomKey]: theme.shape.cornerLarge,
  }
}

export interface DetachedMargin {
  /** The margin on each physical side. */
  sides: Record<Edge, number>
  /** The same margins as style keys. */
  style: ViewStyle
}

/**
 * The margins of a detached sheet: the margin that `style` carries, plus the
 * safe-area inset of each edge in `edges`. So the whole sheet, and not only
 * its content, stays clear of the status bar and a notch. The same additive
 * maths as the padding of `SafeAreaView`.
 */
export function detachedMargin(
  style: StyleProp<ViewStyle>,
  insets: EdgeInsets,
  edges: Edge[],
): DetachedMargin {
  const flat = StyleSheet.flatten(style) ?? {}
  const num = (value: unknown, fallback: number) =>
    typeof value === 'number' ? value : fallback
  const margin = num(flat.margin, 0)
  const vertical = num(flat.marginVertical, margin)
  const horizontal = num(flat.marginHorizontal, margin)
  const inset = (edge: Edge) => (edges.includes(edge) ? insets[edge] : 0)
  const [leftKeyEdge, rightKeyEdge] = sideEdgesOfStyleKeys()
  const marginLeft = num(flat.marginLeft, horizontal) + inset(leftKeyEdge)
  const marginRight = num(flat.marginRight, horizontal) + inset(rightKeyEdge)
  const marginTop = num(flat.marginTop, vertical) + inset('top')
  const marginBottom = num(flat.marginBottom, vertical) + inset('bottom')
  const sides = { top: marginTop, right: 0, bottom: marginBottom, left: 0 }
  sides[leftKeyEdge] = marginLeft
  sides[rightKeyEdge] = marginRight
  return {
    sides,
    style: { marginTop, marginRight, marginBottom, marginLeft },
  }
}

export function createSideSheetStyles(
  theme: MaterialTheme,
  variant: SideSheetVariant,
  edge: SideSheetEdge,
  detached: boolean,
  width: number,
  containerColor?: string,
  contentColor?: string,
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
      backgroundColor: alphaColor(theme.colors.scrim, SIDE_SHEET_SCRIM_OPACITY),
    },
    // The press target inside the scrim stays transparent. A second 32% layer
    // on top of the first composites to about 54%.
    scrimPressArea: {
      ...StyleSheet.absoluteFill,
    },
    // A row, so the surface stretches to the full height and its detached
    // margin insets it on all four sides. `scrimGapStyle` pads the far side.
    sheetLayer: {
      ...StyleSheet.absoluteFill,
      flexDirection: 'row',
      justifyContent: edge === 'end' ? 'flex-end' : 'flex-start',
    },
    surface: isModal
      ? {
          width,
          flexShrink: 1,
          backgroundColor: surfaceColor,
          ...elevationStyle(theme.elevation.level1),
          ...surfaceShape(theme, detached),
        }
      : {
          width,
          alignSelf: 'stretch',
          backgroundColor: surfaceColor,
          ...surfaceShape(theme, detached),
        },
    safeArea: {
      flexGrow: 1,
      flexShrink: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: HEADER_MIN_HEIGHT,
      paddingVertical: HEADER_VERTICAL_PADDING,
      gap: HEADER_GAP,
    },
    headline: {
      ...theme.typography.titleLarge,
      color: contentColor ?? theme.colors.onSurface,
      flex: 1,
    },
    // Keeps the close button at the end when the sheet has no headline.
    headerSpacer: {
      flex: 1,
    },
    // `flexGrow` keeps the actions at the bottom of a tall sheet. `flexShrink`
    // lets the content scroll when it is taller than the sheet.
    body: {
      flexGrow: 1,
      flexShrink: 1,
    },
    bodyContent: {
      paddingHorizontal: SIDE_SHEET_PADDING,
      paddingBottom: SIDE_SHEET_PADDING,
    },
    bodyContentWithoutHeader: {
      paddingTop: SIDE_SHEET_PADDING,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: ACTION_GAP,
      paddingHorizontal: SIDE_SHEET_PADDING,
      paddingVertical: ACTIONS_VERTICAL_PADDING,
    },
  })
}
