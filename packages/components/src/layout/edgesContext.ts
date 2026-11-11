import { isRTLDirection } from '@rootnative/utils'
import { createContext, useContext, useMemo } from 'react'
import type { ViewStyle } from 'react-native'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'
import { sideEdgesOfStyleKeys } from '../safe-area'
import type { Edge } from '../safe-area'

/**
 * The safe-area edges that the nearest `Layout` pads, `null` outside one.
 * The bars read it to bleed their background through the side padding.
 */
export const LayoutEdgesContext = createContext<Edge[] | null>(null)

/**
 * The sides a bar pads and bleeds through: both, none, or the one logical
 * side that touches the screen edge.
 */
export type BarInsetSides = boolean | 'start' | 'end'

const SIDE_EDGES: Edge[] = ['left', 'right']
const LEFT_EDGE: Edge[] = ['left']
const RIGHT_EDGE: Edge[] = ['right']
const NO_EDGES: Edge[] = []

/**
 * The physical side edges of a bar. `'start'` and `'end'` follow the layout
 * direction, so a bar beside a start-edge `NavigationRail` passes `'end'` in
 * LTR and in RTL. Each result is a module constant, so it is a stable hook
 * dependency.
 */
export function barSideEdges(insetSides: BarInsetSides): Edge[] {
  if (insetSides === true) {
    return SIDE_EDGES
  }
  if (insetSides === false) {
    return NO_EDGES
  }
  const onRight = isRTLDirection()
    ? insetSides === 'start'
    : insetSides === 'end'
  return onRight ? RIGHT_EDGE : LEFT_EDGE
}

/**
 * The safe-area edges of a bar: its side edges from `barSideEdges`, plus the
 * one edge the bar opts into (`top` for `AppBar`, `bottom` for the bottom
 * bars).
 */
export function barEdges(sideEdges: Edge[], edge?: Edge): Edge[] {
  return edge ? [...sideEdges, edge] : sideEdges
}

/**
 * The style that pulls a full-width bar back out through the side padding of
 * the nearest `Layout`, so its background reaches the screen edge in landscape
 * while its content, padded by the side edges, stays clear of the notch. It
 * pulls only through the bar's own `sideEdges`: a bar beside a rail must not
 * cover the rail. `undefined` when the bar has no side edge, outside a
 * `Layout` that pads a side, and outside a `SafeAreaProvider`, where there is
 * no inset to read.
 */
export function useSideInsetBleed(sideEdges: Edge[]): ViewStyle | undefined {
  const edges = useContext(LayoutEdgesContext)
  const insets = useContext(SafeAreaInsetsContext)

  return useMemo(() => {
    if (!edges || !insets) {
      return undefined
    }
    const bleed = (edge: 'left' | 'right') =>
      sideEdges.includes(edge) && edges.includes(edge) && insets[edge] > 0
        ? -insets[edge]
        : 0
    const [leftKeyEdge, rightKeyEdge] = sideEdgesOfStyleKeys()
    const marginLeft = bleed(leftKeyEdge)
    const marginRight = bleed(rightKeyEdge)
    if (marginLeft === 0 && marginRight === 0) {
      return undefined
    }
    return { marginLeft, marginRight }
  }, [sideEdges, edges, insets])
}
