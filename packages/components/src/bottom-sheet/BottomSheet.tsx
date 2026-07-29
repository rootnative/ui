import { useTheme } from '@rootnative/core'
import {
  Motion,
  Presence,
  useAnimator,
  useShouldReduceMotion,
} from '@rootnative/inertia'
import { Animated } from '@rootnative/inertia/reanimated'
import { useTouchDrag } from '@rootnative/inertia/touch'
import type {
  TouchReleaseInfo,
  TouchReleaseResult,
} from '@rootnative/inertia/touch'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AccessibilityActionEvent, LayoutChangeEvent } from 'react-native'
import { BackHandler, Platform, Pressable, View } from 'react-native'
import { useFocusTrap } from '../internal/useFocusTrap'
import { PORTAL_LAYERS } from '../portal/layers'
import { Portal } from '../portal/Portal'
import { SafeAreaView } from '../safe-area'
import type { Edge } from '../safe-area'
import { pickSnapTarget, resolveSnapHeights } from './geometry'
import { createBottomSheetStyles } from './styles'
import type { BottomSheetProps } from './types'

// RN-Web forwards `onKeyDown` on View to the underlying DOM element, but the
// upstream `ViewProps` type doesn't include it. Same local augmentation as
// Slider's `PressableProps` one.
declare module 'react-native' {
  interface ViewProps {
    onKeyDown?: (event: { nativeEvent: { key?: string } }) => void
  }
}

/**
 * Rubber-band coefficient for drags past the tallest snap point (and, on a
 * non-dismissable sheet, below the lowest one).
 */
const OVERDRAG_ELASTIC = 0.3

const ACCESSIBILITY_ACTION_EXPAND = 'increment'
const ACCESSIBILITY_ACTION_COLLAPSE = 'decrement'
const ACCESSIBILITY_ACTION_DISMISS = 'escape'

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(index, length - 1))
}

export function BottomSheet({
  visible,
  onDismiss,
  children,
  variant = 'modal',
  snapPoints,
  snapIndex,
  defaultSnapIndex = 0,
  onSnapIndexChange,
  dismissable = true,
  showDragHandle = true,
  insetBottom = true,
  containerColor,
  hostName,
  style,
  scrimStyle,
  scrimAccessibilityLabel = 'Close sheet',
  dragHandleAccessibilityLabel = 'Drag handle',
  testID,
  ...rest
}: BottomSheetProps) {
  const theme = useTheme()
  const styles = useMemo(
    () => createBottomSheetStyles(theme, containerColor),
    [theme, containerColor],
  )
  const animate = useAnimator()
  const shouldReduceMotion = useShouldReduceMotion()
  const isModal = variant === 'modal'

  const [layerHeight, setLayerHeight] = useState<number | null>(null)
  const [sheetHeight, setSheetHeight] = useState<number | null>(null)

  // Keyed on the points' values, not the array's identity — an inline
  // `snapPoints={['50%']}` literal must not re-resolve (and re-settle the
  // sheet) on every parent render.
  const snapPointsKey = snapPoints?.join('\0')
  // Visible heights ascending; `null` while a percentage snap can't resolve
  // because the layer is unmeasured.
  const snapHeights = useMemo(() => {
    if (snapPoints && snapPoints.length > 0) {
      return resolveSnapHeights(snapPoints, layerHeight)
    }
    return sheetHeight !== null ? [sheetHeight] : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapPointsKey, layerHeight, sheetHeight])

  // With explicit snap points the surface is sized to the tallest one;
  // without them it sizes to content, capped at the layer.
  const fixedHeight =
    snapPoints && snapPoints.length > 0 && snapHeights !== null
      ? snapHeights[snapHeights.length - 1]
      : null

  // Snap offsets parallel to `snapHeights` — px of downward translation from
  // fully visible. Index i is the i-th smallest snap.
  const offsets = useMemo(() => {
    if (snapHeights === null || sheetHeight === null) return null
    return snapHeights.map((h) => Math.max(0, sheetHeight - h))
  }, [snapHeights, sheetHeight])

  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(0, snapIndex ?? defaultSnapIndex),
  )
  const currentIndexRef = useRef(currentIndex)

  // Release decisions and keyboard handlers read the latest geometry through
  // refs so the PanResponder is never rebuilt mid-gesture (Slider precedent:
  // RN's gesture system holds state on the responder instance).
  const geometryRef = useRef<{
    offsets: number[]
    hiddenOffset: number
    dismissable: boolean
  } | null>(null)
  geometryRef.current =
    offsets !== null && sheetHeight !== null
      ? { offsets, hiddenOffset: sheetHeight, dismissable }
      : null
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss
  const onSnapIndexChangeRef = useRef(onSnapIndexChange)
  onSnapIndexChangeRef.current = onSnapIndexChange
  const reduceMotionRef = useRef(shouldReduceMotion)
  reduceMotionRef.current = shouldReduceMotion
  const springRef = useRef(theme.motion.springDefaultSpatial)
  springRef.current = theme.motion.springDefaultSpatial

  const settleAtIndex = useCallback((index: number) => {
    if (index === currentIndexRef.current) return
    currentIndexRef.current = index
    setCurrentIndex(index)
    onSnapIndexChangeRef.current?.(index)
  }, [])

  const onRelease = useCallback(
    (info: TouchReleaseInfo): TouchReleaseResult | void => {
      const geometry = geometryRef.current
      if (geometry === null) return
      const anchor =
        geometry.offsets[
          clampIndex(currentIndexRef.current, geometry.offsets.length)
        ]
      const target = pickSnapTarget({
        position: info.y,
        velocity: info.velocity.y,
        anchor,
        offsets: geometry.offsets,
        hiddenOffset: geometry.hiddenOffset,
        dismissable: geometry.dismissable,
      })

      const index = geometry.offsets.findIndex(
        (offset) => Math.abs(offset - target) < 0.5,
      )
      if (index === -1) {
        // Settling at the hidden offset is the dismissal — the sheet slides
        // out under this release animation while `visible` flips off.
        onDismissRef.current()
      } else {
        settleAtIndex(index)
      }

      // The release spring reuses the theme's default-spatial params plus the
      // gesture's velocity. `useTouchDrag` is deliberately reduced-motion
      // unaware (collapsing a spring mid-drag strands gesture values), so the
      // settle is gated here instead.
      if (reduceMotionRef.current) {
        return { y: { type: 'no-animation', to: target } }
      }
      return {
        y: {
          type: 'spring',
          ...springRef.current,
          to: target,
          velocity: info.velocity.y,
        },
      }
    },
    [settleAtIndex],
  )

  // `offsets` is parallel to the ascending `snapHeights`, so the tallest
  // snap's offset (the smallest) sits at the END of the array and the lowest
  // snap's (the largest) at the start.
  const tallestOffset =
    offsets !== null ? offsets[offsets.length - 1] : undefined
  const lowestOffset = offsets !== null ? offsets[0] : undefined
  const dragConstraints = useMemo(
    () => ({
      top: tallestOffset ?? 0,
      bottom: dismissable ? (sheetHeight ?? undefined) : lowestOffset,
    }),
    [tallestOffset, lowestOffset, dismissable, sheetHeight],
  )

  const drag = useTouchDrag({
    axis: 'y',
    constraints: dragConstraints,
    elastic: OVERDRAG_ELASTIC,
    onRelease,
  })
  const { dragY, isDragging } = drag

  const isControlled = snapIndex !== undefined
  const open = visible

  // Hide the surface on each fresh open until its layout is known — computed
  // during render so the first open frame never paints the sheet at rest.
  const [entered, setEntered] = useState(false)
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setEntered(false)
  }
  const enteredRef = useRef(false)
  useEffect(() => {
    if (!open) enteredRef.current = false
  }, [open])

  // Enter: jump to fully hidden, then spring to the opening snap. Runs once
  // per open, as soon as the surface (and, for percentage snaps, the layer)
  // has been measured.
  useEffect(() => {
    if (!open || enteredRef.current) return
    if (offsets === null || sheetHeight === null) return
    const index = clampIndex(
      isControlled ? snapIndex : currentIndexRef.current,
      offsets.length,
    )
    currentIndexRef.current = index
    setCurrentIndex(index)
    dragY.value = sheetHeight
    animate(dragY, offsets[index], 'spring-default-spatial')
    enteredRef.current = true
    setEntered(true)
  }, [open, offsets, sheetHeight, isControlled, snapIndex, animate, dragY])

  // Re-settle when the geometry moves under an open sheet (content resize,
  // rotation, snap-point change) or the controlled `snapIndex` changes.
  useEffect(() => {
    if (!open || !enteredRef.current || offsets === null) return
    if (isDragging.value) return
    const index = clampIndex(
      isControlled ? snapIndex : currentIndexRef.current,
      offsets.length,
    )
    if (index !== currentIndexRef.current) {
      currentIndexRef.current = index
      setCurrentIndex(index)
    }
    animate(dragY, offsets[index], 'spring-default-spatial')
  }, [open, offsets, isControlled, snapIndex, animate, dragY, isDragging])

  // Web keyboard containment, modal variant only — a standard sheet lets
  // touches and tab stops through to the content behind it by design, so
  // trapping focus there would be wrong. Arrow keys stay with the drag
  // handle's own snap navigation rather than moving between tab stops.
  const surfaceRef = useFocusTrap({
    active: open && isModal,
    onEscape: dismissable ? onDismiss : undefined,
  })

  // Android hardware back closes a dismissable modal sheet before it pops
  // the navigation stack.
  useEffect(() => {
    if (!open || !isModal || !dismissable || Platform.OS !== 'android') return
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onDismiss()
        return true
      },
    )
    return () => subscription.remove()
  }, [open, isModal, dismissable, onDismiss])

  const onLayerLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height
    setLayerHeight((current) => (current === height ? current : height))
  }, [])
  const onSurfaceLayout = useCallback((event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height
    setSheetHeight((current) => (current === height ? current : height))
  }, [])

  // Snap navigation for assistive tech and the web keyboard. The drag handle
  // announces as adjustable: increment expands, decrement collapses, escape
  // dismisses.
  const snapCount = offsets?.length ?? 1
  const moveSnap = useCallback(
    (delta: number) => {
      const geometry = geometryRef.current
      if (geometry === null) return
      const next = clampIndex(
        currentIndexRef.current + delta,
        geometry.offsets.length,
      )
      settleAtIndex(next)
      animate(dragY, geometry.offsets[next], 'spring-default-spatial')
    },
    [settleAtIndex, animate, dragY],
  )

  const accessibilityActions = useMemo(() => {
    const actions: { name: string; label: string }[] = []
    if (snapCount > 1) {
      actions.push(
        { name: ACCESSIBILITY_ACTION_EXPAND, label: 'Expand' },
        { name: ACCESSIBILITY_ACTION_COLLAPSE, label: 'Collapse' },
      )
    }
    if (dismissable) {
      actions.push({ name: ACCESSIBILITY_ACTION_DISMISS, label: 'Dismiss' })
    }
    return actions
  }, [snapCount, dismissable])

  const onAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      switch (event.nativeEvent.actionName) {
        case ACCESSIBILITY_ACTION_EXPAND:
          moveSnap(1)
          break
        case ACCESSIBILITY_ACTION_COLLAPSE:
          moveSnap(-1)
          break
        case ACCESSIBILITY_ACTION_DISMISS:
          if (dismissable) onDismiss()
          break
      }
    },
    [moveSnap, dismissable, onDismiss],
  )

  // Web only: arrow keys move between snaps, Escape dismisses. Native
  // ignores the prop.
  const onHandleKeyDown = useCallback(
    (event: { nativeEvent: { key?: string } }) => {
      switch (event.nativeEvent.key) {
        case 'ArrowUp':
          moveSnap(1)
          break
        case 'ArrowDown':
          moveSnap(-1)
          break
        case 'Escape':
          if (dismissable) onDismiss()
          break
      }
    },
    [moveSnap, dismissable, onDismiss],
  )

  const heightStyle = useMemo(() => {
    if (fixedHeight !== null) return { height: fixedHeight }
    return layerHeight !== null ? { maxHeight: layerHeight } : null
  }, [fixedHeight, layerHeight])

  // Exit slides the wrapper down by the sheet's own height, which covers the
  // remaining travel from any snap. The fallbacks only matter if a sheet is
  // closed before it was ever measured.
  const exitDistance = sheetHeight ?? layerHeight ?? 1000

  const safeAreaEdges = useMemo<Edge[]>(
    () => (insetBottom ? ['bottom'] : []),
    [insetBottom],
  )

  return (
    <Portal priority={PORTAL_LAYERS.sheet} hostName={hostName}>
      <View
        style={styles.layer}
        pointerEvents="box-none"
        onLayout={onLayerLayout}
      >
        <Presence>
          {open && isModal ? (
            <Motion.View
              key="scrim"
              style={[styles.scrim, scrimStyle]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition="spring-fast-effects"
            >
              <Pressable
                style={styles.scrimPressArea}
                onPress={dismissable ? onDismiss : undefined}
                disabled={!dismissable}
                accessibilityLabel={scrimAccessibilityLabel}
                role="button"
                importantForAccessibility={
                  dismissable ? 'yes' : 'no-hide-descendants'
                }
              />
            </Motion.View>
          ) : null}

          {open ? (
            <Motion.View
              key="sheet"
              pointerEvents="box-none"
              style={styles.sheetLayer}
              initial={{ translateY: 0 }}
              animate={{ translateY: 0 }}
              exit={{ translateY: exitDistance }}
              transition="spring-default-spatial"
            >
              <Animated.View
                {...rest}
                ref={surfaceRef}
                testID={testID}
                style={[
                  styles.surface,
                  heightStyle,
                  drag.animatedStyle,
                  entered ? null : styles.surfaceUnmeasured,
                  style,
                ]}
                // Invisible until measured, so it must not swallow touches
                // during that frame either.
                pointerEvents={entered ? 'auto' : 'none'}
                onLayout={onSurfaceLayout}
                role={isModal ? 'dialog' : undefined}
                aria-modal={isModal || undefined}
                accessibilityViewIsModal={isModal}
              >
                <View style={styles.overdragCover} />
                {showDragHandle ? (
                  <View
                    {...drag.panHandlers}
                    style={styles.dragHandleArea}
                    focusable
                    accessibilityRole="adjustable"
                    accessibilityLabel={dragHandleAccessibilityLabel}
                    // `aria-*` alongside `accessibilityValue`:
                    // react-native-web 0.21 reads only the ARIA spelling,
                    // while RN's View merges the two for native.
                    aria-valuemin={0}
                    aria-valuemax={snapCount - 1}
                    aria-valuenow={clampIndex(currentIndex, snapCount)}
                    accessibilityValue={{
                      min: 0,
                      max: snapCount - 1,
                      now: clampIndex(currentIndex, snapCount),
                    }}
                    accessibilityActions={accessibilityActions}
                    onAccessibilityAction={onAccessibilityAction}
                    onKeyDown={onHandleKeyDown}
                  >
                    <View style={styles.dragHandle} />
                  </View>
                ) : null}
                <SafeAreaView edges={safeAreaEdges} style={styles.content}>
                  {children}
                </SafeAreaView>
              </Animated.View>
            </Motion.View>
          ) : null}
        </Presence>
      </View>
    </Portal>
  )
}
