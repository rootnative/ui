import { useTheme } from '@rootnative/core'
import { Motion, cubicBezier, useAnimation } from '@rootnative/inertia'
import { useMemo } from 'react'
import { View } from 'react-native'
import Animated, { useAnimatedProps } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import {
  PROGRESS_CIRCULAR_SIZE,
  PROGRESS_CIRCULAR_STROKE,
  PROGRESS_TRACK_GAP,
  createCircularStyles,
  getProgressColors,
} from './styles'
import type { CircularProgressProps } from './types'

// Interop escape hatch (sanctioned): the arc props are per-frame branching
// dasharray strings derived from the value tween — a shape `MotionCircle`'s
// declarative props can't express (dasharray is shape-locked at mount there).
// The `useAnimatedProps` worklets below consume inertia-driven values.
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

// Loop duration/arc ratio are MD3 spec values for progress indicators, not
// theme tokens — they stay component constants. The arc occupies ~25% of the
// circumference, matching the MD3 classic spinner cadence.
const INDETERMINATE_DURATION_MS = 1400
const INDETERMINATE_ARC_RATIO = 0.25

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max)

export function CircularProgress({
  progress,
  size = PROGRESS_CIRCULAR_SIZE,
  thickness = PROGRESS_CIRCULAR_STROKE,
  containerColor,
  trackColor,
  style,
  accessibilityLabel,
  ...rest
}: CircularProgressProps) {
  const theme = useTheme()
  const indeterminate = progress === undefined
  const value = indeterminate ? 0 : clamp(progress as number, 0, 1)

  const colors = useMemo(
    () => getProgressColors(theme, containerColor, trackColor),
    [theme, containerColor, trackColor],
  )
  const styles = useMemo(() => createCircularStyles(size), [size])

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

  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2
  // Convert a track gap measured in dp along the circumference into the
  // equivalent dasharray segment so the gap appears uniform regardless of
  // size / thickness.
  const gapLength = Math.min(PROGRESS_TRACK_GAP, circumference / 4)

  // Indeterminate rotation: snap to 0° (0 ms step), sweep to 360° at constant
  // speed, repeat forever. Declared on a Motion primitive so the loop is
  // cancelled by unmount (mode switches swap the subtree below).
  const spinAnimate = useMemo(
    () => ({
      rotate: [{ to: 0, type: 'timing' as const, duration: 0 }, { to: 360 }],
    }),
    [],
  )
  const spinTransition = useMemo(
    () => ({
      type: 'timing' as const,
      duration: INDETERMINATE_DURATION_MS,
      easing: cubicBezier('linear'),
      repeat: { count: 'infinite' as const, alternate: false },
    }),
    [],
  )

  // Determinate progress, smoothly tweened to the latest prop.
  const progressShared = useAnimation(value, motionTransition)

  // SVG circles are rotated -90° so that the 0° start position is at 12
  // o'clock instead of 3 o'clock (default SVG behavior).
  const startRotation = `rotate(-90 ${center} ${center})`

  const trackAnimatedProps = useAnimatedProps(() => {
    if (indeterminate) {
      return { strokeDasharray: `${circumference} 0`, strokeDashoffset: 0 }
    }
    const v = progressShared.value
    if (v <= 0) {
      return { strokeDasharray: `${circumference} 0`, strokeDashoffset: 0 }
    }
    if (v >= 1) {
      return { strokeDasharray: `0 ${circumference}`, strokeDashoffset: 0 }
    }
    const activeLength = Math.max(0, v * circumference - gapLength)
    const trackVisible = Math.max(
      0,
      circumference - activeLength - gapLength * 2,
    )
    return {
      strokeDasharray: `${trackVisible} ${circumference - trackVisible}`,
      // Offset so the gap sits between active.end and track.start (advancing
      // by activeLength + gapLength puts the start of the visible track
      // segment one gap past the end of the active arc).
      strokeDashoffset: -(activeLength + gapLength),
    }
  }, [indeterminate, circumference, gapLength])

  const indicatorAnimatedProps = useAnimatedProps(() => {
    if (indeterminate) {
      const len = circumference * INDETERMINATE_ARC_RATIO
      return {
        strokeDasharray: `${len} ${Math.max(0, circumference - len)}`,
        strokeDashoffset: 0,
      }
    }
    const v = progressShared.value
    const activeLength = Math.max(0, v * circumference - gapLength)
    return {
      strokeDasharray: `${activeLength} ${Math.max(0, circumference - activeLength)}`,
      strokeDashoffset: 0,
    }
  }, [indeterminate, circumference, gapLength])

  const accessibilityValue = indeterminate
    ? undefined
    : { min: 0, max: 100, now: Math.round(value * 100) }

  const renderSvg = () => (
    <Svg width={size} height={size}>
      <AnimatedCircle
        cx={center}
        cy={center}
        r={radius}
        stroke={colors.track}
        strokeWidth={thickness}
        fill="none"
        strokeLinecap="round"
        transform={startRotation}
        animatedProps={trackAnimatedProps}
      />
      <AnimatedCircle
        cx={center}
        cy={center}
        r={radius}
        stroke={colors.indicator}
        strokeWidth={thickness}
        fill="none"
        strokeLinecap="round"
        transform={startRotation}
        animatedProps={indicatorAnimatedProps}
      />
    </Svg>
  )

  return (
    <View
      {...rest}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={accessibilityValue}
      style={[styles.root, style]}
    >
      {indeterminate ? (
        <Motion.View animate={spinAnimate} transition={spinTransition}>
          {renderSvg()}
        </Motion.View>
      ) : (
        renderSvg()
      )}
    </View>
  )
}
