import type { NamedTransitions, TransitionConfig } from '@rootnative/inertia'
import type { Motion, MotionSpring } from './types'

// Registered so the names autocomplete (and typos are compile errors)
// anywhere inertia accepts a `TransitionName` — the `transition` prop,
// `useAnimation`, `useGestureLayer`, etc.
declare module '@rootnative/inertia' {
  interface RegisteredTransitions {
    'state-hover': TransitionConfig
    'state-press': TransitionConfig
    'state-focus': TransitionConfig
    'spring-fast-spatial': TransitionConfig
    'spring-default-spatial': TransitionConfig
    'spring-slow-spatial': TransitionConfig
    'spring-fast-effects': TransitionConfig
    'spring-default-effects': TransitionConfig
    'spring-slow-effects': TransitionConfig
  }
}

const SPRING_TOKENS = [
  'springFastSpatial',
  'springDefaultSpatial',
  'springSlowSpatial',
  'springFastEffects',
  'springDefaultEffects',
  'springSlowEffects',
] as const satisfies readonly (keyof Motion)[]

type MotionSprings = Pick<Motion, (typeof SPRING_TOKENS)[number]>

/**
 * True when `motion` carries the six MD3 spring tokens that
 * {@link motionTransitions} reads. A theme of another design system has no
 * `motion` group, or one of its own shape, and gets no MD3 transition names.
 */
export function hasMotionSprings(motion: unknown): motion is MotionSprings {
  if (typeof motion !== 'object' || motion === null) return false
  const tokens = motion as Record<string, MotionSpring | undefined>
  return SPRING_TOKENS.every((name) => typeof tokens[name] === 'object')
}

/**
 * Map a theme's motion tokens into inertia's named-transition registry.
 * `ThemeProvider` feeds the result to `<MotionConfig transitions>`, making
 * `theme.motion.*` the single source of truth components (and consumers)
 * reference by name instead of hand-rolling `withTiming`/`withSpring`
 * configs.
 *
 * The state-layer names encode the library's interaction motion policy —
 * per MD3 Expressive, state-layer color/opacity feedback rides the
 * fast-effects spring (small-element effects, critically damped). The
 * spring names expose the theme's `MotionSpring` tokens verbatim.
 */
export function motionTransitions(motion: MotionSprings): NamedTransitions {
  return {
    'state-hover': { type: 'spring', ...motion.springFastEffects },
    'state-press': { type: 'spring', ...motion.springFastEffects },
    'state-focus': { type: 'spring', ...motion.springFastEffects },
    'spring-fast-spatial': { type: 'spring', ...motion.springFastSpatial },
    'spring-default-spatial': {
      type: 'spring',
      ...motion.springDefaultSpatial,
    },
    'spring-slow-spatial': { type: 'spring', ...motion.springSlowSpatial },
    'spring-fast-effects': { type: 'spring', ...motion.springFastEffects },
    'spring-default-effects': {
      type: 'spring',
      ...motion.springDefaultEffects,
    },
    'spring-slow-effects': { type: 'spring', ...motion.springSlowEffects },
  }
}
