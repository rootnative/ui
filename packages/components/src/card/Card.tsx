import { useTheme } from '@rootnative/core'
import { isFocusVisible } from '@rootnative/utils'
import { useCallback, useMemo } from 'react'
import { Platform, Pressable, View } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { createStyles, getResolvedCardColors } from './styles'
import type { CardProps } from './types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const HOVER_TIMING = { duration: 150 }
const PRESS_TIMING = { duration: 100 }
const FOCUS_TIMING = { duration: 200 }

export function Card({
  children,
  style,
  variant = 'elevated',
  onPress,
  disabled = false,
  containerColor,
  ...props
}: CardProps) {
  const isDisabled = Boolean(disabled)
  const isInteractive = onPress !== undefined
  const theme = useTheme()
  const styles = useMemo(
    () => createStyles(theme, variant, containerColor),
    [theme, variant, containerColor],
  )

  const colors = useMemo(
    () => getResolvedCardColors(theme, variant, containerColor),
    [theme, variant, containerColor],
  )

  const hovered = useSharedValue(0)
  const focused = useSharedValue(0)
  const pressed = useSharedValue(0)

  // Layered crossfade: rest → focus → hover → press (priority: press > hover > focus > rest).
  const animatedContainerStyle = useAnimatedStyle(() => {
    const focusedBg = interpolateColor(
      focused.value,
      [0, 1],
      [colors.backgroundColor, colors.focusedBackgroundColor],
    )
    const hoveredBg = interpolateColor(
      hovered.value,
      [0, 1],
      [focusedBg, colors.hoveredBackgroundColor],
    )
    const pressedBg = interpolateColor(
      pressed.value,
      [0, 1],
      [hoveredBg, colors.pressedBackgroundColor],
    )
    return { backgroundColor: pressedBg }
  })

  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: focused.value,
  }))

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

  if (!isInteractive) {
    return (
      <View {...props} style={[styles.container, style]}>
        {children}
      </View>
    )
  }

  return (
    <View style={styles.wrapper}>
      <Animated.View
        pointerEvents="none"
        style={[styles.focusRing, animatedFocusRingStyle]}
      />
      <AnimatedPressable
        {...props}
        role="button"
        accessibilityState={{ disabled: isDisabled }}
        hitSlop={Platform.OS === 'web' ? undefined : 4}
        disabled={isDisabled}
        onPress={onPress}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.container,
          styles.interactiveContainer,
          animatedContainerStyle,
          isDisabled ? styles.disabledContainer : undefined,
          style,
        ]}
      >
        {isDisabled ? (
          <View style={styles.disabledContent}>{children}</View>
        ) : (
          children
        )}
      </AnimatedPressable>
    </View>
  )
}
