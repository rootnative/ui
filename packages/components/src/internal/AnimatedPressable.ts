import { Animated, type AnimatedProps } from '@rootnative/inertia/reanimated'
import type { ComponentType } from 'react'
import { Pressable, type PressableProps } from 'react-native'

/**
 * The animated `Pressable` every interactive component renders.
 *
 * `createAnimatedComponent` builds a new wrapper class per call, so a
 * per-file `const AnimatedPressable = ...` gave the library 13 distinct
 * classes for one base component. One shared instance keeps the wrapper cost
 * at one class and gives every component the same element type.
 *
 * The annotation is required, not decorative: exporting the inferred type
 * fails with TS2742 because Reanimated's `AnimatedComponentType` names
 * `react-native`'s nested `@types/react` copy, which no consumer can reach.
 * `ComponentType` drops the ref parameter — nothing in this library passes a
 * ref to this component. Widen the type here if that changes.
 *
 * Internal — not exported from the package.
 */
export const AnimatedPressable: ComponentType<AnimatedProps<PressableProps>> =
  Animated.createAnimatedComponent(Pressable)
