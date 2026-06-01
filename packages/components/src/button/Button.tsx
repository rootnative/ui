import { useIconResolver, useTheme } from '@rootnative/core'
import {
  isFocusVisible,
  renderIcon,
  resolveColorFromStyle,
} from '@rootnative/utils'
import { useCallback, useMemo } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { createStyles, getResolvedButtonColors } from './styles'
import type { ButtonProps } from './types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function Button({
  children,
  style,
  variant = 'filled',
  leadingIcon,
  trailingIcon,
  iconSize = 18,
  containerColor,
  contentColor,
  labelStyle: labelStyleOverride,
  disabled = false,
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled)
  const hasLeading = Boolean(leadingIcon)
  const hasTrailing = Boolean(trailingIcon)
  const theme = useTheme()
  const iconResolver = useIconResolver()

  const hoverTiming = useMemo(
    () => ({ duration: theme.motion.durationShort3 }),
    [theme.motion.durationShort3],
  )
  const pressTiming = useMemo(
    () => ({ duration: theme.motion.durationShort2 }),
    [theme.motion.durationShort2],
  )
  const focusTiming = useMemo(
    () => ({ duration: theme.motion.durationShort4 }),
    [theme.motion.durationShort4],
  )

  const styles = useMemo(
    () =>
      createStyles(
        theme,
        variant,
        hasLeading,
        hasTrailing,
        containerColor,
        contentColor,
      ),
    [theme, variant, hasLeading, hasTrailing, containerColor, contentColor],
  )

  const colors = useMemo(
    () => getResolvedButtonColors(theme, variant, containerColor, contentColor),
    [theme, variant, containerColor, contentColor],
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

  const showElevationLayers = variant === 'elevated' && !isDisabled

  // Cross-fade level 1 (rest) and level 2 (hover) shadow layers per MD3.
  const animatedElevationLevel1Style = useAnimatedStyle(() => ({
    opacity: 1 - hovered.value,
  }))

  const animatedElevationLevel2Style = useAnimatedStyle(() => ({
    opacity: hovered.value,
  }))

  const resolvedIconColor = useMemo(
    () =>
      resolveColorFromStyle(
        styles.label,
        isDisabled ? styles.disabledLabel : undefined,
      ),
    [styles.label, styles.disabledLabel, isDisabled],
  )

  const computedLabelStyle = useMemo(
    () => [
      styles.label,
      isDisabled ? styles.disabledLabel : undefined,
      labelStyleOverride,
    ],
    [isDisabled, styles.disabledLabel, styles.label, labelStyleOverride],
  )

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

  const iconRenderProps = { size: iconSize, color: resolvedIconColor }

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
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        hitSlop={Platform.OS === 'web' ? undefined : 4}
        disabled={isDisabled}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.container,
          animatedContainerStyle,
          isDisabled ? styles.disabledContainer : undefined,
          style,
        ]}
      >
        {leadingIcon ? (
          <View style={styles.leadingIcon}>
            {renderIcon(leadingIcon, iconRenderProps, iconResolver)}
          </View>
        ) : null}
        <Text style={computedLabelStyle}>{children}</Text>
        {trailingIcon ? (
          <View style={styles.trailingIcon}>
            {renderIcon(trailingIcon, iconRenderProps, iconResolver)}
          </View>
        ) : null}
      </AnimatedPressable>
    </View>
  )
}
