import { useIconResolver, useTheme } from '@rootnative/core'
import { Animated, useAnimatedStyle } from '@rootnative/inertia/reanimated'
import { alphaColor, renderIcon } from '@rootnative/utils'
import { useMemo } from 'react'
import { Pressable } from 'react-native'
import { useStateLayer } from '../internal/useStateLayer'
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

  // State-layer crossfade (rest → focus → hover → press, press wins) with
  // keyboard-only focus gating, driven by the shared MD3 state-layer hook.
  // The overlay color the layers derive from matches styles.ts: the
  // variant/toggle default icon color — or the resolved icon color when a
  // containerColor override re-derives the layers (per the override
  // contract). While disabled the hook's style/handlers are not applied at
  // all — the static disabled treatment below owns the container.
  const layerContent = containerColor
    ? resolvedIconColor
    : getIconColor(variant, theme, isToggle, isSelected)
  const {
    style: stateLayerStyle,
    handlers,
    states,
  } = useStateLayer({
    rest: colors.backgroundColor,
    content: layerContent,
    disabled: isDisabled,
  })

  // Interop escape hatch: the focus ring derives its opacity from the same
  // keyboard-focus progress the state layer runs on.
  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: states.focusVisible.value,
  }))

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
        {...(isDisabled ? undefined : handlers)}
        style={[
          styles.container,
          getSizeStyle(styles, size),
          { borderColor: colors.borderColor, borderWidth: colors.borderWidth },
          // The gesture-layer style owns backgroundColor while enabled; when
          // disabled it is dropped entirely so the static disabled override
          // applies instantly (no animated layer to fight it).
          isDisabled ? undefined : stateLayerStyle,
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
