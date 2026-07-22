import { useIconResolver, useTheme } from '@rootnative/core'
import { Animated, useAnimatedStyle } from '@rootnative/inertia/reanimated'
import { renderIcon } from '@rootnative/utils'
import { useMemo } from 'react'
import { Image, Platform, Pressable, Text, View } from 'react-native'
import { useStateLayer } from '../internal/useStateLayer'
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

  // State-layer crossfade (rest → focus → hover → press, press wins) with
  // keyboard-only focus gating, driven by the shared MD3 state-layer hook.
  const {
    style: stateLayerStyle,
    handlers,
    states,
  } = useStateLayer({
    rest: theme.colors.primaryContainer,
    content: fgColor,
    containerColor,
    disabled: isDisabled,
  })

  // Interop escape hatch: the focus ring derives its opacity from the same
  // keyboard-focus progress the state layer runs on.
  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: states.focusVisible.value,
  }))

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
      {...handlers}
      style={[
        styles.container,
        sizeStyle,
        // The gesture-layer style owns backgroundColor (rest included) — a
        // trailing static background here would hide it from Reanimated's
        // prop diff and freeze the crossfade.
        stateLayerStyle,
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
