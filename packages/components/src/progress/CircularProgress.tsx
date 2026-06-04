import { useTheme } from '@rootnative/core'
import { useEffect, useMemo } from 'react'
import { View } from 'react-native'
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import {
  PROGRESS_CIRCULAR_SIZE,
  PROGRESS_CIRCULAR_STROKE,
  PROGRESS_TRACK_GAP,
  createCircularStyles,
  getProgressColors,
} from './styles'
import type { CircularProgressProps } from './types'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const INDETERMINATE_DURATION_MS = 1400
// Indeterminate arc occupies ~25% of the circumference — matches the MD3
// classic spinner cadence.
const INDETERMINATE_ARC_RATIO = 0.25

// MD3 emphasized cubic-bezier easing for value transitions; duration comes
// from `theme.motion.durationMedium1` (250 ms).
const MOTION_EASING = Easing.bezier(0.2, 0, 0, 1)
// Linear-equivalent bezier for the constant-speed indeterminate rotation.
const ROTATION_TIMING = {
  duration: INDETERMINATE_DURATION_MS,
  easing: Easing.bezier(0, 0, 1, 1),
}

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

  const motionTiming = useMemo(
    () => ({
      duration: theme.motion.durationMedium1,
      easing: MOTION_EASING,
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

  // Indeterminate rotation (0 → 1 mapped to 0 → 360°, looped).
  const rotation = useSharedValue(0)
  useEffect(() => {
    if (!indeterminate) {
      cancelAnimation(rotation)
      return
    }
    rotation.value = 0
    rotation.value = withRepeat(withTiming(1, ROTATION_TIMING), -1, false)
    return () => cancelAnimation(rotation)
  }, [indeterminate, rotation])

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 360}deg` }],
  }))

  // Determinate progress, smoothly tweened to the latest prop.
  const progressShared = useSharedValue(value)
  useEffect(() => {
    if (indeterminate) return
    progressShared.value = withTiming(value, motionTiming)
  }, [value, indeterminate, progressShared, motionTiming])

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
        <Animated.View style={spinStyle}>{renderSvg()}</Animated.View>
      ) : (
        renderSvg()
      )}
    </View>
  )
}
