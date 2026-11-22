import {
  useAnimation,
  type SharedValue,
  type TransitionName,
} from '@rootnative/inertia'

/**
 * Spring a 0↔1 progress value whenever `active` flips, honoring
 * `<MotionConfig reducedMotion>`.
 *
 * It calls `useAnimation`, not inertia's `useBooleanSpring`. Both honor reduced
 * motion, but `useBooleanSpring` takes spring names only. An app can map a
 * theme name (`'spring-fast-spatial'`, …) to a timing transition, and
 * `useAnimation` follows that type, where `useBooleanSpring` warns and falls
 * back to the default spring.
 *
 * Use this hook in every new component for a selection or press progress. The
 * state layers gate via `useStateLayer` → `useGestureLayer`, and press morphs
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
