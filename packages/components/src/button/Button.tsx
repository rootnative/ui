import { useIconResolver, useTheme } from '@rootnative/core'
import {
  Animated,
  interpolate,
  useAnimatedStyle,
} from '@rootnative/inertia/reanimated'
import { renderIcon, resolveColorFromStyle } from '@rootnative/utils'
import { useMemo } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import { composePressHandlers, usePressMorph } from '../internal/usePressMorph'
import { useStateLayer } from '../internal/useStateLayer'
import {
  BUTTON_FOCUS_RING_OFFSET,
  BUTTON_FOCUS_RING_WIDTH,
  BUTTON_PRESS_MORPH_REST_RADIUS,
  createStyles,
  getResolvedButtonColors,
} from './styles'
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

  // Expressive press shape morph: pill → cornerSmall while pressed. Rides
  // its own bounce-free effects spring, separate from the state-layer color
  // progress (which stays on 'state-press').
  const pressedRadius = theme.shape.cornerSmall
  const morph = usePressMorph({
    rest: BUTTON_PRESS_MORPH_REST_RADIUS,
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
      [
        BUTTON_PRESS_MORPH_REST_RADIUS + focusRingOutset,
        pressedRadius + focusRingOutset,
      ],
    ),
  }))

  const showElevationLayers = variant === 'elevated' && !isDisabled

  // Cross-fade level 1 (rest) and level 2 (hover) shadow layers per MD3,
  // driven by the gesture layer's hover progress (two-layer opacity swap —
  // platform-portable, see Card.tsx for why useShadow can't replace it).
  // Both follow the press morph so the shadow shape matches the container.
  const animatedElevationLevel1Style = useAnimatedStyle(() => ({
    opacity: 1 - states.hovered.value,
    borderRadius: interpolate(
      morphProgress.value,
      [0, 1],
      [BUTTON_PRESS_MORPH_REST_RADIUS, pressedRadius],
    ),
  }))

  const animatedElevationLevel2Style = useAnimatedStyle(() => ({
    opacity: states.hovered.value,
    borderRadius: interpolate(
      morphProgress.value,
      [0, 1],
      [BUTTON_PRESS_MORPH_REST_RADIUS, pressedRadius],
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
