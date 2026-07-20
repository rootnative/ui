import { useTheme } from '@rootnative/core'
import { useMemo } from 'react'
import { Platform, Pressable, View } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useStateLayer } from '../internal/useStateLayer'
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

  // State-layer crossfade (rest → focus → hover → press, press wins) with
  // keyboard-only focus gating, driven by the shared MD3 state-layer hook.
  // `colors.backgroundColor` already folds in any containerColor override,
  // so the layers re-derive from it automatically. While disabled the hook's
  // style/handlers are not applied at all — the static disabled treatment
  // below owns the container, exactly as before.
  const {
    style: stateLayerStyle,
    handlers,
    states,
  } = useStateLayer({
    rest: colors.backgroundColor,
    content: theme.colors.onSurface,
    disabled: isDisabled,
  })

  // Interop escape hatch: the focus ring derives its opacity from the same
  // keyboard-focus progress the state layer runs on.
  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: states.focusVisible.value,
  }))

  const isElevated = variant === 'elevated'
  const showElevationLayers = isInteractive && isElevated && !isDisabled

  // Cross-fade level 1 (rest) and level 2 (hover) shadow layers per MD3,
  // driven by the gesture layer's hover progress. The two-absolute-layers
  // mechanism stays (rather than inertia's `useShadow`) because web elevation
  // is a `boxShadow` string — only layer opacity animates, which works on
  // every platform. Interpolating shadow keys via `useShadow` would silently
  // drop the hover shadow on web.
  const animatedElevationLevel1Style = useAnimatedStyle(() => ({
    opacity: 1 - states.hovered.value,
  }))

  const animatedElevationLevel2Style = useAnimatedStyle(() => ({
    opacity: states.hovered.value,
  }))

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
        {...(isDisabled ? undefined : handlers)}
        style={[
          styles.container,
          styles.interactiveContainer,
          // The gesture-layer style owns backgroundColor while enabled; when
          // disabled it is dropped entirely so the static disabled background
          // applies instantly (no animated layer to fight it).
          isDisabled ? undefined : stateLayerStyle,
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
