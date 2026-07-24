import {
  useAnimation,
  type SharedValue,
  type TransitionName,
} from '@rootnative/inertia'

/**
 * Spring a 0↔1 progress value whenever `active` flips, honoring
 * `<MotionConfig reducedMotion>`.
 *
 * This is deliberately *not* inertia's `useBooleanSpring`. That hook is the raw
 * mechanism and documents itself as reduced-motion-unaware, because gating is
 * wrong at its gesture-smoothing call sites — collapsing the spring there would
 * strand a value mid-drag. Every selection/press transition in this library
 * does want the gate, so components route through `useAnimation`, which
 * resolves the same spring-typed theme token names (`'spring-fast-spatial'`,
 * …) and collapses to `no-animation` when the OS asks for reduced motion.
 *
 * Reach for this instead of `useBooleanSpring` in every new component: it's the
 * one place the gate lives, so it can't be forgotten per call site. The state
 * layers already gate via `useStateLayer` → `useGestureLayer`, and press morphs
 * via `usePressMorph` → `useGesture`.
 *
 * Internal — not exported from the package.
 */
export function useBooleanProgress(
  active: boolean,
  transition: TransitionName,
): SharedValue<number> {
  return useAnimation(active ? 1 : 0, transition)
}
