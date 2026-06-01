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

const HOVER_OPACITY = 0.08
const FOCUS_OPACITY = 0.1
const PRESS_OPACITY = 0.1

const TOGGLE_SPRING = {
  damping: 26,
  stiffness: 380,
  mass: 1,
}

const HOVER_TIMING = { duration: 150 }
const PRESS_TIMING = { duration: 100 }
const FOCUS_TIMING = { duration: 200 }

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
    // MD3 token values (8/10/10 %) without any compounding.
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

  const handlePress = useCallback(() => {
    if (!isDisabled) onValueChange?.(!isSelected)
  }, [isDisabled, isSelected, onValueChange])

  const handleHoverIn = useCallback(() => {
    if (!isDisabled) hovered.value = withTiming(1, HOVER_TIMING)
  }, [isDisabled, hovered])
  const handleHoverOut = useCallback(() => {
    hovered.value = withTiming(0, HOVER_TIMING)
  }, [hovered])

  const handlePressIn = useCallback(() => {
    if (!isDisabled) pressed.value = withTiming(1, PRESS_TIMING)
  }, [isDisabled, pressed])
  const handlePressOut = useCallback(() => {
    pressed.value = withTiming(0, PRESS_TIMING)
  }, [pressed])

  // Match :focus-visible — only show focus state from keyboard navigation.
  const handleFocus = useCallback(() => {
    if (!isDisabled && isFocusVisible()) {
      focused.value = withTiming(1, FOCUS_TIMING)
    }
  }, [isDisabled, focused])
  const handleBlur = useCallback(() => {
    focused.value = withTiming(0, FOCUS_TIMING)
  }, [focused])

  // Disabled snaps to disabled colors (no animation when disabled).
  const outerOverride = isDisabled
    ? { borderColor: offColors.disabledBorderColor }
    : undefined

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
            isDisabled
              ? { backgroundColor: onColors.disabledDotColor }
              : undefined,
          ]}
        />
      </Animated.View>
    </AnimatedPressable>
  )
}
