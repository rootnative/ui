import { selectRTL } from '@rootnative/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { LayoutChangeEvent, View } from 'react-native'
import { useWindowDimensions } from 'react-native'

/** Side of the anchor the overlay prefers to occupy. */
export type AnchorSide = 'top' | 'bottom'

/**
 * Cross-axis alignment against the anchor, in *logical* terms — `'start'` is
 * the anchor's left edge in LTR and its right edge in RTL.
 */
export type AnchorAlign = 'start' | 'center' | 'end'

export interface AnchorRect {
  x: number
  y: number
  width: number
  height: number
}

export interface AnchorPoint {
  x: number
  y: number
}

export interface AnchorSize {
  width: number
  height: number
}

export interface AnchorPosition {
  /** Absolute offset inside the overlay layer. */
  top: number
  /** Absolute offset inside the overlay layer. Physical, not logical. */
  left: number
  /** Side the overlay resolved to, after collision flipping. */
  side: AnchorSide
  /**
   * Vertical space available on the resolved side. Cap the scrollable part of
   * the overlay with it — the position above already assumes the overlay does
   * not exceed it.
   */
  maxHeight: number
  /**
   * `transformOrigin` for the overlay corner nearest the anchor, so a scale
   * entry grows out of the trigger instead of out of the overlay's middle.
   */
  transformOrigin: string
}

export interface UseAnchorPositionOptions {
  /** Whether the overlay is mounted. Measurement only runs while `true`. */
  active: boolean
  /**
   * Side the overlay is placed on when it fits there.
   * @default 'bottom'
   */
  side?: AnchorSide
  /**
   * Cross-axis alignment against the anchor.
   * @default 'start'
   */
  align?: AnchorAlign
  /**
   * Gap between the anchor edge and the overlay, in dp.
   * @default 0
   */
  offset?: number
  /**
   * Minimum distance the overlay keeps from every screen edge, in dp.
   * @default 8
   */
  screenMargin?: number
}

export interface UseAnchorPositionResult {
  /** Attach to the view the overlay is anchored to. */
  anchorRef: React.RefObject<View | null>
  /**
   * Attach to the overlay layer — the absolute-fill view the positioned
   * overlay sits in. Its window origin is subtracted from the result, so the
   * position stays correct inside a named `PortalHost` that is not at the
   * window origin.
   */
  layerRef: React.RefObject<View | null>
  /** Re-measure the anchor and the layer. Cheap; safe to call from `onLayout`. */
  measure: () => void
  /** Pass as the overlay's `onLayout` — its natural size drives the collision math. */
  onOverlayLayout: (event: LayoutChangeEvent) => void
  /**
   * `null` until both the anchor and the overlay have been measured. Keep the
   * overlay mounted but invisible until it resolves: the overlay has to be laid
   * out before its size is known, and its size is what decides the side.
   */
  position: AnchorPosition | null
}

const DEFAULT_SCREEN_MARGIN = 8
const ORIGIN: AnchorPoint = { x: 0, y: 0 }

function sameRect(a: AnchorRect | null, b: AnchorRect): boolean {
  return (
    a !== null &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height
  )
}

/**
 * Anchor-relative placement with collision flipping, for overlays that hang off
 * a trigger rather than filling or centering in the screen (Menu, Tooltip).
 *
 * The measurement model, which is why this is a hook and not a style helper:
 *
 * 1. The anchor is measured in **window** coordinates (`measureInWindow`) —
 *    `onLayout` reports parent-relative coordinates, which say nothing about
 *    where the anchor sits on screen.
 * 2. The overlay reports its **natural** size through `onOverlayLayout`. It
 *    must therefore already be mounted, which is why `position` starts `null`
 *    instead of the overlay waiting for a position before it renders.
 * 3. The overlay layer is measured too, and its origin subtracted, so window
 *    coordinates survive a layer that is not at the window origin.
 *
 * Flipping is deliberately conservative: the overlay only moves to the other
 * side when it does not fit *and* that side is roomier. Flipping into an
 * equally cramped side just moves the clipping around.
 *
 * Internal — not exported from the package.
 */
export function useAnchorPosition(
  options: UseAnchorPositionOptions,
): UseAnchorPositionResult {
  const {
    active,
    side: preferredSide = 'bottom',
    align = 'start',
    offset = 0,
    screenMargin = DEFAULT_SCREEN_MARGIN,
  } = options

  const anchorRef = useRef<View | null>(null)
  const layerRef = useRef<View | null>(null)
  const [anchor, setAnchor] = useState<AnchorRect | null>(null)
  const [layerOrigin, setLayerOrigin] = useState<AnchorPoint>(ORIGIN)
  const [overlay, setOverlay] = useState<AnchorSize | null>(null)
  const { width: windowWidth, height: windowHeight } = useWindowDimensions()

  const measure = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      // A view measured mid-layout reports NaN on Android. Skipping the frame
      // is right: another measure follows once layout settles.
      if (Number.isNaN(x) || Number.isNaN(y)) return
      const next = { x, y, width, height }
      setAnchor((prev) => (sameRect(prev, next) ? prev : next))
    })
    layerRef.current?.measureInWindow((x, y) => {
      if (Number.isNaN(x) || Number.isNaN(y)) return
      setLayerOrigin((prev) => (prev.x === x && prev.y === y ? prev : { x, y }))
    })
  }, [])

  const onOverlayLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    setOverlay((prev) =>
      prev !== null && prev.width === width && prev.height === height
        ? prev
        : { width, height },
    )
  }, [])

  // Re-measures on open and on rotation / window resize.
  useEffect(() => {
    if (!active) return
    measure()
  }, [active, measure, windowWidth, windowHeight])

  // The overlay's size is meaningless once it unmounts, and dropping it is what
  // makes the next open wait for a fresh layout instead of flashing at the
  // previous one's position.
  useEffect(() => {
    if (active) return
    setOverlay(null)
  }, [active])

  return useMemo(() => {
    const position =
      active && anchor !== null && overlay !== null
        ? resolveAnchorPosition({
            anchor,
            overlay,
            layerOrigin,
            windowWidth,
            windowHeight,
            preferredSide,
            align,
            offset,
            screenMargin,
          })
        : null

    return { anchorRef, layerRef, measure, onOverlayLayout, position }
  }, [
    active,
    anchor,
    overlay,
    layerOrigin,
    windowWidth,
    windowHeight,
    preferredSide,
    align,
    offset,
    screenMargin,
    measure,
    onOverlayLayout,
  ])
}

export interface ResolveAnchorPositionArgs {
  anchor: AnchorRect
  overlay: AnchorSize
  layerOrigin: AnchorPoint
  windowWidth: number
  windowHeight: number
  preferredSide: AnchorSide
  align: AnchorAlign
  offset: number
  screenMargin: number
}

/**
 * The placement math, with no React in it. Exported so the geometry can be
 * tested directly — `measureInWindow` is a no-op under the React Native jest
 * preset, so nothing measurable reaches the hook in a test renderer.
 */
export function resolveAnchorPosition({
  anchor,
  overlay,
  layerOrigin,
  windowWidth,
  windowHeight,
  preferredSide,
  align,
  offset,
  screenMargin,
}: ResolveAnchorPositionArgs): AnchorPosition {
  const spaceBelow =
    windowHeight - screenMargin - (anchor.y + anchor.height + offset)
  const spaceAbove = anchor.y - offset - screenMargin

  const preferredSpace = preferredSide === 'bottom' ? spaceBelow : spaceAbove
  const otherSpace = preferredSide === 'bottom' ? spaceAbove : spaceBelow
  const oppositeSide: AnchorSide = preferredSide === 'bottom' ? 'top' : 'bottom'
  const side: AnchorSide =
    overlay.height <= preferredSpace || otherSpace <= preferredSpace
      ? preferredSide
      : oppositeSide

  // Independent of the measured overlay height, so capping the overlay with it
  // cannot feed back into the side decision on the next layout pass.
  const maxHeight = Math.max(0, side === 'bottom' ? spaceBelow : spaceAbove)
  const height = Math.min(overlay.height, maxHeight)

  const top =
    side === 'bottom'
      ? anchor.y + anchor.height + offset
      : anchor.y - offset - height

  // Logical alignment resolves to a physical edge here — every value below this
  // point is physical, because that is what `left` means.
  const edge =
    align === 'center'
      ? 'center'
      : align === 'start'
        ? selectRTL('left', 'right')
        : selectRTL('right', 'left')

  const unclampedLeft =
    edge === 'left'
      ? anchor.x
      : edge === 'right'
        ? anchor.x + anchor.width - overlay.width
        : anchor.x + (anchor.width - overlay.width) / 2

  // An overlay wider than the window pins to the start margin rather than
  // centering its overflow across both edges.
  const maxLeft = Math.max(
    screenMargin,
    windowWidth - screenMargin - overlay.width,
  )
  const left = Math.min(Math.max(unclampedLeft, screenMargin), maxLeft)

  return {
    top: top - layerOrigin.y,
    left: left - layerOrigin.x,
    side,
    maxHeight,
    transformOrigin: `${edge} ${side === 'bottom' ? 'top' : 'bottom'}`,
  }
}
