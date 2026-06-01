import { useTheme } from '@rootnative/core'
import { isFocusVisible } from '@rootnative/utils'
import { useCallback, useEffect, useMemo } from 'react'
import { Platform, Pressable } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { createStyles, getResolvedRadioColors } from './styles'
import type { RadioProps } from './types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const TOGGLE_SPRING = {
  damping: 26,
  stiffness: 380,
  mass: 1,
}

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

  // MD3 state-layer opacity tokens.
  const {
    hoveredOpacity: HOVER_OPACITY,
    focusedOpacity: FOCUS_OPACITY,
    pressedOpacity: PRESS_OPACITY,
  } = theme.stateLayer

  const hoverTiming = useMemo(
    () => ({ duration: theme.motion.durationShort3 }),
    [theme],
  )
  const pressTiming = useMemo(
    () => ({ duration: theme.motion.durationShort2 }),
    [theme],
  )
  const focusTiming = useMemo(
    () => ({ duration: theme.motion.durationShort4 }),
    [theme],
  )

  const offColors = useMemo(
    () => getResolvedRadioColors(theme, false, containerColor, contentColor),
    [theme, containerColor, contentColor],
  )
  const onColors = useMemo(
    () => getResolvedRadioColors(theme, true, containerColor, contentColor),
    [theme, containerColor, contentColor],
  )

  const progress = useSharedValue(isSelected ? 1 : 0)
  const hovered = useSharedValue(0)
  const focused = useSharedValue(0)
  const pressed = useSharedValue(0)

  useEffect(() => {
    progress.value = withSpring(isSelected ? 1 : 0, TOGGLE_SPRING)
  }, [isSelected, progress])

  const animatedOuterStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [offColors.borderColor, onColors.borderColor],
    ),
  }))

  const animatedInnerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value }],
    backgroundColor: onColors.dotColor,
  }))

  const animatedStateLayerStyle = useAnimatedStyle(() => {
    // Solid base color, view opacity carries the alpha — produces exactly the
    // MD3 token values without any compounding.
    const layerColor = interpolateColor(
      progress.value,
      [0, 1],
      [offColors.stateLayerColor, onColors.stateLayerColor],
    )
    return {
      opacity: Math.max(
        hovered.value * HOVER_OPACITY,
        focused.value * FOCUS_OPACITY,
        pressed.value * PRESS_OPACITY,
      ),
      backgroundColor: layerColor,
    }
  })

  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: focused.value,
  }))

  // Radios are select-only: pressing an already-selected radio is a no-op —
  // deselection only happens by selecting another radio in the group.
  const handlePress = useCallback(() => {
    if (!isDisabled && !isSelected) onValueChange?.(true)
  }, [isDisabled, isSelected, onValueChange])

  const handleHoverIn = useCallback(() => {
    if (!isDisabled) hovered.value = withTiming(1, hoverTiming)
  }, [isDisabled, hovered, hoverTiming])
  const handleHoverOut = useCallback(() => {
    hovered.value = withTiming(0, hoverTiming)
  }, [hovered, hoverTiming])

  const handlePressIn = useCallback(() => {
    if (!isDisabled) pressed.value = withTiming(1, pressTiming)
  }, [isDisabled, pressed, pressTiming])
  const handlePressOut = useCallback(() => {
    pressed.value = withTiming(0, pressTiming)
  }, [pressed, pressTiming])

  // Match :focus-visible — only show focus state from keyboard navigation.
  const handleFocus = useCallback(() => {
    if (!isDisabled && isFocusVisible()) {
      focused.value = withTiming(1, focusTiming)
    }
  }, [isDisabled, focused, focusTiming])
  const handleBlur = useCallback(() => {
    focused.value = withTiming(0, focusTiming)
  }, [focused, focusTiming])

  // Disabled snaps to disabled colors (no animation when disabled).
  const outerOverride = isDisabled
    ? { borderColor: offColors.disabledBorderColor }
    : undefined
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
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onFocus={handleFocus}
      onBlur={handleBlur}
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
        style={[styles.stateLayer, animatedStateLayerStyle]}
      />
      <Animated.View style={[styles.outer, animatedOuterStyle, outerOverride]}>
        <Animated.View
          style={[
            styles.inner,
            animatedInnerStyle,
            isDisabled ? innerOverride : undefined,
          ]}
        />
      </Animated.View>
    </AnimatedPressable>
  )
}
