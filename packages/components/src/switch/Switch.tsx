import { useIconResolver, useTheme } from '@rootnative/core'
import {
  isFocusVisible,
  renderIcon,
  resolveColorFromStyle,
} from '@rootnative/utils'
import { useCallback, useEffect, useMemo } from 'react'
import { Platform, Pressable, View } from 'react-native'
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
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

// MD3 state-layer opacity tokens.
const HOVER_OPACITY = 0.08
const FOCUS_OPACITY = 0.1
const PRESS_OPACITY = 0.1

// MD3 emphasized spring for the toggle (slight overshoot, ~0.85 damping ratio).
const TOGGLE_SPRING = {
  damping: 33,
  stiffness: 380,
  mass: 1,
}

// Press in/out uses a fast, predictable timing curve — no spring oscillation,
// so the 28 dp thumb grow is reached in full within 120 ms.
const PRESS_TIMING = { duration: 120 }
const HOVER_TIMING = { duration: 150 }
const FOCUS_TIMING = { duration: 200 }

const ICON_SIZE = 16

export function Switch({
  style,
  value = false,
  onValueChange,
  selectedIcon = 'check',
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

  const progress = useSharedValue(isSelected ? 1 : 0)
  const pressed = useSharedValue(0)
  const hovered = useSharedValue(0)
  const focused = useSharedValue(0)

  useEffect(() => {
    progress.value = withSpring(isSelected ? 1 : 0, TOGGLE_SPRING)
  }, [isSelected, progress])

  const animatedTrackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [offColors.trackColor, onColors.trackColor],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [offColors.borderColor, onColors.borderColor],
    ),
  }))

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
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [offColors.thumbColor, onColors.thumbColor],
      ),
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
  const haloLeft =
    SWITCH_TRACK_PADDING -
    SWITCH_TRACK_BORDER_WIDTH +
    offThumbSize / 2 -
    SWITCH_STATE_LAYER_SIZE / 2

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
      opacity: Math.max(
        hovered.value * HOVER_OPACITY,
        focused.value * FOCUS_OPACITY,
        pressed.value * PRESS_OPACITY,
      ),
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [offColors.thumbColor, onColors.thumbColor],
      ),
      transform: [
        {
          translateX:
            progress.value * THUMB_TRANSLATE_X + (size - offThumbSize) / 2,
        },
      ],
    }
  })

  const animatedFocusRingStyle = useAnimatedStyle(() => ({
    opacity: focused.value,
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

  const handlePressIn = useCallback(() => {
    if (!isDisabled) {
      pressed.value = withTiming(1, PRESS_TIMING)
    }
  }, [isDisabled, pressed])

  const handlePressOut = useCallback(() => {
    pressed.value = withTiming(0, PRESS_TIMING)
  }, [pressed])

  const handleHoverIn = useCallback(() => {
    if (!isDisabled) {
      hovered.value = withTiming(1, HOVER_TIMING)
    }
  }, [isDisabled, hovered])

  const handleHoverOut = useCallback(() => {
    hovered.value = withTiming(0, HOVER_TIMING)
  }, [hovered])

  // Match :focus-visible — only show focus state from keyboard navigation.
  const handleFocus = useCallback(() => {
    if (!isDisabled && isFocusVisible()) {
      focused.value = withTiming(1, FOCUS_TIMING)
    }
  }, [isDisabled, focused])

  const handleBlur = useCallback(() => {
    focused.value = withTiming(0, FOCUS_TIMING)
  }, [focused])

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
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={[
          styles.track,
          animatedTrackStyle,
          isDisabled ? styles.disabledTrack : undefined,
          style,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.stateLayer, { left: haloLeft }, animatedHaloStyle]}
        />
        <Animated.View
          style={[
            styles.thumbBase,
            animatedThumbStyle,
            isDisabled ? styles.disabledThumb : undefined,
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
