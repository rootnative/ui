import { useTheme } from '@rootnative/core'
import { useColorTransition } from '@rootnative/inertia'
import {} from '@rootnative/inertia/gesture-layer'
import { Animated, useAnimatedStyle } from '@rootnative/inertia/reanimated'
import { useCallback, useMemo, useState } from 'react'
import { AnimatedPressable } from '../internal/AnimatedPressable'
import { composeHandlers } from '../internal/composeHandlers'
import { pointerEvents } from '../internal/pointerEvents'
import { useBooleanProgress } from '../internal/useBooleanProgress'
import { useHaloLayer } from '../internal/useHaloLayer'
import { createStyles, getResolvedRadioColors } from './styles'
import type { RadioProps } from './types'

export function Radio({
  style,
  value,
  defaultValue = false,
  onValueChange,
  containerColor,
  contentColor,
  disabled = false,
  hitSlop,
  ...props
}: RadioProps) {
  const isDisabled = Boolean(disabled)
  // Controlled when `value` is passed, self-managing otherwise. A radio is
  // select-only, so an uncontrolled one latches: it turns itself on and only a
  // controlling parent can turn it back off. That is what an uncontrolled
  // radio in a group does — deselection is the group's job, and there is no
  // RadioGroup component by design.
  const isControlled = value !== undefined
  const [selfValue, setSelfValue] = useState(() => Boolean(defaultValue))
  const isSelected = isControlled ? Boolean(value) : selfValue

  const theme = useTheme()
  const styles = useMemo(() => createStyles(theme), [theme])

  const offColors = useMemo(
    () => getResolvedRadioColors(theme, false, containerColor, contentColor),
    [theme, containerColor, contentColor],
  )
  const onColors = useMemo(
    () => getResolvedRadioColors(theme, true, containerColor, contentColor),
    [theme, containerColor, contentColor],
  )

  // Two selection progresses per Expressive: color transitions ride the
  // critically damped default-effects spring (no overshoot on colors), the
  // dot pop rides fast-spatial (bouncy — the dot overshoots and settles),
  // mirroring Compose's RadioButton DefaultEffects/FastSpatial split.
  const progress = useBooleanProgress(isSelected, 'spring-default-effects')
  const dotProgress = useBooleanProgress(isSelected, 'spring-fast-spatial')

  const {
    style: haloOpacityStyle,
    handlers,
    focusRingStyle: animatedFocusRingStyle,
  } = useHaloLayer(isDisabled)

  // The halo color crossfades with the selection progress.
  const haloColorStyle = useColorTransition(progress, [
    offColors.stateLayerColor,
    onColors.stateLayerColor,
  ])

  const outerBorderStyle = useColorTransition(
    progress,
    [offColors.borderColor, onColors.borderColor],
    { key: 'borderColor' },
  )

  // Interop escape hatch: the dot pop rides its own fast-spatial spring
  // (colors stay on the effects spring above). The clamp is deliberately
  // one-sided — `Math.max`, not an interpolation:
  //
  // - Below 0 the spring must be clamped. It undershoots on deselect, and a
  //   negative scale renders a mirrored dot flash.
  // - Above 1 it must NOT be. `spring-fast-spatial` is underdamped by design
  //   (ζ ≈ 0.60) and overshoots to ~1.09; that overshoot *is* the pop this
  //   spring was chosen for. Clamping it flattens the selection into a plain
  //   ease and loses the MD3 Expressive character.
  //
  // `useInterpolatedStyle` cannot express this: its `extrapolate` option
  // applies one mode to both ends, so `scale: [0, 1]` clamps the overshoot
  // away too. Hence the hand-rolled worklet, per the CLAUDE.md rule that keeps
  // one when `useInterpolatedStyle` has no way to say it.
  const animatedInnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.max(0, dotProgress.value) }],
  }))

  // Radios are select-only: pressing an already-selected radio is a no-op —
  // deselection only happens by selecting another radio in the group.
  const handlePress = useCallback(() => {
    if (isDisabled || isSelected) return
    if (!isControlled) setSelfValue(true)
    onValueChange?.(true)
  }, [isDisabled, isSelected, isControlled, onValueChange])

  // Disabled snaps to disabled colors (no animation when disabled).
  const outerOverride = isDisabled
    ? { borderColor: offColors.disabledBorderColor }
    : undefined
  const innerColor = useMemo(
    () => ({ backgroundColor: onColors.dotColor }),
    [onColors],
  )
  const innerOverride = useMemo(
    () => ({ backgroundColor: onColors.disabledDotColor }),
    [onColors],
  )

  return (
    <AnimatedPressable
      {...props}
      accessibilityRole="radio"
      aria-disabled={isDisabled}
      aria-checked={isSelected}
      // The container is already 48dp, so there is no default slop: extra
      // slop on a control that clears the floor only overlaps its neighbours.
      hitSlop={hitSlop}
      disabled={isDisabled}
      onPress={handlePress}
      {...composeHandlers(handlers, props)}
      style={[
        styles.container,
        isDisabled ? styles.disabledContainer : undefined,
        style,
      ]}
    >
      <Animated.View
        style={[styles.focusRing, animatedFocusRingStyle, pointerEvents.none]}
      />
      <Animated.View
        style={[
          styles.stateLayer,
          haloOpacityStyle,
          haloColorStyle,
          pointerEvents.none,
        ]}
      />
      <Animated.View style={[styles.outer, outerBorderStyle, outerOverride]}>
        <Animated.View
          style={[
            styles.inner,
            isDisabled ? innerOverride : innerColor,
            animatedInnerStyle,
          ]}
        />
      </Animated.View>
    </AnimatedPressable>
  )
}
