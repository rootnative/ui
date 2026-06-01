import { useIconResolver, useTheme } from '@rootnative/core'
import { isFocusVisible, renderIcon } from '@rootnative/utils'
import { useCallback, useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
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

  const colors = useMemo(
    () => getResolvedFABColors(theme, variant, containerColor, contentColor),
    [theme, variant, containerColor, contentColor],
  )

  const resolvedContentColor = isDisabled
    ? colors.disabledContentColor
    : colors.contentColor
  const iconPixelSize = getFABIconPixelSize(size)

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

  const showElevationLayers = !isDisabled

  // Cross-fade level 3 (rest) and level 4 (hover) shadow layers per MD3.
  const animatedElevationLevel3Style = useAnimatedStyle(() => ({
    opacity: 1 - hovered.value,
  }))

  const animatedElevationLevel4Style = useAnimatedStyle(() => ({
    opacity: hovered.value,
  }))

  const elevationLayerColorStyle = useMemo(
    () => ({ backgroundColor: colors.backgroundColor }),
    [colors.backgroundColor],
  )

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
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.container,
          isExtended
            ? [styles.extended, icon ? styles.extendedWithIcon : undefined]
            : getFABSizeStyle(styles, size),
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
