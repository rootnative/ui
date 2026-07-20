import { useIconResolver, useTheme } from '@rootnative/core'
import { renderIcon } from '@rootnative/utils'
import { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useStateLayer } from '../internal/useStateLayer'
import {
  createStyles,
  getFABIconPixelSize,
  getFABSizeStyle,
  getResolvedFABColors,
} from './styles'
import type { FABProps, FABSize } from './types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function getFocusRingSizeStyle(
  styles: ReturnType<typeof createStyles>,
  size: FABSize,
  isExtended: boolean,
) {
  if (isExtended) return styles.focusRingMedium
  if (size === 'small') return styles.focusRingSmall
  if (size === 'large') return styles.focusRingLarge
  return styles.focusRingMedium
}

function getElevationLayerRadiusStyle(
  styles: ReturnType<typeof createStyles>,
  size: FABSize,
  isExtended: boolean,
) {
  if (isExtended) return styles.elevationLayerRadiusMedium
  if (size === 'small') return styles.elevationLayerRadiusSmall
  if (size === 'large') return styles.elevationLayerRadiusLarge
  return styles.elevationLayerRadiusMedium
}

export function FAB({
  icon,
  label,
  variant = 'primary',
  size: sizeProp,
  containerColor,
  contentColor,
  labelStyle: labelStyleOverride,
  style,
  onPress,
  disabled = false,
  accessibilityLabel,
  hitSlop,
  ...rest
}: FABProps) {
  const isExtended = typeof label === 'string'
  const size: FABSize = isExtended ? 'medium' : (sizeProp ?? 'medium')
  // MD3 minimum 48dp touch target — small FAB (40dp) needs 4dp hit slop.
  const resolvedHitSlop =
    hitSlop ?? (size === 'small' && !isExtended ? 4 : undefined)

  const theme = useTheme()
  const iconResolver = useIconResolver()
  const styles = useMemo(() => createStyles(theme), [theme])
  const isDisabled = Boolean(disabled)

  const colors = useMemo(
    () => getResolvedFABColors(theme, variant, containerColor, contentColor),
    [theme, variant, containerColor, contentColor],
  )

  const resolvedContentColor = isDisabled
    ? colors.disabledContentColor
    : colors.contentColor
  const iconPixelSize = getFABIconPixelSize(size)

  // State-layer crossfade (rest → focus → hover → press, press wins) with
  // keyboard-only focus gating, driven by the shared MD3 state-layer hook.
  // `colors` already folds in the containerColor/contentColor overrides, and
  // layers always derive from the resolved content color over the resolved
  // background (FAB containers are never transparent). While disabled the
  // hook's style/handlers are not applied at all — the static disabled
  // treatment below owns the container.
  const {
    style: stateLayerStyle,
    handlers,
    states,
  } = useStateLayer({
    rest: colors.backgroundColor,
    content: colors.contentColor,
    disabled: isDisabled,
  })

  // Interop escape hatch: the focus ring derives its opacity from the same
  // keyboard-focus progress the state layer runs on.
  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: states.focusVisible.value,
  }))

  const showElevationLayers = !isDisabled

  // Cross-fade level 3 (rest) and level 4 (hover) shadow layers per MD3,
  // driven by the gesture layer's hover progress (two-layer opacity swap —
  // platform-portable, see Card.tsx for why useShadow can't replace it).
  const animatedElevationLevel3Style = useAnimatedStyle(() => ({
    opacity: 1 - states.hovered.value,
  }))

  const animatedElevationLevel4Style = useAnimatedStyle(() => ({
    opacity: states.hovered.value,
  }))

  const elevationLayerColorStyle = useMemo(
    () => ({ backgroundColor: colors.backgroundColor }),
    [colors.backgroundColor],
  )

  const labelTextStyle = useMemo(
    () => [styles.label, { color: resolvedContentColor }, labelStyleOverride],
    [styles.label, resolvedContentColor, labelStyleOverride],
  )

  const disabledOverride = isDisabled
    ? { backgroundColor: colors.disabledBackgroundColor }
    : undefined

  return (
    <View style={styles.wrapper}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.focusRing,
          getFocusRingSizeStyle(styles, size, isExtended),
          animatedFocusRingStyle,
        ]}
      />
      {showElevationLayers ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.elevationLayerLevel3,
              getElevationLayerRadiusStyle(styles, size, isExtended),
              elevationLayerColorStyle,
              animatedElevationLevel3Style,
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.elevationLayerLevel4,
              getElevationLayerRadiusStyle(styles, size, isExtended),
              elevationLayerColorStyle,
              animatedElevationLevel4Style,
            ]}
          />
        </>
      ) : null}
      <AnimatedPressable
        {...rest}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        hitSlop={resolvedHitSlop}
        onPress={onPress}
        {...(isDisabled ? undefined : handlers)}
        style={[
          styles.container,
          isExtended
            ? [styles.extended, icon ? styles.extendedWithIcon : undefined]
            : getFABSizeStyle(styles, size),
          // The gesture-layer style owns backgroundColor while enabled; when
          // disabled it is dropped entirely so the static disabled background
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
        {icon ? (
          <View style={isExtended ? styles.extendedIcon : undefined}>
            {renderIcon(
              icon,
              { size: iconPixelSize, color: resolvedContentColor },
              iconResolver,
            )}
          </View>
        ) : null}
        {isExtended ? <Text style={labelTextStyle}>{label}</Text> : null}
      </AnimatedPressable>
    </View>
  )
}
