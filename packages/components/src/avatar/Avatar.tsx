import { useIconResolver, useTheme } from '@rootnative/core'
import { blendColor, isFocusVisible, renderIcon } from '@rootnative/utils'
import { useCallback, useMemo } from 'react'
import { Image, Platform, Pressable, Text, View } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { createStyles } from './styles'
import type { AvatarProps, AvatarSize } from './types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Minimum touch target for interactive avatars (WCAG / MD3).
const MIN_TOUCH_TARGET = 48

const CONTAINER_PX: Record<AvatarSize, number> = {
  xSmall: 24,
  small: 32,
  medium: 40,
  large: 56,
  xLarge: 112,
}

const ICON_PX: Record<AvatarSize, number> = {
  xSmall: 14,
  small: 18,
  medium: 24,
  large: 32,
  xLarge: 56,
}

// Initials typography — nearest MD3 type role for each container size.
const LABEL_TYPE_ROLE: Record<
  AvatarSize,
  | 'labelSmall'
  | 'labelMedium'
  | 'titleMedium'
  | 'headlineSmall'
  | 'displaySmall'
> = {
  xSmall: 'labelSmall',
  small: 'labelMedium',
  medium: 'titleMedium',
  large: 'headlineSmall',
  xLarge: 'displaySmall',
}

function getSizeStyle(
  styles: ReturnType<typeof createStyles>,
  size: AvatarSize,
) {
  if (size === 'xSmall') return styles.sizeXSmall
  if (size === 'small') return styles.sizeSmall
  if (size === 'large') return styles.sizeLarge
  if (size === 'xLarge') return styles.sizeXLarge
  return styles.sizeMedium
}

export function Avatar({
  imageUri,
  icon,
  label,
  size = 'medium',
  containerColor,
  contentColor,
  style,
  onPress,
  disabled = false,
  accessibilityLabel,
  ...props
}: AvatarProps) {
  const isDisabled = Boolean(disabled)
  const isInteractive = onPress !== undefined
  const theme = useTheme()
  const iconResolver = useIconResolver()
  const styles = useMemo(() => createStyles(theme), [theme])

  const bgColor = containerColor ?? theme.colors.primaryContainer
  const fgColor = contentColor ?? theme.colors.onPrimaryContainer
  const sizeStyle = getSizeStyle(styles, size)
  const iconPx = ICON_PX[size]
  const initials = label ? label.slice(0, 2).toUpperCase() : undefined
  const initialsStyle = useMemo(
    () => ({
      ...theme.typography[LABEL_TYPE_ROLE[size]],
      color: fgColor,
    }),
    [theme.typography, size, fgColor],
  )

  const containerBaseStyle = useMemo(
    () => ({ backgroundColor: bgColor }),
    [bgColor],
  )

  const colors = useMemo(
    () => ({
      background: bgColor,
      hovered: blendColor(bgColor, fgColor, theme.stateLayer.hoveredOpacity),
      focused: blendColor(bgColor, fgColor, theme.stateLayer.focusedOpacity),
      pressed: blendColor(bgColor, fgColor, theme.stateLayer.pressedOpacity),
    }),
    [bgColor, fgColor, theme.stateLayer],
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
      [colors.background, colors.focused],
    )
    const hoveredBg = interpolateColor(
      hovered.value,
      [0, 1],
      [focusedBg, colors.hovered],
    )
    const pressedBg = interpolateColor(
      pressed.value,
      [0, 1],
      [hoveredBg, colors.pressed],
    )
    return { backgroundColor: pressedBg }
  })

  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: focused.value,
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

  const content = imageUri ? (
    <Image source={{ uri: imageUri }} style={styles.image} accessible={false} />
  ) : label && !icon ? (
    <Text style={initialsStyle} numberOfLines={1} allowFontScaling={false}>
      {initials}
    </Text>
  ) : (
    renderIcon(
      icon ?? 'account',
      { size: iconPx, color: fgColor },
      iconResolver,
    )
  )

  if (!isInteractive) {
    return (
      <View
        {...props}
        accessible={accessibilityLabel != null || undefined}
        accessibilityRole={accessibilityLabel != null ? 'image' : undefined}
        accessibilityLabel={accessibilityLabel}
        style={[styles.container, sizeStyle, containerBaseStyle, style]}
      >
        {content}
      </View>
    )
  }

  // Bring the touch target up to the 48dp minimum on native.
  const hitSlop =
    Platform.OS === 'web'
      ? undefined
      : Math.max(0, (MIN_TOUCH_TARGET - CONTAINER_PX[size]) / 2)

  return (
    <AnimatedPressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
      hitSlop={hitSlop}
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
        sizeStyle,
        containerBaseStyle,
        animatedContainerStyle,
        isDisabled ? styles.disabledContainer : styles.interactive,
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.focusRing, animatedFocusRingStyle]}
      />
      {isDisabled ? (
        <View style={styles.disabledContent}>{content}</View>
      ) : (
        content
      )}
    </AnimatedPressable>
  )
}
