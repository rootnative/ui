import { useIconResolver } from '@rootnative/core'
import {
  useAnimation,
  useColorTransition,
  useInterpolatedStyle,
} from '@rootnative/inertia'
import { Animated, useAnimatedStyle } from '@rootnative/inertia/reanimated'
import {
  isRTLDirection,
  renderIcon,
  resolveColorFromStyle,
  resolveLogicalKey,
} from '@rootnative/utils'
import { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { AnimatedPressable } from '../internal/AnimatedPressable'
import { composeHandlers } from '../internal/composeHandlers'
import { webOutlineReset } from '../internal/focusOutline'
import {
  isPassiveControl,
  passiveControlProps,
} from '../internal/passiveControl'
import { pointerEvents } from '../internal/pointerEvents'
import { splitLayoutStyle } from '../internal/splitLayoutStyle'
import { getDefaultHitSlop } from '../internal/touchTarget'
import { useBooleanProgress } from '../internal/useBooleanProgress'
import { useHaloLayer } from '../internal/useHaloLayer'
import { useMaterialTheme } from '../internal/useMaterialTheme'
import { composePressHandlers } from '../internal/usePressMorph'
import {
  SWITCH_STATE_LAYER_SIZE,
  SWITCH_THUMB_OFF_SIZE,
  SWITCH_THUMB_ON_SIZE,
  SWITCH_THUMB_PRESSED_SIZE,
  SWITCH_TRACK_BORDER_WIDTH,
  SWITCH_TRACK_HEIGHT,
  SWITCH_TRACK_WIDTH,
  createStyles,
  getResolvedColors,
} from './styles'
import type { SwitchProps } from './types'

// MD3 places the thumb by its center, 16 dp from the start edge when off and
// 36 dp when on, so each size (16, 24, pressed 28) keeps the same center.
const THUMB_CENTER_OFF = SWITCH_TRACK_HEIGHT / 2
const THUMB_TRAVEL = SWITCH_TRACK_WIDTH - SWITCH_TRACK_HEIGHT

const ICON_SIZE = 16

export function Switch({
  style,
  value,
  defaultValue = false,
  onValueChange,
  selectedIcon,
  unselectedIcon,
  containerColor,
  contentColor,
  disabled = false,
  hitSlop,
  ...props
}: SwitchProps) {
  const isDisabled = Boolean(disabled)
  // Controlled when `value` is passed, self-managing otherwise — the same
  // idiom as Tabs / NavigationBar / ButtonGroup / Slider.
  const isControlled = value !== undefined
  const [selfValue, setSelfValue] = useState(() => Boolean(defaultValue))
  const isSelected = isControlled ? Boolean(value) : selfValue
  const isPassive = isPassiveControl(isControlled, onValueChange, isDisabled)
  const hasUnselectedIcon = Boolean(unselectedIcon)

  const theme = useMaterialTheme()
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

  // Toggle progress — the theme's fast-spatial spring (Expressive bounce,
  // 0.6 damping ratio), driving the thumb travel per Compose's Switch.
  const progress = useBooleanProgress(isSelected, 'spring-fast-spatial')

  // The thumb rests at the start edge and `translateX` is a physical offset,
  // so in RTL it has to travel toward negative x or the thumb leaves the
  // track on the right.
  const travelSign = isRTLDirection() ? -1 : 1

  const {
    style: haloOpacityStyle,
    handlers: layerHandlers,
    focusRingStyle: animatedFocusRingStyle,
  } = useHaloLayer(isDisabled)

  const [isPressed, setIsPressed] = useState(false)
  const pressGrowHandlers = useMemo(
    () => ({
      onPressIn: () => setIsPressed(true),
      onPressOut: () => setIsPressed(false),
    }),
    [],
  )
  const handlers = useMemo(
    () => composePressHandlers(layerHandlers, pressGrowHandlers),
    [layerHandlers, pressGrowHandlers],
  )

  // A press has no matching release once the component disables mid-press —
  // drop it so re-enabling doesn't resume at the pressed size.
  if (isDisabled && isPressed) setIsPressed(false)

  // One size spring toward one target, as in Compose's Switch. A separate
  // press spring would add its undershoot to the toggle's and double the
  // size dip at the end of a toggle off.
  const restThumbSize =
    isSelected || hasUnselectedIcon
      ? SWITCH_THUMB_ON_SIZE
      : SWITCH_THUMB_OFF_SIZE
  const thumbSize = useAnimation(
    isPressed && !isDisabled ? SWITCH_THUMB_PRESSED_SIZE : restThumbSize,
    'spring-fast-spatial',
  )

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

  // Interop escape hatch: the thumb reads the toggle progress and its size
  // spring together. It is placed by its center, so a size change grows it
  // in both directions. It lays out inside the track border, so the offset
  // from the outer start edge loses the border width.
  const animatedThumbStyle = useAnimatedStyle(() => {
    'worklet'
    const size = thumbSize.value
    const center = THUMB_CENTER_OFF + progress.value * THUMB_TRAVEL
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      transform: [
        {
          translateX:
            travelSign * (center - size / 2 - SWITCH_TRACK_BORDER_WIDTH),
        },
      ],
    }
  })

  // The halo sits on the thumb's center, so only the toggle progress moves
  // it. Its `start` key comes from `resolveLogicalKey` on each render, not in
  // the memo, so it follows a runtime change of the document `dir` on the web.
  const haloStartKey = resolveLogicalKey('start')
  const haloPositionStyle = useMemo(
    () => ({
      [haloStartKey]:
        THUMB_CENTER_OFF -
        SWITCH_TRACK_BORDER_WIDTH -
        SWITCH_STATE_LAYER_SIZE / 2,
    }),
    [haloStartKey],
  )

  // The halo color crossfades with the toggle progress (same as the thumb).
  const haloColorStyle = useColorTransition(progress, [
    offColors.thumbColor,
    onColors.thumbColor,
  ])

  // `extend`, not the default clamp, keeps the halo on the thumb through the
  // spring's overshoot.
  const animatedHaloStyle = useInterpolatedStyle(
    progress,
    { translateX: [0, travelSign * THUMB_TRAVEL] },
    { extrapolate: 'extend' },
  )

  // The two icons cross-fade on one progress value: the selected icon follows
  // it, the unselected icon runs the inverted range.
  const animatedSelectedIconStyle = useInterpolatedStyle(progress, {
    opacity: [0, 1],
  })
  const animatedUnselectedIconStyle = useInterpolatedStyle(progress, {
    opacity: [1, 0],
  })

  const disabledIconColor = useMemo(
    () => resolveColorFromStyle(styles.disabledIconColor),
    [styles.disabledIconColor],
  )
  const selectedIconColor = isDisabled ? disabledIconColor : onColors.iconColor
  const unselectedIconColor = isDisabled
    ? disabledIconColor
    : offColors.iconColor

  const handlePress = useCallback(() => {
    if (isDisabled) return
    const next = !isSelected
    if (!isControlled) setSelfValue(next)
    onValueChange?.(next)
  }, [isDisabled, isSelected, isControlled, onValueChange])

  const { outer: layoutStyle, inner: trackStyle } = useMemo(
    () => splitLayoutStyle(style, { fill: false }),
    [style],
  )

  return (
    <View style={layoutStyle}>
      <View style={styles.wrapper}>
        <Animated.View
          style={[styles.focusRing, animatedFocusRingStyle, pointerEvents.none]}
        />
        <AnimatedPressable
          {...props}
          accessibilityRole="switch"
          aria-disabled={isDisabled}
          aria-checked={isSelected}
          hitSlop={
            // The track is the pressable, and MD3 makes it 32dp tall — a flat
            // 4 left the control at 40dp, under the 48dp WCAG/MD3 floor. No
            // web gate: react-native-web drops the prop, and a web runtime
            // that has `hitSlop` gets the same touch area as native.
            hitSlop ?? getDefaultHitSlop(SWITCH_TRACK_HEIGHT)
          }
          disabled={isDisabled || isPassive}
          onPress={handlePress}
          {...composeHandlers(handlers, props)}
          {...(isPassive ? passiveControlProps : undefined)}
          style={[
            styles.track,
            webOutlineReset,
            trackColorStyle,
            trackBorderStyle,
            isDisabled
              ? isSelected
                ? styles.disabledTrackSelected
                : styles.disabledTrack
              : undefined,
            trackStyle,
            isPassive ? pointerEvents.none : undefined,
          ]}
        >
          <Animated.View
            style={[
              styles.stateLayer,
              haloPositionStyle,
              haloOpacityStyle,
              haloColorStyle,
              animatedHaloStyle,
              pointerEvents.none,
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
                aria-hidden
                style={[
                  styles.iconLayer,
                  animatedSelectedIconStyle,
                  pointerEvents.none,
                ]}
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
                aria-hidden
                style={[
                  styles.iconLayer,
                  animatedUnselectedIconStyle,
                  pointerEvents.none,
                ]}
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
    </View>
  )
}
