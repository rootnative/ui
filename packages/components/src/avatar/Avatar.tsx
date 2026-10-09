import { useIconResolver, useTheme } from '@rootnative/core'
import { Animated } from '@rootnative/inertia/reanimated'
import { renderIcon } from '@rootnative/utils'
import { useMemo } from 'react'
import { Image, Platform, Text, View } from 'react-native'
import { AnimatedPressable } from '../internal/AnimatedPressable'
import { composeHandlers } from '../internal/composeHandlers'
import { webOutlineReset } from '../internal/focusOutline'
import { pointerEvents } from '../internal/pointerEvents'
import type { ExpressiveSize } from '../internal/size'
import { getDefaultHitSlop } from '../internal/touchTarget'
import { useStateLayer } from '../internal/useStateLayer'
import { createStyles } from './styles'
import type { AvatarProps } from './types'

const CONTAINER_PX: Record<ExpressiveSize, number> = {
  extraSmall: 24,
  small: 32,
  medium: 40,
  large: 56,
  extraLarge: 112,
}

const ICON_PX: Record<ExpressiveSize, number> = {
  extraSmall: 14,
  small: 18,
  medium: 24,
  large: 32,
  extraLarge: 56,
}

// Initials typography — nearest MD3 type role for each container size.
const LABEL_TYPE_ROLE: Record<
  ExpressiveSize,
  | 'labelSmall'
  | 'labelMedium'
  | 'titleMedium'
  | 'headlineSmall'
  | 'displaySmall'
> = {
  extraSmall: 'labelSmall',
  small: 'labelMedium',
  medium: 'titleMedium',
  large: 'headlineSmall',
  extraLarge: 'displaySmall',
}

function getSizeStyle(
  styles: ReturnType<typeof createStyles>,
  size: ExpressiveSize,
) {
  if (size === 'extraSmall') return styles.sizeExtraSmall
  if (size === 'small') return styles.sizeSmall
  if (size === 'large') return styles.sizeLarge
  if (size === 'extraLarge') return styles.sizeExtraLarge
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
    focusRingStyle: animatedFocusRingStyle,
  } = useStateLayer({
    rest: theme.colors.primaryContainer,
    content: fgColor,
    containerColor,
    disabled: isDisabled,
  })

  const content = imageUri ? (
    <Image source={{ uri: imageUri }} style={styles.image} accessible={false} />
  ) : label && !icon ? (
    <Text style={initialsStyle} numberOfLines={1} allowFontScaling={false}>
      {initials}
    </Text>
  ) : (
    // Only the icon branch is hidden. The initials above are real text, and
    // without an `accessibilityLabel` the container is not accessible, so they
    // are the only name a reader could get.
    <View aria-hidden>
      {renderIcon(
        icon ?? 'account',
        { size: iconPx, color: fgColor },
        iconResolver,
      )}
    </View>
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
    Platform.OS === 'web' ? undefined : getDefaultHitSlop(CONTAINER_PX[size])

  return (
    <AnimatedPressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      aria-disabled={isDisabled}
      hitSlop={hitSlop}
      disabled={isDisabled}
      onPress={onPress}
      {...composeHandlers(handlers, props)}
      style={[
        styles.container,
        webOutlineReset,
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
        style={[styles.focusRing, animatedFocusRingStyle, pointerEvents.none]}
      />
      {isDisabled ? (
        <View style={styles.disabledContent}>{content}</View>
      ) : (
        content
      )}
    </AnimatedPressable>
  )
}
