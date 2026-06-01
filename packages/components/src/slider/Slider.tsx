import { useIconResolver, useTheme } from '@rootnative/core'
import { isFocusVisible, renderIcon } from '@rootnative/utils'
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type {
  AccessibilityActionEvent,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native'
import { I18nManager, PanResponder, Pressable, View } from 'react-native'
import {
  Easing,
  cancelAnimation,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import {
  clamp,
  computeSegments,
  defaultFormat,
  snapToStep,
  type ThumbId,
} from './geometry'
import {
  FocusRingSlot,
  SegmentSlot,
  StateLayerSlot,
  StopIndicatorSlot,
  ThumbSlot,
  TickSlot,
  ValueLabelSlot,
} from './slots'
import {
  SLIDER_THUMB_WIDTH,
  SLIDER_TRACK_CORNER_INNER,
  SLIDER_TRACK_CORNER_OUTER,
  createStyles,
} from './styles'
import type { SliderProps, SliderValue } from './types'

// RN-Web's Pressable forwards `onKeyDown` to the underlying DOM element, but
// the upstream `PressableProps` type doesn't include it. Augmenting locally
// keeps the prop typed at the call site without an `as object` cast.
declare module 'react-native' {
  interface PressableProps {
    onKeyDown?: (event: { nativeEvent: { key?: string } }) => void
  }
}

const ICON_SIZE = 18

// MD3 expressive motion.
//   - Size/translate transitions ride an emphasized spring (slight overshoot,
//     ~0.85 damping ratio) — matches the same TOGGLE_SPRING used by Switch.
//   - Opacity transitions use `theme.motion` duration tokens (short3/short4)
//     with the emphasized cubic-bezier easing per the M3 motion spec.
const PRESS_SPRING = { damping: 33, stiffness: 380, mass: 1 }
const EMPHASIZED_EASING = Easing.bezier(0.2, 0, 0, 1)

const ACCESSIBILITY_ACTIONS = [
  { name: 'increment' as const },
  { name: 'decrement' as const },
]

export function Slider({
  value: controlledValue,
  defaultValue,
  onValueChange,
  onSlidingComplete,
  minimumValue = 0,
  maximumValue = 1,
  step = 0,
  centered = false,
  showTickMarks,
  showValueLabel = true,
  formatValueLabel,
  startIcon,
  endIcon,
  containerColor,
  contentColor,
  inactiveTrackColor,
  disabled = false,
  style,
  accessibilityLabel,
  ...rest
}: SliderProps) {
  const theme = useTheme()
  const iconResolver = useIconResolver()
  const styles = useMemo(
    () => createStyles(theme, containerColor, contentColor, inactiveTrackColor),
    [theme, containerColor, contentColor, inactiveTrackColor],
  )

  const labelTiming = useMemo(
    () => ({
      duration: theme.motion.durationShort4,
      easing: EMPHASIZED_EASING,
    }),
    [theme],
  )
  const stateLayerTiming = useMemo(
    () => ({
      duration: theme.motion.durationShort3,
      easing: EMPHASIZED_EASING,
    }),
    [theme],
  )
  const focusRingTiming = useMemo(
    () => ({
      duration: theme.motion.durationShort4,
      easing: EMPHASIZED_EASING,
    }),
    [theme],
  )

  const isRange = Array.isArray(controlledValue) || Array.isArray(defaultValue)
  const isDisabled = Boolean(disabled)
  const isRTL = I18nManager.isRTL

  const initialValue = useMemo<SliderValue>(() => {
    if (defaultValue !== undefined) return defaultValue
    if (controlledValue !== undefined) return controlledValue
    return isRange
      ? ([minimumValue, maximumValue] as [number, number])
      : minimumValue
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [internalValue, setInternalValue] = useState<SliderValue>(initialValue)
  const value = controlledValue ?? internalValue

  const valueRef = useRef<SliderValue>(value)
  useEffect(() => {
    valueRef.current = value
  }, [value])

  const [trackWidth, setTrackWidth] = useState(0)
  const trackWidthRef = useRef(0)
  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    trackWidthRef.current = w
    setTrackWidth(w)
  }, [])

  const [activeThumb, setActiveThumb] = useState<ThumbId | null>(null)
  const activeThumbRef = useRef<ThumbId | null>(null)

  const [labelWidths, setLabelWidths] = useState<{ low: number; high: number }>(
    { low: 0, high: 0 },
  )
  const onLowLabelLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    setLabelWidths((s) => (s.low === w ? s : { ...s, low: w }))
  }, [])
  const onHighLabelLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width
    setLabelWidths((s) => (s.high === w ? s : { ...s, high: w }))
  }, [])

  const range = Math.max(maximumValue - minimumValue, 1e-9)

  // MD3: at min/max the thumb's REST shape should be flush with the track
  // edge, not overhanging it. Inset the value-to-pixel mapping by the rest
  // half-width on both sides so a thumb at min has its left edge at x=0.
  // The press-state narrowing (4 → 2 dp) shrinks on-center, so it never
  // extends past the track edges.
  const THUMB_INSET = SLIDER_THUMB_WIDTH / 2

  const valueToPosition = useCallback(
    (v: number) => {
      const ratio = (v - minimumValue) / range
      const usable = Math.max(0, trackWidth - 2 * THUMB_INSET)
      const px = THUMB_INSET + ratio * usable
      return isRTL ? trackWidth - px : px
    },
    [THUMB_INSET, minimumValue, range, trackWidth, isRTL],
  )

  const positionToValue = useCallback(
    (px: number) => {
      const w = trackWidthRef.current || 1
      const adjusted = isRTL ? w - px : px
      const usable = Math.max(1, w - 2 * THUMB_INSET)
      const ratio = clamp((adjusted - THUMB_INSET) / usable, 0, 1)
      const raw = minimumValue + ratio * range
      return clamp(
        snapToStep(raw, step, minimumValue),
        minimumValue,
        maximumValue,
      )
    },
    [THUMB_INSET, minimumValue, maximumValue, range, step, isRTL],
  )

  const commitValue = useCallback(
    (next: SliderValue, complete: boolean) => {
      const prev = valueRef.current
      const changed = Array.isArray(prev)
        ? !Array.isArray(next) || prev[0] !== next[0] || prev[1] !== next[1]
        : prev !== next

      if (changed) {
        if (controlledValue === undefined) {
          setInternalValue(next)
        }
        valueRef.current = next
        onValueChange?.(next)
      }
      if (complete) onSlidingComplete?.(next)
    },
    [controlledValue, onValueChange, onSlidingComplete],
  )

  // Stash the latest commit / position-mapping callbacks behind refs so the
  // PanResponder isn't rebuilt mid-gesture when a parent re-renders with a new
  // `onValueChange` identity (common when consumers pass inline arrows). RN's
  // gesture system holds state on the responder instance — recreating it
  // mid-gesture can drop subsequent move events.
  const positionToValueRef = useRef(positionToValue)
  useEffect(() => {
    positionToValueRef.current = positionToValue
  }, [positionToValue])
  const commitRef = useRef(commitValue)
  useEffect(() => {
    commitRef.current = commitValue
  }, [commitValue])

  const handleTouch = useCallback((locationX: number, complete: boolean) => {
    const v = positionToValueRef.current(locationX)
    const current = valueRef.current

    if (Array.isArray(current)) {
      const [low, high] = current
      let which = activeThumbRef.current
      if (!which) {
        which = Math.abs(v - low) <= Math.abs(v - high) ? 'low' : 'high'
        activeThumbRef.current = which
        setActiveThumb(which)
      }
      const next: [number, number] =
        which === 'low' ? [Math.min(v, high), high] : [low, Math.max(v, low)]
      commitRef.current(next, complete)
    } else {
      if (!activeThumbRef.current) {
        activeThumbRef.current = 'low'
        setActiveThumb('low')
      }
      commitRef.current(v, complete)
    }
  }, [])

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !isDisabled,
        onStartShouldSetPanResponderCapture: () => !isDisabled,
        onMoveShouldSetPanResponder: () => !isDisabled,
        onMoveShouldSetPanResponderCapture: () => !isDisabled,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e: GestureResponderEvent) => {
          handleTouch(e.nativeEvent.locationX, false)
        },
        onPanResponderMove: (e: GestureResponderEvent) => {
          handleTouch(e.nativeEvent.locationX, false)
        },
        onPanResponderRelease: (e: GestureResponderEvent) => {
          handleTouch(e.nativeEvent.locationX, true)
          activeThumbRef.current = null
          setActiveThumb(null)
        },
        onPanResponderTerminate: () => {
          activeThumbRef.current = null
          setActiveThumb(null)
        },
      }),
    [isDisabled, handleTouch],
  )

  const arrValue = Array.isArray(value) ? value : null
  const lowValue = arrValue ? arrValue[0] : (value as number)
  const highValue = arrValue ? arrValue[1] : (value as number)

  // Thumb pixel positions in render-space (LTR coordinates inside the track).
  const lowPos = valueToPosition(lowValue)
  const highPos = valueToPosition(highValue)
  const centerPos = trackWidth / 2

  // Press progress per thumb (0 → 1) lives on the UI thread so the thumb's
  // 4 → 2 dp narrowing can run in lockstep with the surrounding segments and
  // stop indicators that depend on the same value. Hover and focus drive the
  // same state-layer halo at lower opacities and don't affect layout.
  const lowPressed = useSharedValue(0)
  const highPressed = useSharedValue(0)
  const lowHovered = useSharedValue(0)
  const highHovered = useSharedValue(0)
  const lowFocused = useSharedValue(0)
  const highFocused = useSharedValue(0)
  const lowLabelOpacity = useSharedValue(0)
  const highLabelOpacity = useSharedValue(0)

  // Cancel any in-flight springs/timings on unmount. Reanimated GCs the
  // shared values themselves, but a mid-flight animation outliving the
  // component can keep the worklet running for a frame or two — relevant
  // when the slider unmounts mid-drag (route transition, orientation change).
  useEffect(
    () => () => {
      cancelAnimation(lowPressed)
      cancelAnimation(highPressed)
      cancelAnimation(lowHovered)
      cancelAnimation(highHovered)
      cancelAnimation(lowFocused)
      cancelAnimation(highFocused)
      cancelAnimation(lowLabelOpacity)
      cancelAnimation(highLabelOpacity)
    },
    [
      lowPressed,
      highPressed,
      lowHovered,
      highHovered,
      lowFocused,
      highFocused,
      lowLabelOpacity,
      highLabelOpacity,
    ],
  )

  // The single Pressable wrapper has one focus target. For range sliders we
  // route keyboard adjustments and focus indication to the thumb the user is
  // currently interacting with — `keyboardThumb`. It defaults to 'low', flips
  // to whichever thumb pan-gestured last, and can be toggled with Enter/Space.
  const [keyboardThumb, setKeyboardThumb] = useState<ThumbId>('low')
  const isHovered = useRef(false)
  const isFocused = useRef(false)

  useEffect(() => {
    if (activeThumb) setKeyboardThumb(activeThumb)
  }, [activeThumb])

  useEffect(() => {
    lowPressed.value = withSpring(activeThumb === 'low' ? 1 : 0, PRESS_SPRING)
  }, [activeThumb, lowPressed])

  useEffect(() => {
    highPressed.value = withSpring(activeThumb === 'high' ? 1 : 0, PRESS_SPRING)
  }, [activeThumb, highPressed])

  // Tick marks (discrete only). `showTickMarks` defaults to true when step>0.
  const ticksEnabled = showTickMarks ?? (Boolean(step) && step > 0)

  // Track segment specs. Geometry is rest-time only; the worklet adds press
  // shifts based on shared values. Segment KIND/COUNT still depends on JS
  // state (value, centered, range) because corners and stop placement change
  // with configuration — but pixel positions interpolate on the UI thread.
  // Stop indicators are suppressed when ticks are visible: the first/last
  // tick already mark the track ends, and per MD3 the two are mutually
  // exclusive.
  const segments = useMemo(
    () =>
      computeSegments({
        trackWidth,
        lowPos,
        highPos,
        centerPos,
        isRange: arrValue !== null,
        centered,
        isRTL,
        showStopIndicators: !ticksEnabled,
        outerCorner: SLIDER_TRACK_CORNER_OUTER,
        innerCorner: SLIDER_TRACK_CORNER_INNER,
      }),
    [
      arrValue,
      centered,
      centerPos,
      highPos,
      isRTL,
      lowPos,
      ticksEnabled,
      trackWidth,
    ],
  )
  const tickValues = useMemo(() => {
    if (!ticksEnabled || !step || step <= 0) return [] as number[]
    const out: number[] = []
    const tolerance = step / 2
    for (let v = minimumValue; v <= maximumValue + tolerance; v += step) {
      out.push(Math.min(v, maximumValue))
    }
    return out
  }, [ticksEnabled, step, minimumValue, maximumValue])

  const isTickActive = useCallback(
    (tickV: number) => {
      if (arrValue) {
        return (
          tickV >= Math.min(lowValue, highValue) &&
          tickV <= Math.max(lowValue, highValue)
        )
      }
      if (centered) {
        const mid = (minimumValue + maximumValue) / 2
        return (
          (tickV >= mid && tickV <= lowValue) ||
          (tickV <= mid && tickV >= lowValue)
        )
      }
      return tickV <= lowValue
    },
    [arrValue, lowValue, highValue, centered, minimumValue, maximumValue],
  )

  const formatLabel =
    formatValueLabel ?? ((v: number) => defaultFormat(v, step))

  const labelMode = showValueLabel
  const showLowLabel =
    !isDisabled &&
    (labelMode === 'always' || (labelMode === true && activeThumb === 'low'))
  const showHighLabel =
    !isDisabled &&
    arrValue !== null &&
    (labelMode === 'always' || (labelMode === true && activeThumb === 'high'))

  useEffect(() => {
    lowLabelOpacity.value = withTiming(showLowLabel ? 1 : 0, labelTiming)
  }, [showLowLabel, lowLabelOpacity, labelTiming])

  useEffect(() => {
    highLabelOpacity.value = withTiming(showHighLabel ? 1 : 0, labelTiming)
  }, [showHighLabel, highLabelOpacity, labelTiming])

  // Hover/focus indicator routing: only the keyboardThumb shows the halo
  // (single-thumb mode → always 'low'; range mode → most-recent thumb).
  useEffect(() => {
    const lowOn = isHovered.current && keyboardThumb === 'low' && !isDisabled
    const highOn = isHovered.current && keyboardThumb === 'high' && !isDisabled
    lowHovered.value = withTiming(lowOn ? 1 : 0, stateLayerTiming)
    highHovered.value = withTiming(highOn ? 1 : 0, stateLayerTiming)
  }, [keyboardThumb, isDisabled, lowHovered, highHovered, stateLayerTiming])

  useEffect(() => {
    const lowOn = isFocused.current && keyboardThumb === 'low' && !isDisabled
    const highOn = isFocused.current && keyboardThumb === 'high' && !isDisabled
    lowFocused.value = withTiming(lowOn ? 1 : 0, focusRingTiming)
    highFocused.value = withTiming(highOn ? 1 : 0, focusRingTiming)
  }, [keyboardThumb, isDisabled, lowFocused, highFocused, focusRingTiming])

  // Keyboard / a11y action step. For continuous sliders, MD3 spec calls for
  // ~1 % of the range per arrow tap; for discrete sliders, one step.
  const keyStep = step > 0 ? step : range / 100

  const adjustValue = useCallback(
    (delta: number) => {
      const current = valueRef.current
      if (Array.isArray(current)) {
        const [low, high] = current
        if (keyboardThumb === 'low') {
          const next = clamp(
            snapToStep(low + delta, step, minimumValue),
            minimumValue,
            maximumValue,
          )
          commitValue([Math.min(next, high), high], true)
        } else {
          const next = clamp(
            snapToStep(high + delta, step, minimumValue),
            minimumValue,
            maximumValue,
          )
          commitValue([low, Math.max(next, low)], true)
        }
      } else {
        const next = clamp(
          snapToStep((current as number) + delta, step, minimumValue),
          minimumValue,
          maximumValue,
        )
        commitValue(next, true)
      }
    },
    [commitValue, keyboardThumb, maximumValue, minimumValue, step],
  )

  const handleHoverIn = useCallback(() => {
    if (isDisabled) return
    isHovered.current = true
    if (keyboardThumb === 'low') {
      lowHovered.value = withTiming(1, stateLayerTiming)
    } else {
      highHovered.value = withTiming(1, stateLayerTiming)
    }
  }, [isDisabled, keyboardThumb, lowHovered, highHovered, stateLayerTiming])

  const handleHoverOut = useCallback(() => {
    isHovered.current = false
    lowHovered.value = withTiming(0, stateLayerTiming)
    highHovered.value = withTiming(0, stateLayerTiming)
  }, [lowHovered, highHovered, stateLayerTiming])

  const handleFocus = useCallback(() => {
    if (isDisabled || !isFocusVisible()) return
    isFocused.current = true
    if (keyboardThumb === 'low') {
      lowFocused.value = withTiming(1, focusRingTiming)
    } else {
      highFocused.value = withTiming(1, focusRingTiming)
    }
  }, [isDisabled, keyboardThumb, lowFocused, highFocused, focusRingTiming])

  const handleBlur = useCallback(() => {
    isFocused.current = false
    lowFocused.value = withTiming(0, focusRingTiming)
    highFocused.value = withTiming(0, focusRingTiming)
  }, [lowFocused, highFocused, focusRingTiming])

  const handleAccessibilityAction = useCallback(
    (e: AccessibilityActionEvent) => {
      if (isDisabled) return
      if (e.nativeEvent.actionName === 'increment') {
        adjustValue(isRTL ? -keyStep : keyStep)
      } else if (e.nativeEvent.actionName === 'decrement') {
        adjustValue(isRTL ? keyStep : -keyStep)
      }
    },
    [adjustValue, isDisabled, isRTL, keyStep],
  )

  // Web keyboard support. RN web forwards onKeyDown on Pressable to the
  // underlying DOM element; native platforms ignore it (a11y actions cover
  // VoiceOver/TalkBack adjustments).
  const handleKeyDown = useCallback(
    (e: { nativeEvent: { key?: string } }) => {
      if (isDisabled) return
      const key = e.nativeEvent.key
      if (!key) return
      const bigStep = Math.max(keyStep * 10, range / 10)
      switch (key) {
        case 'ArrowRight':
          adjustValue(isRTL ? -keyStep : keyStep)
          break
        case 'ArrowLeft':
          adjustValue(isRTL ? keyStep : -keyStep)
          break
        case 'ArrowUp':
          adjustValue(keyStep)
          break
        case 'ArrowDown':
          adjustValue(-keyStep)
          break
        case 'PageUp':
          adjustValue(bigStep)
          break
        case 'PageDown':
          adjustValue(-bigStep)
          break
        case 'Home':
          commitValue(
            arrValue
              ? keyboardThumb === 'low'
                ? [minimumValue, arrValue[1]]
                : [arrValue[0], Math.max(minimumValue, arrValue[0])]
              : minimumValue,
            true,
          )
          break
        case 'End':
          commitValue(
            arrValue
              ? keyboardThumb === 'low'
                ? [Math.min(maximumValue, arrValue[1]), arrValue[1]]
                : [arrValue[0], maximumValue]
              : maximumValue,
            true,
          )
          break
        case 'Enter':
        case ' ':
          // Toggle which thumb the keyboard adjusts in range mode. No-op for
          // single-thumb sliders.
          if (arrValue) {
            setKeyboardThumb((t) => (t === 'low' ? 'high' : 'low'))
          }
          break
      }
    },
    [
      adjustValue,
      arrValue,
      commitValue,
      isDisabled,
      isRTL,
      keyStep,
      keyboardThumb,
      maximumValue,
      minimumValue,
      range,
    ],
  )

  const accessibilityValue = arrValue
    ? {
        min: Math.round(minimumValue),
        max: Math.round(maximumValue),
        now: Math.round(arrValue[0]),
        text: `${formatLabel(arrValue[0])} to ${formatLabel(arrValue[1])}`,
      }
    : {
        min: Math.round(minimumValue),
        max: Math.round(maximumValue),
        now: Math.round(lowValue),
        text: formatLabel(lowValue),
      }

  return (
    <View {...rest} style={[styles.root, style]}>
      {startIcon ? (
        <View style={styles.decoration}>
          {renderIcon(
            startIcon,
            {
              size: ICON_SIZE,
              color: isDisabled
                ? styles.disabledThumb.backgroundColor
                : styles.decorationIconColor.color,
            },
            iconResolver,
          )}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: isDisabled }}
        accessibilityValue={accessibilityValue}
        accessibilityActions={ACCESSIBILITY_ACTIONS}
        onAccessibilityAction={handleAccessibilityAction}
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onFocus={handleFocus}
        onBlur={handleBlur}
        // Web only: arrow / Page / Home / End / Enter handling. Native ignores
        // the prop because RN's Pressable doesn't dispatch onKeyDown there.
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        style={styles.pressableWrapper}
      >
        <View
          {...panResponder.panHandlers}
          onLayout={onTrackLayout}
          style={styles.trackArea}
        >
          {segments.map((seg, i) => {
            const baseStyle =
              seg.kind === 'active'
                ? styles.activeSegment
                : styles.inactiveSegment
            const disabledStyle = isDisabled
              ? seg.kind === 'active'
                ? styles.disabledActiveSegment
                : styles.disabledInactiveSegment
              : undefined
            return (
              <Fragment key={`seg-${i}`}>
                <SegmentSlot
                  segment={seg}
                  lowPressed={lowPressed}
                  highPressed={highPressed}
                  baseStyle={baseStyle}
                  kindStyle={baseStyle}
                  disabledStyle={disabledStyle}
                />
                {seg.stopAt ? (
                  <StopIndicatorSlot
                    segment={seg}
                    lowPressed={lowPressed}
                    highPressed={highPressed}
                    baseStyle={styles.stopIndicator}
                    kindStyle={
                      seg.kind === 'active'
                        ? styles.stopOnActive
                        : styles.stopOnInactive
                    }
                    disabledStyle={isDisabled ? styles.disabledTick : undefined}
                  />
                ) : null}
              </Fragment>
            )
          })}

          {tickValues.map((tickV, i) => {
            const cx = valueToPosition(tickV)
            const active = isTickActive(tickV)
            return (
              <TickSlot
                key={`tick-${i}`}
                cx={cx}
                lowPos={lowPos}
                highPos={highPos}
                hasHigh={arrValue !== null}
                lowPressed={lowPressed}
                highPressed={highPressed}
                baseStyle={active ? styles.tickActive : styles.tickInactive}
                disabledStyle={isDisabled ? styles.disabledTick : undefined}
              />
            )
          })}

          {!isDisabled ? (
            <FocusRingSlot
              centerX={lowPos}
              focused={lowFocused}
              baseStyle={styles.focusRing}
            />
          ) : null}
          {!isDisabled && arrValue ? (
            <FocusRingSlot
              centerX={highPos}
              focused={highFocused}
              baseStyle={styles.focusRing}
            />
          ) : null}

          {!isDisabled ? (
            <StateLayerSlot
              centerX={lowPos}
              hovered={lowHovered}
              focused={lowFocused}
              pressed={lowPressed}
              baseStyle={styles.stateLayer}
            />
          ) : null}
          {!isDisabled && arrValue ? (
            <StateLayerSlot
              centerX={highPos}
              hovered={highHovered}
              focused={highFocused}
              pressed={highPressed}
              baseStyle={styles.stateLayer}
            />
          ) : null}

          <ThumbSlot
            thumbId="low"
            centerX={lowPos}
            pressed={lowPressed}
            baseStyle={styles.thumb}
            disabledStyle={isDisabled ? styles.disabledThumb : undefined}
          />
          {arrValue ? (
            <ThumbSlot
              thumbId="high"
              centerX={highPos}
              pressed={highPressed}
              baseStyle={styles.thumb}
              disabledStyle={isDisabled ? styles.disabledThumb : undefined}
            />
          ) : null}

          {labelMode !== false ? (
            <ValueLabelSlot
              centerX={lowPos}
              labelWidth={labelWidths.low}
              opacity={lowLabelOpacity}
              onLayout={onLowLabelLayout}
              baseStyle={styles.valueLabel}
              textStyle={styles.valueLabelText}
              text={formatLabel(lowValue)}
            />
          ) : null}
          {labelMode !== false && arrValue ? (
            <ValueLabelSlot
              centerX={highPos}
              labelWidth={labelWidths.high}
              opacity={highLabelOpacity}
              onLayout={onHighLabelLayout}
              baseStyle={styles.valueLabel}
              textStyle={styles.valueLabelText}
              text={formatLabel(highValue)}
            />
          ) : null}
        </View>
      </Pressable>

      {endIcon ? (
        <View style={styles.decoration}>
          {renderIcon(
            endIcon,
            {
              size: ICON_SIZE,
              color: isDisabled
                ? styles.disabledThumb.backgroundColor
                : styles.decorationIconColor.color,
            },
            iconResolver,
          )}
        </View>
      ) : null}
    </View>
  )
}
