import {
  cubicBezier,
  type NamedTransitions,
  type TransitionConfig,
} from '@rootnative/inertia'
import type { Motion } from './types'

// Registered so the names autocomplete (and typos are compile errors)
// anywhere inertia accepts a `TransitionName` — the `transition` prop,
// `useBooleanSpring`, `useGestureLayer`, etc.
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

/**
 * Map a theme's motion tokens into inertia's named-transition registry.
 * `ThemeProvider` feeds the result to `<MotionConfig transitions>`, making
 * `theme.motion.*` the single source of truth components (and consumers)
 * reference by name instead of hand-rolling `withTiming`/`withSpring`
 * configs.
 *
 * The state-layer names encode the library's interaction timing policy —
 * hover `durationShort3` (150ms), press `durationShort2` (100ms), focus
 * `durationShort4` (200ms), all on the standard easing curve. The spring
 * names expose the theme's `MotionSpring` tokens verbatim.
 */
export function motionTransitions(motion: Motion): NamedTransitions {
  const standard = cubicBezier(motion.easingStandard)
  return {
    'state-hover': {
      type: 'timing',
      duration: motion.durationShort3,
      easing: standard,
    },
    'state-press': {
      type: 'timing',
      duration: motion.durationShort2,
      easing: standard,
    },
    'state-focus': {
      type: 'timing',
      duration: motion.durationShort4,
      easing: standard,
    },
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
