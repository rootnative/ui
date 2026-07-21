import { useIconResolver, useTheme } from '@rootnative/core'
import {
  cubicBezier,
  useBooleanSpring,
  useColorTransition,
} from '@rootnative/inertia'
import {
  useGestureLayer,
  type GestureLayerStates,
} from '@rootnative/inertia/gesture-layer'
import { renderIcon, resolveColorFromStyle } from '@rootnative/utils'
import { useCallback, useMemo } from 'react'
import { Platform, Pressable, View } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated'
import {
  SWITCH_STATE_LAYER_SIZE,
  SWITCH_THUMB_OFF_SIZE,
  SWITCH_THUMB_ON_SIZE,
  SWITCH_THUMB_PRESSED_SIZE,
  SWITCH_TRACK_BORDER_WIDTH,
  SWITCH_TRACK_PADDING,
  SWITCH_TRACK_WIDTH,
  createStyles,
  getResolvedColors,
} from './styles'
import type { SwitchProps } from './types'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const THUMB_TRANSLATE_X =
  SWITCH_TRACK_WIDTH - SWITCH_TRACK_PADDING * 2 - SWITCH_THUMB_ON_SIZE

// Press in/out uses a fast, predictable timing curve — no spring oscillation,
// so the 28 dp thumb grow is reached in full within 120 ms.
const PRESS_DURATION = 120

const ICON_SIZE = 16

export function Switch({
  style,
  value = false,
  onValueChange,
  selectedIcon,
  unselectedIcon,
  containerColor,
  contentColor,
  disabled = false,
  ...props
}: SwitchProps) {
  const isDisabled = Boolean(disabled)
  const isSelected = Boolean(value)
  const hasUnselectedIcon = Boolean(unselectedIcon)
  const offThumbSize = hasUnselectedIcon
    ? SWITCH_THUMB_ON_SIZE
    : SWITCH_THUMB_OFF_SIZE

  const theme = useTheme()
  const iconResolver = useIconResolver()
  const styles = useMemo(
    () => createStyles(theme, containerColor, contentColor),
    [theme, containerColor, contentColor],
  )

  const offColors = useMemo(
    () => getResolvedColors(theme, false, containerColor, contentColor),
    [theme, containerColor, contentColor],
  )
  const onColors = useMemo(
    () => getResolvedColors(theme, true, containerColor, contentColor),
    [theme, containerColor, contentColor],
  )

  // Toggle progress — the theme's fast-spatial spring (MD3 emphasized feel,
  // slight overshoot, ~0.85 damping ratio).
  const progress = useBooleanSpring(isSelected, 'spring-fast-spatial')

  const pressTransition = useMemo(
    () => ({
      type: 'timing' as const,
      duration: PRESS_DURATION,
      easing: cubicBezier(theme.motion.easingStandard),
    }),
    [theme.motion.easingStandard],
  )

  // State-layer halo opacity: solid base color, view opacity carries the
  // alpha. The gesture layer composes the strongest active interaction via
  // clamped-max; the `disabled` layer pins the halo off while disabled.
  // Focus feedback rides `focusVisible` (keyboard focus only). The pressed
  // progress doubles as the thumb-grow driver below.
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
        hovered: 'state-hover' as const,
        focused: 'state-focus' as const,
        focusVisible: 'state-focus' as const,
        pressed: pressTransition,
      },
    }),
    [isDisabled, pressTransition],
  )
  const {
    style: haloOpacityStyle,
    handlers,
    states,
  } = useGestureLayer(haloLayers, gestureOptions)
  const pressed = states.pressed

  const trackColorStyle = useColorTransition(progress, [
    offColors.trackColor,
    onColors.trackColor,
  ])
  const trackBorderStyle = useColorTransition(
    progress,
    [offColors.borderColor, onColors.borderColor],
    { key: 'borderColor' },
  )

  const thumbColorStyle = useColorTransition(progress, [
    offColors.thumbColor,
    onColors.thumbColor,
  ])

  // Interop escape hatch: the thumb morph reads the toggle spring and the
  // pressed timing together — position, size, and radius in one progress-
  // driven worklet.
  const animatedThumbStyle = useAnimatedStyle(() => {
    const baseSize = interpolate(
      progress.value,
      [0, 1],
      [offThumbSize, SWITCH_THUMB_ON_SIZE],
    )
    const size = interpolate(
      pressed.value,
      [0, 1],
      [baseSize, SWITCH_THUMB_PRESSED_SIZE],
    )
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      transform: [
        {
          translateX: interpolate(
            progress.value,
            [0, 1],
            [0, THUMB_TRANSLATE_X],
          ),
        },
      ],
    }
  })

  // Halo center should track the thumb's center. Static `left` is calibrated
  // for the off position; `translateX` adds (a) the toggle progress shift and
  // (b) any thumb-grow shift on press (since the thumb's left edge is fixed,
  // its center moves right by half the size delta).
  const haloPositionStyle = useMemo(
    () => ({
      left:
        SWITCH_TRACK_PADDING -
        SWITCH_TRACK_BORDER_WIDTH +
        offThumbSize / 2 -
        SWITCH_STATE_LAYER_SIZE / 2,
    }),
    [offThumbSize],
  )

  // The halo color crossfades with the toggle progress (same as the thumb).
  const haloColorStyle = useColorTransition(progress, [
    offColors.thumbColor,
    onColors.thumbColor,
  ])

  const animatedHaloStyle = useAnimatedStyle(() => {
    const baseSize = interpolate(
      progress.value,
      [0, 1],
      [offThumbSize, SWITCH_THUMB_ON_SIZE],
    )
    const size = interpolate(
      pressed.value,
      [0, 1],
      [baseSize, SWITCH_THUMB_PRESSED_SIZE],
    )
    return {
      transform: [
        {
          translateX:
            progress.value * THUMB_TRANSLATE_X + (size - offThumbSize) / 2,
        },
      ],
    }
  })

  // Interop escape hatch: the focus ring derives its opacity from the same
  // keyboard-focus progress the state layer runs on.
  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: states.focusVisible.value,
  }))

  const animatedSelectedIconStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }))
  const animatedUnselectedIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
  }))

  const disabledIconColor = useMemo(
    () => resolveColorFromStyle(styles.disabledIconColor),
    [styles.disabledIconColor],
  )
  const selectedIconColor = isDisabled ? disabledIconColor : onColors.iconColor
  const unselectedIconColor = isDisabled
    ? disabledIconColor
    : offColors.iconColor

  const handlePress = useCallback(() => {
    if (!isDisabled) {
      onValueChange?.(!isSelected)
    }
  }, [isDisabled, isSelected, onValueChange])

  return (
    <View style={styles.wrapper}>
      <Animated.View
        pointerEvents="none"
        style={[styles.focusRing, animatedFocusRingStyle]}
      />
      <AnimatedPressable
        {...props}
        accessibilityRole="switch"
        accessibilityState={{
          disabled: isDisabled,
          checked: isSelected,
        }}
        hitSlop={Platform.OS === 'web' ? undefined : 4}
        disabled={isDisabled}
        onPress={handlePress}
        {...handlers}
        style={[
          styles.track,
          trackColorStyle,
          trackBorderStyle,
          isDisabled
            ? isSelected
              ? styles.disabledTrackSelected
              : styles.disabledTrack
            : undefined,
          style,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.stateLayer,
            haloPositionStyle,
            haloOpacityStyle,
            haloColorStyle,
            animatedHaloStyle,
          ]}
        />
        <Animated.View
          testID="switch-thumb"
          style={[
            styles.thumbBase,
            thumbColorStyle,
            animatedThumbStyle,
            isDisabled
              ? isSelected
                ? styles.disabledThumbSelected
                : styles.disabledThumb
              : undefined,
          ]}
        >
          {selectedIcon ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.iconLayer, animatedSelectedIconStyle]}
            >
              {renderIcon(
                selectedIcon,
                { size: ICON_SIZE, color: selectedIconColor },
                iconResolver,
              )}
            </Animated.View>
          ) : null}
          {unselectedIcon ? (
            <Animated.View
              pointerEvents="none"
              style={[styles.iconLayer, animatedUnselectedIconStyle]}
            >
              {renderIcon(
                unselectedIcon,
                { size: ICON_SIZE, color: unselectedIconColor },
                iconResolver,
              )}
            </Animated.View>
          ) : null}
        </Animated.View>
      </AnimatedPressable>
    </View>
  )
}
