import { useIconResolver, useTheme } from '@rootnative/core'
import { isFocusVisible, renderIcon } from '@rootnative/utils'
import { useCallback, useEffect, useMemo } from 'react'
import { Platform, Pressable } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import {
  CHECKBOX_ICON_SIZE,
  createStyles,
  getResolvedCheckboxColors,
} from './styles'
import type { CheckboxProps } from './types'

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

export function Checkbox({
  style,
  value = false,
  onValueChange,
  checkIcon = 'check',
  containerColor,
  contentColor,
  disabled = false,
  ...props
}: CheckboxProps) {
  const isDisabled = Boolean(disabled)
  const isChecked = Boolean(value)

  const theme = useTheme()
  const iconResolver = useIconResolver()
  const styles = useMemo(() => createStyles(theme), [theme])

  const offColors = useMemo(
    () => getResolvedCheckboxColors(theme, false, containerColor, contentColor),
    [theme, containerColor, contentColor],
  )
  const onColors = useMemo(
    () => getResolvedCheckboxColors(theme, true, containerColor, contentColor),
    [theme, containerColor, contentColor],
  )

  const progress = useSharedValue(isChecked ? 1 : 0)
  const hovered = useSharedValue(0)
  const focused = useSharedValue(0)
  const pressed = useSharedValue(0)

  useEffect(() => {
    progress.value = withSpring(isChecked ? 1 : 0, TOGGLE_SPRING)
  }, [isChecked, progress])

  const animatedBoxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [offColors.backgroundColor, onColors.backgroundColor],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [offColors.borderColor, onColors.borderColor],
    ),
  }))

  const animatedIconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }))

  const animatedStateLayerStyle = useAnimatedStyle(() => {
    // Solid base color, view opacity carries the alpha. Picking the strongest
    // active interaction's intensity keeps the spec values intact (8/10/10 %).
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
    if (!isDisabled) onValueChange?.(!isChecked)
  }, [isDisabled, isChecked, onValueChange])

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

  // Only show focus state when reached via keyboard (Tab/arrows). Mouse clicks
  // technically focus the element on web but shouldn't trigger the visual
  // focus indicator — mirrors CSS `:focus-visible` semantics.
  const handleFocus = useCallback(() => {
    if (!isDisabled && isFocusVisible()) {
      focused.value = withTiming(1, FOCUS_TIMING)
    }
  }, [isDisabled, focused])
  const handleBlur = useCallback(() => {
    focused.value = withTiming(0, FOCUS_TIMING)
  }, [focused])

  const iconColor = isDisabled
    ? isChecked
      ? onColors.disabledIconColor
      : offColors.disabledIconColor
    : isChecked
      ? onColors.iconColor
      : offColors.iconColor

  const boxOverride = isDisabled
    ? {
        backgroundColor: isChecked
          ? onColors.disabledBackgroundColor
          : offColors.disabledBackgroundColor,
        borderColor: isChecked
          ? onColors.disabledBorderColor
          : offColors.disabledBorderColor,
      }
    : undefined

  return (
    <AnimatedPressable
      {...props}
      accessibilityRole="checkbox"
      accessibilityState={{
        disabled: isDisabled,
        checked: isChecked,
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
      <Animated.View
        testID="checkbox-box"
        style={[styles.box, animatedBoxStyle, boxOverride]}
      >
        {isChecked ? (
          <Animated.View pointerEvents="none" style={animatedIconStyle}>
            {renderIcon(
              checkIcon,
              { size: CHECKBOX_ICON_SIZE, color: iconColor },
              iconResolver,
            )}
          </Animated.View>
        ) : null}
      </Animated.View>
    </AnimatedPressable>
  )
}
