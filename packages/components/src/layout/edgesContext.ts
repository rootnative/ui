import { createContext, useContext, useMemo } from 'react'
import type { ViewStyle } from 'react-native'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'
import type { Edge } from '../safe-area'

/**
 * The safe-area edges that the nearest `Layout` pads, `null` outside one.
 * The bars read it to bleed their background through the side padding.
 */
export const LayoutEdgesContext = createContext<Edge[] | null>(null)

const SIDE_EDGES: Edge[] = ['left', 'right']
const NO_EDGES: Edge[] = []

/**
 * The safe-area edges of a bar: the sides when `insetSides` is on, plus the
 * one edge the bar opts into (`top` for `AppBar`, `bottom` for the bottom
 * bars).
 */
export function barEdges(insetSides: boolean, edge?: Edge): Edge[] {
  if (insetSides) {
    return edge ? [...SIDE_EDGES, edge] : SIDE_EDGES
  }
  return edge ? [edge] : NO_EDGES
}

/**
 * The style that pulls a full-width bar back out through the side padding of
 * the nearest `Layout`, so its background reaches the screen edge in landscape
 * while its content, padded by the side edges, stays clear of the notch.
 * `undefined` when `insetSides` is off, outside a `Layout` that pads a side,
 * and outside a `SafeAreaProvider`, where there is no inset to read.
 */
export function useSideInsetBleed(insetSides: boolean): ViewStyle | undefined {
  const edges = useContext(LayoutEdgesContext)
  const insets = useContext(SafeAreaInsetsContext)

  return useMemo(() => {
    if (!insetSides || !edges || !insets) {
      return undefined
    }
    const marginLeft = edges.includes('left') ? -insets.left : 0
    const marginRight = edges.includes('right') ? -insets.right : 0
    if (marginLeft === 0 && marginRight === 0) {
      return undefined
    }
    return { marginLeft, marginRight }
  }, [insetSides, edges, insets])
}
