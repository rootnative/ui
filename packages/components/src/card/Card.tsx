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

  const timings = useMemo(
    () => ({
      hover: { duration: theme.motion.durationShort3 },
      press: { duration: theme.motion.durationShort2 },
      focus: { duration: theme.motion.durationShort4 },
    }),
    [theme.motion],
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

  const isElevated = variant === 'elevated'
  const showElevationLayers = isInteractive && isElevated && !isDisabled

  // Cross-fade level 1 (rest) and level 2 (hover) shadow layers per MD3.
  const animatedElevationLevel1Style = useAnimatedStyle(() => ({
    opacity: 1 - hovered.value,
  }))

  const animatedElevationLevel2Style = useAnimatedStyle(() => ({
    opacity: hovered.value,
  }))

  const handleHoverIn = useCallback(() => {
    if (!isDisabled) hovered.value = withTiming(1, timings.hover)
  }, [isDisabled, hovered, timings])

  const handleHoverOut = useCallback(() => {
    hovered.value = withTiming(0, timings.hover)
  }, [hovered, timings])

  const handlePressIn = useCallback(() => {
    if (!isDisabled) pressed.value = withTiming(1, timings.press)
  }, [isDisabled, pressed, timings])

  const handlePressOut = useCallback(() => {
    pressed.value = withTiming(0, timings.press)
  }, [pressed, timings])

  // Match :focus-visible — only show focus state from keyboard navigation.
  const handleFocus = useCallback(() => {
    if (!isDisabled && isFocusVisible()) {
      focused.value = withTiming(1, timings.focus)
    }
  }, [isDisabled, focused, timings])

  const handleBlur = useCallback(() => {
    focused.value = withTiming(0, timings.focus)
  }, [focused, timings])

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
      {showElevationLayers ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[styles.elevationLayerLevel1, animatedElevationLevel1Style]}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.elevationLayerLevel2, animatedElevationLevel2Style]}
          />
        </>
      ) : null}
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
          showElevationLayers ? styles.elevationDelegated : undefined,
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
