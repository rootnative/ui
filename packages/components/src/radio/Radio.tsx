import { useTheme } from '@rootnative/core'
import { useBooleanSpring, useColorTransition } from '@rootnative/inertia'
import {
  useGestureLayer,
  type GestureLayerStates,
} from '@rootnative/inertia/gesture-layer'
import { Animated, useAnimatedStyle } from '@rootnative/inertia/reanimated'
import { useCallback, useMemo } from 'react'
import { Platform, Pressable } from 'react-native'
import { createStyles, getResolvedRadioColors } from './styles'
import type { RadioProps } from './types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function Radio({
  style,
  value = false,
  onValueChange,
  containerColor,
  contentColor,
  disabled = false,
  ...props
}: RadioProps) {
  const isDisabled = Boolean(disabled)
  const isSelected = Boolean(value)

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
  const progress = useBooleanSpring(isSelected, 'spring-default-effects')
  const dotProgress = useBooleanSpring(isSelected, 'spring-fast-spatial')

  // State-layer halo opacity: solid base color, view opacity carries the
  // alpha — produces exactly the MD3 token values without any compounding.
  // The gesture layer composes the strongest active interaction via
  // clamped-max; the `disabled` layer pins the halo off while disabled.
  // Focus feedback rides `focusVisible` (keyboard focus only).
  const haloLayers = useMemo<GestureLayerStates>(
    () => ({
      rest: { opacity: 0 },
      hovered: { opacity: theme.stateLayer.hoveredOpacity },
      focusVisible: { opacity: theme.stateLayer.focusedOpacity },
      pressed: { opacity: theme.stateLayer.pressedOpacity },
      disabled: { opacity: 0 },
    }),
    [theme.stateLayer],
  )
  const gestureOptions = useMemo(
    () => ({
      disabled: isDisabled,
      transition: {
        hovered: 'state-hover',
        pressed: 'state-press',
        focused: 'state-focus',
        focusVisible: 'state-focus',
      } as const,
    }),
    [isDisabled],
  )
  const {
    style: haloOpacityStyle,
    handlers,
    states,
  } = useGestureLayer(haloLayers, gestureOptions)

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
  // (colors stay on the effects spring above). The underdamped spring
  // undershoots below 0 on deselect — clamp so scale never goes negative
  // (a negative scale renders a mirrored dot flash).
  const animatedInnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.max(0, dotProgress.value) }],
  }))

  // Interop escape hatch: the focus ring derives its opacity from the same
  // keyboard-focus progress the state layer runs on.
  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: states.focusVisible.value,
  }))

  // Radios are select-only: pressing an already-selected radio is a no-op —
  // deselection only happens by selecting another radio in the group.
  const handlePress = useCallback(() => {
    if (!isDisabled && !isSelected) onValueChange?.(true)
  }, [isDisabled, isSelected, onValueChange])

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
      accessibilityState={{
        disabled: isDisabled,
        checked: isSelected,
      }}
      hitSlop={Platform.OS === 'web' ? undefined : 4}
      disabled={isDisabled}
      onPress={handlePress}
      {...handlers}
      style={[
        styles.container,
        isDisabled ? styles.disabledContainer : undefined,
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.focusRing, animatedFocusRingStyle]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.stateLayer, haloOpacityStyle, haloColorStyle]}
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
