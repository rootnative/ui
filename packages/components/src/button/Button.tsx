import { useIconResolver, useTheme } from '@rootnative/core'
import { useShadow } from '@rootnative/inertia'
import {
  Animated,
  interpolate,
  useAnimatedStyle,
} from '@rootnative/inertia/reanimated'
import { renderIcon, resolveColorFromStyle } from '@rootnative/utils'
import { useMemo } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import { elevationShadowConfig } from '../internal/elevationShadow'
import { composePressHandlers, usePressMorph } from '../internal/usePressMorph'
import { useStateLayer } from '../internal/useStateLayer'
import {
  BUTTON_FOCUS_RING_OFFSET,
  BUTTON_FOCUS_RING_WIDTH,
  createStyles,
  getButtonMorphRadii,
  getButtonSizeTokens,
  getResolvedButtonColors,
} from './styles'
import type { ButtonProps } from './types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function Button({
  children,
  style,
  variant = 'filled',
  size = 's',
  shape = 'round',
  leadingIcon,
  trailingIcon,
  iconSize,
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
  const resolvedIconSize = iconSize ?? getButtonSizeTokens(size).iconSize

  const styles = useMemo(
    () =>
      createStyles(
        theme,
        variant,
        size,
        shape,
        hasLeading,
        hasTrailing,
        containerColor,
        contentColor,
      ),
    [
      theme,
      variant,
      size,
      shape,
      hasLeading,
      hasTrailing,
      containerColor,
      contentColor,
    ],
  )

  const colors = useMemo(
    () => getResolvedButtonColors(theme, variant, containerColor, contentColor),
    [theme, variant, containerColor, contentColor],
  )

  // State-layer crossfade (rest → focus → hover → press, press wins) with
  // keyboard-only focus gating, driven by the shared MD3 state-layer hook.
  // `colors` already folds in the containerColor/contentColor overrides, and
  // in every variant the layer overlay equals the resolved text color — so
  // rest + textColor reproduce getResolvedButtonColors' layer set exactly.
  // While disabled the hook's style/handlers are not applied at all — the
  // static disabled treatment below owns the container.
  const {
    style: stateLayerStyle,
    handlers,
    states,
  } = useStateLayer({
    rest: colors.backgroundColor,
    content: colors.textColor,
    disabled: isDisabled,
  })

  // Expressive press shape morph: rest shape (pill for `round`, size corner
  // for `square`) → the size's pressed corner. Rides its own bounce-free
  // effects spring, separate from the state-layer color progress (which
  // stays on 'state-press').
  const { rest: restRadius, pressed: pressedRadius } = getButtonMorphRadii(
    size,
    shape,
  )
  const morph = usePressMorph({
    rest: restRadius,
    pressed: pressedRadius,
    transition: 'spring-default-effects',
    disabled: isDisabled,
  })
  const morphProgress = morph.progress

  const composedHandlers = useMemo(
    () => composePressHandlers(handlers, morph.handlers),
    [handlers, morph.handlers],
  )

  // Interop escape hatch: the focus ring derives its opacity from the same
  // keyboard-focus progress the state layer runs on, and its radius follows
  // the press morph (offset outward) so a keyboard-activated press keeps the
  // ring hugging the container.
  const focusRingOutset = BUTTON_FOCUS_RING_OFFSET + BUTTON_FOCUS_RING_WIDTH
  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: states.focusVisible.value,
    borderRadius: interpolate(
      morphProgress.value,
      [0, 1],
      [restRadius + focusRingOutset, pressedRadius + focusRingOutset],
    ),
  }))

  const showElevationLayer = variant === 'elevated' && !isDisabled

  // Elevation moves level 1 (rest) → level 2 (hover) per MD3 as one
  // interpolated shadow on a single unclipped carrier View behind the
  // container, driven by the gesture layer's hover progress. See Card.tsx for
  // why the shadow rides its own node.
  const restShadow = useMemo(
    () => elevationShadowConfig(theme.elevation.level1),
    [theme.elevation.level1],
  )
  const hoveredShadow = useMemo(
    () => elevationShadowConfig(theme.elevation.level2),
    [theme.elevation.level2],
  )
  const elevationShadowStyle = useShadow({
    from: restShadow,
    to: hoveredShadow,
    progress: states.hovered,
  })

  // The carrier is also a shaped surface: it follows the press morph so the
  // shadow's shape matches the container's. Two driving values (hover for the
  // shadow, morph for the radius) on one node — hence a separate style rather
  // than folding the radius into `useShadow`, which only covers shadow keys.
  const animatedElevationRadiusStyle = useAnimatedStyle(() => ({
    borderRadius: interpolate(
      morphProgress.value,
      [0, 1],
      [restRadius, pressedRadius],
    ),
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

  const iconRenderProps = { size: resolvedIconSize, color: resolvedIconColor }

  return (
    <View style={styles.wrapper}>
      <Animated.View
        pointerEvents="none"
        style={[styles.focusRing, animatedFocusRingStyle]}
      />
      {showElevationLayer ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.elevationLayer,
            animatedElevationRadiusStyle,
            elevationShadowStyle,
          ]}
        />
      ) : null}
      <AnimatedPressable
        {...props}
        accessibilityRole="button"
        aria-disabled={isDisabled}
        hitSlop={Platform.OS === 'web' ? undefined : 4}
        disabled={isDisabled}
        {...(isDisabled ? undefined : composedHandlers)}
        style={[
          styles.container,
          // The gesture-layer style owns backgroundColor while enabled; when
          // disabled it is dropped entirely so the static disabled background
          // applies instantly (no animated layer to fight it). The press
          // morph sits before the consumer `style` so an explicit
          // borderRadius override still wins.
          isDisabled ? undefined : stateLayerStyle,
          isDisabled ? undefined : morph.style,
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
