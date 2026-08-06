import { useTheme } from '@rootnative/core'
import { useInterpolatedStyle, useShadow } from '@rootnative/inertia'
import { Animated } from '@rootnative/inertia/reanimated'
import { useMemo } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { elevationShadowConfig } from '../internal/elevationShadow'
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
  const animatedFocusRingStyle = useInterpolatedStyle(states.focusVisible, {
    opacity: [0, 1],
  })

  const isElevated = variant === 'elevated'
  const showElevationLayer = isInteractive && isElevated && !isDisabled

  // Elevation moves level 1 (rest) → level 2 (hover) per MD3 as one
  // interpolated shadow on a single unclipped carrier View behind the
  // container, driven by the gesture layer's hover progress.
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

  if (!isInteractive) {
    // An elevated Card without `onPress` keeps its shadow on this node, because
    // neither structural alternative is free. A carrier is an
    // absolutely-positioned *sibling*, so it needs a wrapper View above the
    // container — and that makes the wrapper the node the parent lays out, so
    // `<Card style={{ flex: 1 }}>` silently stops stretching (the docs homepage
    // grid relies on exactly that; the interactive path already has the
    // limitation). Moving the clip to an inner view instead puts the children
    // one level down, which breaks `flexDirection` / `alignItems` / `gap`
    // passed through `style` — the common media-plus-text card.
    //
    // So the surface changes instead of the tree: on iOS the container swaps
    // `shadow*` for `boxShadow` (`styles.overflowInkElevation`), which Fabric
    // renders *outside* the clip by moving the subviews into a container view
    // of its own. One node, `style` still lands on it, every layout prop
    // unchanged. New-arch only, and old arch was already flat here.
    return (
      <View
        {...props}
        style={[
          styles.container,
          isElevated ? styles.overflowInkElevation : undefined,
          style,
        ]}
      >
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
      {showElevationLayer ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.elevationLayer, elevationShadowStyle]}
        />
      ) : null}
      <AnimatedPressable
        {...props}
        role="button"
        aria-disabled={isDisabled}
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
          showElevationLayer ? styles.elevationDelegated : undefined,
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
