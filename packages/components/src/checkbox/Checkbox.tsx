import { useIconResolver, useTheme } from '@rootnative/core'
import { isFocusVisible, renderIcon } from '@rootnative/utils'
import { useCallback, useEffect, useMemo } from 'react'
import { Platform, Pressable, View } from 'react-native'
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

const TOGGLE_SPRING = {
  damping: 26,
  stiffness: 380,
  mass: 1,
}

export function Checkbox({
  style,
  value = false,
  onValueChange,
  indeterminate = false,
  error = false,
  checkIcon = 'check',
  containerColor,
  contentColor,
  disabled = false,
  ...props
}: CheckboxProps) {
  const isDisabled = Boolean(disabled)
  const isChecked = Boolean(value)
  const isIndeterminate = Boolean(indeterminate)
  const hasError = Boolean(error)
  // Indeterminate wins over checked visually — both fill the box.
  const isActive = isIndeterminate || isChecked

  const theme = useTheme()
  const iconResolver = useIconResolver()
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
    () =>
      getResolvedCheckboxColors(
        theme,
        false,
        containerColor,
        contentColor,
        hasError,
      ),
    [theme, containerColor, contentColor, hasError],
  )
  const onColors = useMemo(
    () =>
      getResolvedCheckboxColors(
        theme,
        true,
        containerColor,
        contentColor,
        hasError,
      ),
    [theme, containerColor, contentColor, hasError],
  )

  const progress = useSharedValue(isActive ? 1 : 0)
  const hovered = useSharedValue(0)
  const focused = useSharedValue(0)
  const pressed = useSharedValue(0)

  useEffect(() => {
    progress.value = withSpring(isActive ? 1 : 0, TOGGLE_SPRING)
  }, [isActive, progress])

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
    // active interaction's intensity keeps the token values intact.
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

  // Only show focus state when reached via keyboard (Tab/arrows). Mouse clicks
  // technically focus the element on web but shouldn't trigger the visual
  // focus indicator — mirrors CSS `:focus-visible` semantics.
  const handleFocus = useCallback(() => {
    if (!isDisabled && isFocusVisible()) {
      focused.value = withTiming(1, focusTiming)
    }
  }, [isDisabled, focused, focusTiming])
  const handleBlur = useCallback(() => {
    focused.value = withTiming(0, focusTiming)
  }, [focused, focusTiming])

  const markColor = isDisabled
    ? isActive
      ? onColors.disabledIconColor
      : offColors.disabledIconColor
    : isActive
      ? onColors.iconColor
      : offColors.iconColor

  const boxOverride = isDisabled
    ? {
        backgroundColor: isActive
          ? onColors.disabledBackgroundColor
          : offColors.disabledBackgroundColor,
        borderColor: isActive
          ? onColors.disabledBorderColor
          : offColors.disabledBorderColor,
      }
    : undefined

  const indeterminateMarkStyle = useMemo(
    () => [styles.indeterminateMark, { backgroundColor: markColor }],
    [styles, markColor],
  )

  return (
    <AnimatedPressable
      {...props}
      accessibilityRole="checkbox"
      accessibilityState={{
        disabled: isDisabled,
        checked: isIndeterminate ? 'mixed' : isChecked,
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
        {isIndeterminate ? (
          <Animated.View pointerEvents="none" style={animatedIconStyle}>
            <View
              testID="checkbox-indeterminate-mark"
              style={indeterminateMarkStyle}
            />
          </Animated.View>
        ) : isChecked ? (
          <Animated.View pointerEvents="none" style={animatedIconStyle}>
            {renderIcon(
              checkIcon,
              { size: CHECKBOX_ICON_SIZE, color: markColor },
              iconResolver,
            )}
          </Animated.View>
        ) : null}
      </Animated.View>
    </AnimatedPressable>
  )
}
