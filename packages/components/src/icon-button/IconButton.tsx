import { useIconResolver, useTheme } from '@rootnative/core'
import { useBooleanSpring } from '@rootnative/inertia'
import {
  Animated,
  interpolate,
  useAnimatedStyle,
} from '@rootnative/inertia/reanimated'
import { alphaColor, renderIcon } from '@rootnative/utils'
import { useMemo } from 'react'
import { Pressable } from 'react-native'
import { composePressHandlers, usePressMorph } from '../internal/usePressMorph'
import { useStateLayer } from '../internal/useStateLayer'
import {
  ICON_BUTTON_FOCUS_RING_OFFSET,
  ICON_BUTTON_FOCUS_RING_WIDTH,
  applyContainerColorOverride,
  createStyles,
  getIconButtonColors,
  getIconButtonMorphRadii,
  getIconButtonSizeTokens,
  getIconButtonWidth,
} from './styles'
import type { IconButtonProps, IconButtonVariant } from './types'

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

// Extra touch-target padding (via hitSlop) to reach the WCAG/MD3 48dp
// minimum on the smaller sizes, per side.
function getDefaultHitSlop(height: number): number {
  return Math.max(0, Math.round((48 - height) / 2))
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
  size = 's',
  width = 'uniform',
  shape = 'round',
  hitSlop,
  accessibilityLabel,
  ...props
}: IconButtonProps) {
  const theme = useTheme()
  const iconResolver = useIconResolver()
  const styles = useMemo(() => createStyles(theme), [theme])
  const sizeTokens = getIconButtonSizeTokens(size)

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
  const iconPixelSize = sizeTokens.iconSize
  const containerWidth = getIconButtonWidth(size, width)
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

  // Expressive shape morphs, both on the bounce-free effects spring Compose
  // uses for icon buttons: press squashes toward cornerSmall (pressed wins),
  // and a selected toggle inverts the shape (round → squarer, square → pill)
  // to signal its state. Rest radii come from the size/width/shape tokens
  // for both the unselected and selected states; the selected progress
  // interpolates between them and the press morph squashes on top.
  const unselectedRest = getIconButtonMorphRadii(size, shape, width, false).rest
  const { rest: selectedRest, pressed: pressedRadius } =
    getIconButtonMorphRadii(size, shape, width, true)
  const morph = usePressMorph({
    rest: unselectedRest,
    pressed: pressedRadius,
    transition: 'spring-default-effects',
    disabled: isDisabled,
  })
  const morphProgress = morph.progress
  const selectedProgress = useBooleanSpring(
    isToggle && isSelected,
    'spring-default-effects',
  )

  const composedHandlers = useMemo(
    () => composePressHandlers(handlers, morph.handlers),
    [handlers, morph.handlers],
  )

  const animatedRadiusStyle = useAnimatedStyle(() => {
    const rest = interpolate(
      selectedProgress.value,
      [0, 1],
      [unselectedRest, selectedRest],
    )
    return {
      borderRadius: interpolate(
        morphProgress.value,
        [0, 1],
        [rest, pressedRadius],
      ),
    }
  })

  // Interop escape hatch: the focus ring derives its opacity from the same
  // keyboard-focus progress the state layer runs on, and its radius follows
  // the shape morphs (offset outward) so it keeps hugging the container.
  const focusRingOutset =
    ICON_BUTTON_FOCUS_RING_OFFSET + ICON_BUTTON_FOCUS_RING_WIDTH
  const animatedFocusRingStyle = useAnimatedStyle(() => {
    const rest = interpolate(
      selectedProgress.value,
      [0, 1],
      [unselectedRest, selectedRest],
    )
    return {
      opacity: states.focusVisible.value,
      borderRadius:
        interpolate(morphProgress.value, [0, 1], [rest, pressedRadius]) +
        focusRingOutset,
    }
  })

  const disabledOverride = isDisabled
    ? {
        backgroundColor: colors.disabledBackgroundColor,
        borderColor: colors.disabledBorderColor,
      }
    : undefined

  // Container dimensions from the size/width tokens, plus the outlined-variant
  // border (size-specific width: 1/1/1/2/3 dp). Dynamic, so it can't live in
  // createStyles.
  const sizeStyle = {
    width: containerWidth,
    height: sizeTokens.height,
    borderColor: colors.borderColor,
    borderWidth:
      variant === 'outlined' ? sizeTokens.outlineWidth : colors.borderWidth,
  }

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
        hitSlop={hitSlop ?? getDefaultHitSlop(sizeTokens.height)}
        onPress={onPress}
        {...(isDisabled ? undefined : composedHandlers)}
        style={[
          styles.container,
          sizeStyle,
          // The gesture-layer style owns backgroundColor while enabled; when
          // disabled it is dropped entirely so the static disabled override
          // applies instantly (no animated layer to fight it). The radius
          // morph stays applied while disabled — a selected toggle keeps its
          // squarer resting shape (the press progress is pinned to rest).
          animatedRadiusStyle,
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
