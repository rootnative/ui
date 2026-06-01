import { useIconResolver, useTheme } from '@rootnative/core'
import { alphaColor, isFocusVisible, renderIcon } from '@rootnative/utils'
import { useCallback, useMemo } from 'react'
import { Pressable } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {
  applyContainerColorOverride,
  createStyles,
  getIconButtonColors,
} from './styles'
import type {
  IconButtonProps,
  IconButtonSize,
  IconButtonVariant,
} from './types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function getIconColor(
  variant: IconButtonVariant,
  theme: ReturnType<typeof useTheme>,
  isToggle: boolean,
  selected: boolean,
): string {
  if (isToggle) {
    if (variant === 'filled') {
      return selected ? theme.colors.onPrimary : theme.colors.primary
    }

    if (variant === 'tonal') {
      return selected
        ? theme.colors.onSecondaryContainer
        : theme.colors.onSurfaceVariant
    }

    if (variant === 'outlined') {
      return selected
        ? theme.colors.inverseOnSurface
        : theme.colors.onSurfaceVariant
    }

    return selected ? theme.colors.primary : theme.colors.onSurfaceVariant
  }

  if (variant === 'filled') {
    return theme.colors.onPrimary
  }

  if (variant === 'tonal') {
    return theme.colors.onSecondaryContainer
  }

  return theme.colors.onSurfaceVariant
}

function getSizeStyle(
  styles: ReturnType<typeof createStyles>,
  size: IconButtonSize,
) {
  if (size === 'small') return styles.sizeSmall
  if (size === 'large') return styles.sizeLarge
  return styles.sizeMedium
}

function getIconPixelSize(size: IconButtonSize): number {
  if (size === 'small') return 18
  if (size === 'large') return 28
  return 24
}

function getDefaultHitSlop(size: IconButtonSize): number {
  if (size === 'small') return 8
  if (size === 'large') return 0
  return 4
}

export function IconButton({
  icon,
  selectedIcon,
  iconColor,
  contentColor,
  containerColor,
  style,
  onPress,
  disabled = false,
  variant = 'filled',
  selected,
  size = 'medium',
  hitSlop,
  accessibilityLabel,
  ...props
}: IconButtonProps) {
  const theme = useTheme()
  const iconResolver = useIconResolver()
  const styles = useMemo(() => createStyles(theme), [theme])

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

  const isDisabled = Boolean(disabled)
  const isToggle = selected !== undefined
  const isSelected = Boolean(selected)
  // Disabled always renders 38% onSurface — contentColor/iconColor never
  // override the MD3 disabled treatment.
  const resolvedIconColor = isDisabled
    ? alphaColor(theme.colors.onSurface, theme.stateLayer.disabledOpacity)
    : (contentColor ??
      iconColor ??
      getIconColor(variant, theme, isToggle, isSelected))
  const displayIcon =
    isToggle && isSelected && selectedIcon ? selectedIcon : icon
  const iconPixelSize = getIconPixelSize(size)
  const accessibilityState = isToggle
    ? { disabled: isDisabled, selected: isSelected }
    : { disabled: isDisabled }

  const colors = useMemo(() => {
    const base = getIconButtonColors(theme, variant, isToggle, isSelected)
    if (!containerColor) return base
    return applyContainerColorOverride(
      theme,
      base,
      containerColor,
      resolvedIconColor,
    )
  }, [theme, variant, isToggle, isSelected, containerColor, resolvedIconColor])

  const hovered = useSharedValue(0)
  const focused = useSharedValue(0)
  const pressed = useSharedValue(0)

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

  const disabledOverride = isDisabled
    ? {
        backgroundColor: colors.disabledBackgroundColor,
        borderColor: colors.disabledBorderColor,
      }
    : undefined

  return (
    <Animated.View style={styles.wrapper}>
      <Animated.View
        pointerEvents="none"
        style={[styles.focusRing, animatedFocusRingStyle]}
      />
      <AnimatedPressable
        {...props}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
        disabled={isDisabled}
        hitSlop={hitSlop ?? getDefaultHitSlop(size)}
        onPress={onPress}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.container,
          getSizeStyle(styles, size),
          { borderColor: colors.borderColor, borderWidth: colors.borderWidth },
          animatedContainerStyle,
          disabledOverride,
          isDisabled ? styles.disabled : undefined,
          // Function-form `style` is intentionally dropped on animated
          // components — wrapping the whole `style` array in a function would
          // hide the animated container style from Reanimated's prop diff and
          // break the state-layer transitions. Use `containerColor` /
          // `contentColor` for state-aware styling instead.
          typeof style === 'function' ? undefined : style,
        ]}
      >
        {renderIcon(
          displayIcon,
          { size: iconPixelSize, color: resolvedIconColor },
          iconResolver,
        )}
      </AnimatedPressable>
    </Animated.View>
  )
}
