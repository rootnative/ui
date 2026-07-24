import {
  useGesture,
  type TransitionName,
  type UseGestureHandlers,
} from '@rootnative/inertia'
import {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from '@rootnative/inertia/reanimated'
import { useEffect, useMemo } from 'react'

export interface UsePressMorphOptions {
  /**
   * Effective corner radius at rest, in dp. For pill-shaped containers pass
   * half the container height — never the `cornerFull` sentinel (999), which
   * would park the whole animation in the clamped range where nothing moves
   * visually.
   */
  rest: number
  /** Corner radius while fully pressed (the squarer Expressive morph target). */
  pressed: number
  /**
   * Named transition the morph rides. Buttons and icon buttons use
   * `'spring-default-effects'` — Compose deliberately keeps their shape
   * morph bounce-free; selectable chips use `'spring-fast-spatial'`.
   */
  transition: TransitionName
  /** Suppresses the morph: no handlers, progress reset to rest. */
  disabled?: boolean
}

export interface UsePressMorphResult {
  /** Animated `borderRadius` style for the pressed shape morph. */
  style: ReturnType<typeof useAnimatedStyle>
  /**
   * Press handlers driving the morph. Attach alongside the state-layer
   * handlers via `composePressHandlers` — spreading both bags directly would
   * clobber one of them. `undefined` while disabled.
   */
  handlers: Pick<UseGestureHandlers, 'onPressIn' | 'onPressOut'> | undefined
  /**
   * 0↔1 pressed progress on the spatial spring — feed into extra
   * `useAnimatedStyle` blocks for sibling surfaces that must follow the
   * morph (focus ring, elevation layers).
   */
  progress: SharedValue<number>
}

/**
 * MD3 Expressive shape morph on press: corner radius morphs toward squarer
 * while pressed and springs back on release, riding the given named spring
 * (state-layer colors stay on their own `state-press` transition — hence a
 * second gesture progress rather than reusing `useStateLayer`'s pressed
 * value).
 *
 * Reduced motion collapses the spring to `no-animation` via `useGesture`, so
 * the radius snaps instead of animating.
 *
 * Internal — not exported from the package.
 */
export function usePressMorph(
  options: UsePressMorphOptions,
): UsePressMorphResult {
  const { rest, pressed, transition, disabled = false } = options
  const gesture = useGesture({ pressed: transition })
  const progress = gesture.pressed

  // A press has no matching release once the component disables mid-press
  // (handlers are detached and `Pressable` stops delivering events) — pin
  // the progress back to rest so re-enabling doesn't resume mid-morph.
  useEffect(() => {
    if (disabled) progress.value = 0
  }, [disabled, progress])

  const style = useAnimatedStyle(() => ({
    borderRadius: interpolate(progress.value, [0, 1], [rest, pressed]),
  }))

  const handlers = useMemo(
    () =>
      disabled
        ? undefined
        : {
            onPressIn: gesture.handlers.onPressIn,
            onPressOut: gesture.handlers.onPressOut,
          },
    [disabled, gesture.handlers],
  )

  return { style, handlers, progress }
}

/**
 * Merge the state-layer handler bag with the morph's press handlers so both
 * gestures observe the same `Pressable`. Later bags run after earlier ones;
 * keys only present in one bag pass through untouched.
 */
export function composePressHandlers(
  base: UseGestureHandlers,
  extra: Pick<UseGestureHandlers, 'onPressIn' | 'onPressOut'> | undefined,
): UseGestureHandlers {
  if (!extra) return base
  return {
    ...base,
    onPressIn: () => {
      base.onPressIn()
      extra.onPressIn()
    },
    onPressOut: () => {
      base.onPressOut()
      extra.onPressOut()
    },
  }
}
