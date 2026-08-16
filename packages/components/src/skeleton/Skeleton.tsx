import { useTheme } from '@rootnative/core'
import { Motion, cubicBezier } from '@rootnative/inertia'
import { useMemo } from 'react'
import { View } from 'react-native'
import {
  SKELETON_DEFAULT_HEIGHT,
  SKELETON_PULSE_MIN_OPACITY,
  createSkeletonStyles,
} from './styles'
import type { SkeletonProps } from './types'

export function Skeleton({
  width = '100%',
  height = SKELETON_DEFAULT_HEIGHT,
  shape = 'rounded',
  containerColor,
  animated = true,
  style,
  ...rest
}: SkeletonProps) {
  const theme = useTheme()

  const styles = useMemo(
    () => createSkeletonStyles(theme, shape, containerColor),
    [theme, shape, containerColor],
  )
  const sizeStyle = useMemo(() => ({ width, height }), [width, height])

  // Pulse: dim to the low keyframe, return to full, repeat forever. Each
  // keyframe runs for `durationExtraLong4` (1000 ms), so one full pulse is
  // 2 s. The sequence ends at opacity 1 on purpose: a reduced-motion-gated
  // sequence snaps to its last keyframe, so the gate alone yields the right
  // static block — no `useShouldReduceMotion` branch needed.
  const pulseAnimate = useMemo(
    () => ({
      opacity: [{ to: SKELETON_PULSE_MIN_OPACITY }, { to: 1 }],
    }),
    [],
  )
  const pulseTransition = useMemo(
    () => ({
      type: 'timing' as const,
      duration: theme.motion.durationExtraLong4,
      easing: cubicBezier(theme.motion.easingStandard),
      repeat: { count: 'infinite' as const, alternate: false },
    }),
    [theme.motion],
  )

  const flatStyle = [styles.root, sizeStyle, style]

  // A skeleton stands in for content, it is not content — hide it from the
  // accessibility tree. `aria-hidden` maps to the native pair on RN and to
  // the DOM attribute on react-native-web.
  if (!animated) {
    return <View {...rest} aria-hidden style={flatStyle} />
  }

  return (
    <Motion.View
      {...rest}
      aria-hidden
      animate={pulseAnimate}
      transition={pulseTransition}
      style={flatStyle}
    />
  )
}
