import {
  cubicBezier,
  useAnimation,
  useAnimator,
  useMotionValue,
  useShouldReduceMotion,
  type SharedValue,
} from '@rootnative/inertia'
import { cancelAnimation } from '@rootnative/inertia/reanimated'
import { useEffect, useMemo } from 'react'
import { PROGRESS_WAVE_PERIOD_MS } from './styles'

export interface WaveMotion {
  /** 0 (flat) to 1 (full wave), eased by a spring when the target changes. */
  amplitude: SharedValue<number>
  /** 0 to 1 per wavelength, looped at constant speed while `travel` is on. */
  phase: SharedValue<number>
}

/**
 * The two values a wavy indicator reads each frame. Both gate on reduced
 * motion: `useAnimation` cuts the amplitude spring, and `useAnimator` pins
 * the phase, so the wave stands still.
 */
export function useWaveMotion(
  amplitudeTarget: number,
  travel: boolean,
): WaveMotion {
  const amplitude = useAnimation(amplitudeTarget, 'spring-default-effects')
  const phase = useMotionValue(0)
  const animate = useAnimator()
  const shouldReduceMotion = useShouldReduceMotion()

  const loop = useMemo(
    () => ({
      type: 'timing' as const,
      duration: PROGRESS_WAVE_PERIOD_MS,
      easing: cubicBezier('linear'),
      repeat: { count: 'infinite' as const, alternate: false },
    }),
    [],
  )

  useEffect(() => {
    if (!travel) return
    // `withRepeat` runs each pass from the value the loop starts at, so the
    // loop must start at 0.
    phase.value = 0
    animate(phase, 1, loop)
    return () => cancelAnimation(phase)
  }, [travel, shouldReduceMotion, animate, phase, loop])

  return { amplitude, phase }
}
