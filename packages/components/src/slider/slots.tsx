import { useTheme } from '@rootnative/core'
import type { LayoutChangeEvent, TextStyle, ViewStyle } from 'react-native'
import { Text } from 'react-native'
import Animated, {
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {
  PRESSED_HALF,
  REST_HALF,
  type EdgeData,
  type Segment,
  type ThumbId,
} from './geometry'
import {
  SLIDER_FOCUS_RING_SIZE,
  SLIDER_STATE_LAYER_SIZE,
  SLIDER_STOP_INDICATOR,
  SLIDER_THUMB_GAP,
  SLIDER_THUMB_WIDTH,
  SLIDER_THUMB_WIDTH_PRESSED,
  SLIDER_TICK_SIZE,
} from './styles'

// How far the value label pops up while it fades in (in dp).
const LABEL_POP = 8

function evalEdge(
  edge: EdgeData,
  lowPressed: SharedValue<number>,
  highPressed: SharedValue<number>,
): number {
  'worklet'
  const press =
    edge.thumbId === 'low'
      ? lowPressed.value
      : edge.thumbId === 'high'
        ? highPressed.value
        : 0
  let v = edge.rest + edge.shift * press
  if (edge.bound) {
    const bp =
      edge.bound.thumbId === 'low'
        ? lowPressed.value
        : edge.bound.thumbId === 'high'
          ? highPressed.value
          : 0
    const bv = edge.bound.rest + edge.bound.shift * bp
    v = edge.bound.kind === 'min' ? Math.min(v, bv) : Math.max(v, bv)
  }
  return v
}

interface SegmentSlotProps {
  segment: Segment
  lowPressed: SharedValue<number>
  highPressed: SharedValue<number>
  baseStyle: ViewStyle
  kindStyle: ViewStyle
  disabledStyle: ViewStyle | undefined
}

export function SegmentSlot({
  segment,
  lowPressed,
  highPressed,
  baseStyle,
  kindStyle,
  disabledStyle,
}: SegmentSlotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const start = evalEdge(segment.start, lowPressed, highPressed)
    const end = evalEdge(segment.end, lowPressed, highPressed)
    const w = Math.max(0, end - start)
    return {
      left: start,
      width: w,
      borderTopLeftRadius: segment.cornerLeft,
      borderBottomLeftRadius: segment.cornerLeft,
      borderTopRightRadius: segment.cornerRight,
      borderBottomRightRadius: segment.cornerRight,
    }
  }, [segment])

  return (
    <Animated.View
      pointerEvents="none"
      style={[baseStyle, kindStyle, disabledStyle, animatedStyle]}
    />
  )
}

interface StopIndicatorSlotProps {
  segment: Segment
  lowPressed: SharedValue<number>
  highPressed: SharedValue<number>
  baseStyle: ViewStyle
  kindStyle: ViewStyle
  disabledStyle: ViewStyle | undefined
}

export function StopIndicatorSlot({
  segment,
  lowPressed,
  highPressed,
  baseStyle,
  kindStyle,
  disabledStyle,
}: StopIndicatorSlotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const stop = segment.stopAt
    if (!stop) return { opacity: 0 }
    const center = stop.fromStart
      ? evalEdge(segment.start, lowPressed, highPressed) + stop.offset
      : evalEdge(segment.end, lowPressed, highPressed) - stop.offset
    return {
      left: center - SLIDER_STOP_INDICATOR / 2,
      opacity: 1,
    }
  }, [segment])

  return (
    <Animated.View
      pointerEvents="none"
      style={[baseStyle, kindStyle, disabledStyle, animatedStyle]}
    />
  )
}

interface ThumbSlotProps {
  thumbId: ThumbId
  centerX: number
  pressed: SharedValue<number>
  baseStyle: ViewStyle
  disabledStyle: ViewStyle | undefined
}

export function ThumbSlot({
  centerX,
  pressed,
  baseStyle,
  disabledStyle,
}: ThumbSlotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const w =
      SLIDER_THUMB_WIDTH +
      (SLIDER_THUMB_WIDTH_PRESSED - SLIDER_THUMB_WIDTH) * pressed.value
    return {
      left: centerX - w / 2,
      width: w,
      borderRadius: w / 2,
    }
  }, [centerX])

  return (
    <Animated.View
      pointerEvents="none"
      style={[baseStyle, disabledStyle, animatedStyle]}
    />
  )
}

interface ValueLabelSlotProps {
  centerX: number
  labelWidth: number
  opacity: SharedValue<number>
  onLayout: (e: LayoutChangeEvent) => void
  baseStyle: ViewStyle
  textStyle: TextStyle
  text: string
}

export function ValueLabelSlot({
  centerX,
  labelWidth,
  opacity,
  onLayout,
  baseStyle,
  textStyle,
  text,
}: ValueLabelSlotProps) {
  // Measurement pass needs opacity 0 (so the label can size itself before we
  // know how to center it). Once we have a non-zero width, follow the
  // animated opacity and pop the label up by LABEL_POP dp as it fades in,
  // per MD3's emphasized-decelerate enter motion.
  const animatedStyle = useAnimatedStyle(() => {
    const o = labelWidth > 0 ? opacity.value : 0
    return {
      opacity: o,
      transform: [{ translateY: (1 - o) * LABEL_POP }],
    }
  })

  const positionStyle = { left: centerX - labelWidth / 2 }

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={onLayout}
      style={[baseStyle, positionStyle, animatedStyle]}
    >
      <Text style={textStyle} numberOfLines={1}>
        {text}
      </Text>
    </Animated.View>
  )
}

interface StateLayerSlotProps {
  centerX: number
  hovered: SharedValue<number>
  focused: SharedValue<number>
  pressed: SharedValue<number>
  baseStyle: ViewStyle
}

// MD3 tonal halo around the thumb. Combines the theme's hover, focus, and
// press state-layer opacity tokens and stays centered on the thumb while the
// press-state 4 → 2 dp width change runs.
export function StateLayerSlot({
  centerX,
  hovered,
  focused,
  pressed,
  baseStyle,
}: StateLayerSlotProps) {
  const theme = useTheme()
  const {
    hoveredOpacity: HOVER_OPACITY,
    focusedOpacity: FOCUS_OPACITY,
    pressedOpacity: PRESS_OPACITY,
  } = theme.stateLayer

  const animatedStyle = useAnimatedStyle(
    () => ({
      left: centerX - SLIDER_STATE_LAYER_SIZE / 2,
      opacity: Math.max(
        Math.max(0, Math.min(1, hovered.value)) * HOVER_OPACITY,
        Math.max(0, Math.min(1, focused.value)) * FOCUS_OPACITY,
        Math.max(0, Math.min(1, pressed.value)) * PRESS_OPACITY,
      ),
    }),
    [centerX, HOVER_OPACITY, FOCUS_OPACITY, PRESS_OPACITY],
  )
  return (
    <Animated.View pointerEvents="none" style={[baseStyle, animatedStyle]} />
  )
}

interface FocusRingSlotProps {
  centerX: number
  focused: SharedValue<number>
  baseStyle: ViewStyle
}

// MD3 keyboard-focus ring around the focused thumb. Only shows when focus is
// keyboard-induced (the parent Pressable gates `focused` via isFocusVisible()).
export function FocusRingSlot({
  centerX,
  focused,
  baseStyle,
}: FocusRingSlotProps) {
  const animatedStyle = useAnimatedStyle(
    () => ({
      left: centerX - SLIDER_FOCUS_RING_SIZE / 2,
      opacity: focused.value,
    }),
    [centerX],
  )
  return (
    <Animated.View pointerEvents="none" style={[baseStyle, animatedStyle]} />
  )
}

interface TickSlotProps {
  cx: number
  lowPos: number
  highPos: number
  hasHigh: boolean
  lowPressed: SharedValue<number>
  highPressed: SharedValue<number>
  baseStyle: ViewStyle
  disabledStyle: ViewStyle | undefined
}

// Ticks fade out as the (animated) thumb gap zone passes over them, instead of
// snap-hiding. The 2 dp soft-edge band keeps the transition smooth without
// drawing attention to itself.
export function TickSlot({
  cx,
  lowPos,
  highPos,
  hasHigh,
  lowPressed,
  highPressed,
  baseStyle,
  disabledStyle,
}: TickSlotProps) {
  const lowDist = Math.abs(cx - lowPos)
  const highDist = Math.abs(cx - highPos)
  const animatedStyle = useAnimatedStyle(() => {
    const lowGap =
      REST_HALF +
      SLIDER_THUMB_GAP +
      (PRESSED_HALF - REST_HALF) * lowPressed.value
    const highGap =
      REST_HALF +
      SLIDER_THUMB_GAP +
      (PRESSED_HALF - REST_HALF) * highPressed.value
    const lowFade = Math.min(1, Math.max(0, (lowDist - lowGap) / 2))
    const highFade = hasHigh
      ? Math.min(1, Math.max(0, (highDist - highGap) / 2))
      : 1
    return { opacity: Math.min(lowFade, highFade) }
  }, [cx, lowPos, highPos, hasHigh])

  const positionStyle = { left: cx - SLIDER_TICK_SIZE / 2 }

  return (
    <Animated.View
      pointerEvents="none"
      style={[baseStyle, disabledStyle, positionStyle, animatedStyle]}
    />
  )
}
