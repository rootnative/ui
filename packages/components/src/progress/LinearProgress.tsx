import { useTheme } from '@rootnative/core'
import { Motion, cubicBezier, useAnimation } from '@rootnative/inertia'
import { useMemo, useState } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import { View } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import {
  PROGRESS_STOP_INDICATOR,
  PROGRESS_TRACK_GAP,
  PROGRESS_TRACK_HEIGHT,
  createLinearStyles,
} from './styles'
import type { LinearProgressProps } from './types'

// Indeterminate segment is 40% of the track width and slides across once per
// loop iteration. Matches the visual cadence of the MD3 single-segment variant.
// Loop duration/easing are MD3 spec values for progress indicators, not theme
// tokens — they stay component constants.
const INDETERMINATE_SEGMENT_RATIO = 0.4
const INDETERMINATE_DURATION_MS = 1800
// Cubic in-out for the indeterminate slide (matches the prior
// Easing.inOut(Easing.cubic) curve from the RN-Animated implementation).
const INDETERMINATE_EASING = cubicBezier(0.42, 0, 0.58, 1)

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max)

export function LinearProgress({
  progress,
  containerColor,
  trackColor,
  stopIndicator = true,
  thickness = PROGRESS_TRACK_HEIGHT,
  style,
  accessibilityLabel,
  ...rest
}: LinearProgressProps) {
  const theme = useTheme()
  const indeterminate = progress === undefined
  const value = indeterminate ? 0 : clamp(progress as number, 0, 1)

  const styles = useMemo(
    () => createLinearStyles(theme, thickness, containerColor, trackColor),
    [theme, thickness, containerColor, trackColor],
  )

  // MD3 standard curve for value transitions; duration comes from
  // `theme.motion.durationMedium1` (250 ms).
  const motionTransition = useMemo(
    () => ({
      type: 'timing' as const,
      duration: theme.motion.durationMedium1,
      easing: cubicBezier(theme.motion.easingStandard),
    }),
    [theme.motion],
  )

  const [width, setWidth] = useState(0)
  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    setWidth((prev) => (prev === w ? prev : w))
  }

  // Determinate value, smoothly tweened to the latest prop.
  const progressShared = useAnimation(value, motionTransition)

  const segmentWidth = Math.max(width * INDETERMINATE_SEGMENT_RATIO, 0)

  // Indeterminate slide: snap the segment back off-track (0 ms step), tween
  // it across, repeat forever. Declared on a Motion primitive so the loop is
  // cancelled by unmount (mode switches swap the subtree below).
  const indeterminateSegmentStyle = useMemo(
    () => ({ left: 0, width: segmentWidth }),
    [segmentWidth],
  )
  const indeterminateAnimate = useMemo(
    () => ({
      translateX: [
        { to: -segmentWidth, type: 'timing' as const, duration: 0 },
        { to: width },
      ],
    }),
    [segmentWidth, width],
  )
  const indeterminateTransition = useMemo(
    () => ({
      type: 'timing' as const,
      duration: INDETERMINATE_DURATION_MS,
      easing: INDETERMINATE_EASING,
      repeat: { count: 'infinite' as const, alternate: false },
    }),
    [],
  )

  // Determinate layout. The bar is split into:
  //   [active] [gap] [inactive] [gap] [stop dot]
  // The trailing stop dot + its gap are reserved only when the dot is shown
  // (i.e. determinate mode, value < 1). The mid gap exists only when both the
  // active and inactive segments are visible (0 < value < 1).
  const showStop = !indeterminate && stopIndicator && value < 1
  const trailingReserved = showStop
    ? PROGRESS_STOP_INDICATOR + PROGRESS_TRACK_GAP
    : 0
  const progressArea = Math.max(0, width - trailingReserved)

  // Interop escape hatches: the segment widths derive from the same inertia
  // value tween, with per-frame branching (mid gap) no declarative prop can
  // express.
  const activeStyle = useAnimatedStyle(() => {
    const v = progressShared.value
    const midGap = v > 0 && v < 1 ? PROGRESS_TRACK_GAP : 0
    const w = Math.max(0, v * (progressArea - midGap))
    return { left: 0, width: w }
  }, [progressArea])

  const inactiveStyle = useAnimatedStyle(() => {
    const v = progressShared.value
    const midGap = v > 0 && v < 1 ? PROGRESS_TRACK_GAP : 0
    const aw = Math.max(0, v * (progressArea - midGap))
    const left = aw + midGap
    const w = Math.max(0, progressArea - aw - midGap)
    return { left, width: w }
  }, [progressArea])

  const stopStyle = useMemo(
    () => [
      styles.stopDot,
      { right: 0, top: thickness / 2 - PROGRESS_STOP_INDICATOR / 2 },
    ],
    [styles.stopDot, thickness],
  )

  return (
    <View
      {...rest}
      onLayout={onLayout}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={
        indeterminate
          ? undefined
          : { min: 0, max: 100, now: Math.round(value * 100) }
      }
      style={[styles.root, style]}
    >
      {indeterminate ? (
        <>
          <View style={styles.inactiveTrackFull} />
          <Motion.View
            style={[styles.activeIndicator, indeterminateSegmentStyle]}
            animate={indeterminateAnimate}
            transition={indeterminateTransition}
          />
        </>
      ) : (
        <>
          <Animated.View style={[styles.activeIndicator, activeStyle]} />
          <Animated.View style={[styles.inactiveTrack, inactiveStyle]} />
          {showStop ? <View style={stopStyle} /> : null}
        </>
      )}
    </View>
  )
}
