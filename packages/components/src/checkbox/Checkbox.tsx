import { useIconResolver, useTheme } from '@rootnative/core'
import { useBooleanSpring, useColorTransition } from '@rootnative/inertia'
import {
  useGestureLayer,
  type GestureLayerStates,
} from '@rootnative/inertia/gesture-layer'
import { Animated, useAnimatedStyle } from '@rootnative/inertia/reanimated'
import { renderIcon } from '@rootnative/utils'
import { useCallback, useMemo } from 'react'
import { Platform, Pressable, View } from 'react-native'
import {
  CHECKBOX_ICON_SIZE,
  createStyles,
  getResolvedCheckboxColors,
} from './styles'
import type { CheckboxProps } from './types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function Checkbox({
  style,
  value = false,
  onValueChange,
  indeterminate = false,
  error = false,
  checkIcon = 'check',
  containerColor,
  contentColor,
  disabled = false,
  ...props
}: CheckboxProps) {
  const isDisabled = Boolean(disabled)
  const isChecked = Boolean(value)
  const isIndeterminate = Boolean(indeterminate)
  const hasError = Boolean(error)
  // Indeterminate wins over checked visually — both fill the box.
  const isActive = isIndeterminate || isChecked

  const theme = useTheme()
  const iconResolver = useIconResolver()
  const styles = useMemo(() => createStyles(theme), [theme])

  const offColors = useMemo(
    () =>
      getResolvedCheckboxColors(
        theme,
        false,
        containerColor,
        contentColor,
        hasError,
      ),
    [theme, containerColor, contentColor, hasError],
  )
  const onColors = useMemo(
    () =>
      getResolvedCheckboxColors(
        theme,
        true,
        containerColor,
        contentColor,
        hasError,
      ),
    [theme, containerColor, contentColor, hasError],
  )

  // Two selection progresses per Expressive: the mark draw rides the
  // default-spatial spring (Compose's DefaultSpatial for checkDrawFraction),
  // while box/halo colors ride the critically damped default-effects spring
  // so they never overshoot. (Compose additionally uses FastEffects for the
  // to-off color fade and snaps the mark out after a 100ms delay — we keep
  // one effects spring and a symmetric mark animation as the documented
  // approximation.)
  const progress = useBooleanSpring(isActive, 'spring-default-spatial')
  const colorProgress = useBooleanSpring(isActive, 'spring-default-effects')

  // State-layer halo opacity: solid base color, view opacity carries the
  // alpha. The gesture layer composes the strongest active interaction via
  // clamped-max, which keeps the token values intact; the `disabled` layer
  // pins the halo off while disabled regardless of gesture state. Focus
  // feedback rides `focusVisible`, so it appears for keyboard focus only.
  const haloLayers = useMemo<GestureLayerStates>(
    () => ({
      rest: { opacity: 0 },
      hovered: { opacity: theme.stateLayer.hoveredOpacity },
      focusVisible: { opacity: theme.stateLayer.focusedOpacity },
      pressed: { opacity: theme.stateLayer.pressedOpacity },
      disabled: { opacity: 0 },
    }),
    [theme.stateLayer],
  )
  const gestureOptions = useMemo(
    () => ({
      disabled: isDisabled,
      transition: {
        hovered: 'state-hover',
        pressed: 'state-press',
        focused: 'state-focus',
        focusVisible: 'state-focus',
      } as const,
    }),
    [isDisabled],
  )
  const {
    style: haloOpacityStyle,
    handlers,
    states,
  } = useGestureLayer(haloLayers, gestureOptions)

  // The halo color crossfades with the selection color progress.
  const haloColorStyle = useColorTransition(colorProgress, [
    offColors.stateLayerColor,
    onColors.stateLayerColor,
  ])

  const boxBackgroundStyle = useColorTransition(colorProgress, [
    offColors.backgroundColor,
    onColors.backgroundColor,
  ])
  const boxBorderStyle = useColorTransition(
    colorProgress,
    [offColors.borderColor, onColors.borderColor],
    { key: 'borderColor' },
  )

  // Interop escape hatch: the mark pop rides the spatial selection spring
  // (box colors ride the effects spring above). Clamp the underdamped
  // spring's undershoot so scale never goes negative on the way out.
  const animatedIconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: Math.max(0, progress.value) }],
  }))

  // Interop escape hatch: the focus ring derives its opacity from the same
  // keyboard-focus progress the state layer runs on.
  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: states.focusVisible.value,
  }))

  const handlePress = useCallback(() => {
    if (!isDisabled) onValueChange?.(!isChecked)
  }, [isDisabled, isChecked, onValueChange])

  const markColor = isDisabled
    ? isActive
      ? onColors.disabledIconColor
      : offColors.disabledIconColor
    : isActive
      ? onColors.iconColor
      : offColors.iconColor

  const boxOverride = isDisabled
    ? {
        backgroundColor: isActive
          ? onColors.disabledBackgroundColor
          : offColors.disabledBackgroundColor,
        borderColor: isActive
          ? onColors.disabledBorderColor
          : offColors.disabledBorderColor,
      }
    : undefined

  const indeterminateMarkStyle = useMemo(
    () => [styles.indeterminateMark, { backgroundColor: markColor }],
    [styles, markColor],
  )

  return (
    <AnimatedPressable
      {...props}
      accessibilityRole="checkbox"
      accessibilityState={{
        disabled: isDisabled,
        checked: isIndeterminate ? 'mixed' : isChecked,
      }}
      hitSlop={Platform.OS === 'web' ? undefined : 4}
      disabled={isDisabled}
      onPress={handlePress}
      {...handlers}
      style={[
        styles.container,
        isDisabled ? styles.disabledContainer : undefined,
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.focusRing, animatedFocusRingStyle]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.stateLayer, haloOpacityStyle, haloColorStyle]}
      />
      <Animated.View
        testID="checkbox-box"
        style={[styles.box, boxBackgroundStyle, boxBorderStyle, boxOverride]}
      >
        {isIndeterminate ? (
          <Animated.View pointerEvents="none" style={animatedIconStyle}>
            <View
              testID="checkbox-indeterminate-mark"
              style={indeterminateMarkStyle}
            />
          </Animated.View>
        ) : isChecked ? (
          <Animated.View pointerEvents="none" style={animatedIconStyle}>
            {renderIcon(
              checkIcon,
              { size: CHECKBOX_ICON_SIZE, color: markColor },
              iconResolver,
            )}
          </Animated.View>
        ) : null}
      </Animated.View>
    </AnimatedPressable>
  )
}
