import type { MaterialTheme } from '@rootnative/core'
import { alphaColor } from '@rootnative/utils'
import { StyleSheet } from 'react-native'

// Material Design 3 (expressive) slider dimensions.
// https://m3.material.io/components/sliders/specs
//
// Spec calls for a 44dp tall thumb on a 16dp track, but because the thumb is
// the same color as the active track it visually fuses with the filled side
// and the slider reads as ~2.75× taller on the filled side. We use a 20dp
// thumb (a 2dp poke above and below the track) for a balanced look that
// still keeps the thumb clearly grabbable.
export const SLIDER_TRACK_HEIGHT = 16
export const SLIDER_THUMB_WIDTH = 4
export const SLIDER_THUMB_WIDTH_PRESSED = 16
export const SLIDER_THUMB_HEIGHT = 20
export const SLIDER_THUMB_GAP = 6
export const SLIDER_STOP_INDICATOR = 4
export const SLIDER_TICK_SIZE = 4
export const SLIDER_TOUCH_HEIGHT = 48
export const SLIDER_TRACK_CORNER_OUTER = SLIDER_TRACK_HEIGHT / 2
export const SLIDER_TRACK_CORNER_INNER = 2
export const SLIDER_LABEL_GAP = 12
// MD3 state-layer halo around the thumb during hover/focus/press.
export const SLIDER_STATE_LAYER_SIZE = 40
// MD3 focus ring around the focused thumb.
export const SLIDER_FOCUS_RING_OFFSET = 2
export const SLIDER_FOCUS_RING_WIDTH = 3
// Outside diameter of the ring — used by the JSX layer to size the absolute
// positioned ring around the (pressed) thumb's center.
export const SLIDER_FOCUS_RING_SIZE =
  SLIDER_THUMB_WIDTH_PRESSED +
  (SLIDER_FOCUS_RING_OFFSET + SLIDER_FOCUS_RING_WIDTH) * 2

interface SliderColors {
  activeTrack: string
  inactiveTrack: string
  thumb: string
  // Per MD3, ticks/stop indicators use the OPPOSITE color of the segment
  // they sit on for contrast.
  tickOnActive: string
  tickOnInactive: string
  valueLabel: string
  onValueLabel: string
  decoration: string
  disabledTrack: string
  disabledActiveTrack: string
  disabledThumb: string
  disabledTick: string
}

function getColors(
  theme: MaterialTheme,
  containerColor?: string,
  contentColor?: string,
  inactiveTrackColor?: string,
): SliderColors {
  const activeTrack = containerColor ?? theme.colors.primary
  const thumb = contentColor ?? theme.colors.primary
  const inactiveTrack =
    inactiveTrackColor ?? theme.colors.surfaceContainerHighest
  const onSurface12 = alphaColor(theme.colors.onSurface, 0.12)
  const onSurface38 = alphaColor(theme.colors.onSurface, 0.38)

  return {
    activeTrack,
    inactiveTrack,
    thumb,
    tickOnActive: inactiveTrack,
    tickOnInactive: activeTrack,
    valueLabel: theme.colors.inverseSurface,
    onValueLabel: theme.colors.inverseOnSurface,
    decoration: theme.colors.onSurfaceVariant,
    disabledTrack: onSurface12,
    disabledActiveTrack: onSurface38,
    disabledThumb: onSurface38,
    disabledTick: onSurface38,
  }
}

export function createStyles(
  theme: MaterialTheme,
  containerColor?: string,
  contentColor?: string,
  inactiveTrackColor?: string,
) {
  const c = getColors(theme, containerColor, contentColor, inactiveTrackColor)
  const labelTypography = theme.typography.labelMedium

  return StyleSheet.create({
    root: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    decoration: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    trackArea: {
      height: SLIDER_TOUCH_HEIGHT,
      justifyContent: 'center',
      // Cross-axis stretch (default) fills the parent Pressable's width.
    },
    activeSegment: {
      position: 'absolute',
      height: SLIDER_TRACK_HEIGHT,
      top: (SLIDER_TOUCH_HEIGHT - SLIDER_TRACK_HEIGHT) / 2,
      backgroundColor: c.activeTrack,
    },
    inactiveSegment: {
      position: 'absolute',
      height: SLIDER_TRACK_HEIGHT,
      top: (SLIDER_TOUCH_HEIGHT - SLIDER_TRACK_HEIGHT) / 2,
      backgroundColor: c.inactiveTrack,
    },
    thumb: {
      position: 'absolute',
      height: SLIDER_THUMB_HEIGHT,
      top: (SLIDER_TOUCH_HEIGHT - SLIDER_THUMB_HEIGHT) / 2,
      backgroundColor: c.thumb,
    },
    stateLayer: {
      position: 'absolute',
      width: SLIDER_STATE_LAYER_SIZE,
      height: SLIDER_STATE_LAYER_SIZE,
      borderRadius: SLIDER_STATE_LAYER_SIZE / 2,
      top: (SLIDER_TOUCH_HEIGHT - SLIDER_STATE_LAYER_SIZE) / 2,
      backgroundColor: c.thumb,
    },
    focusRing: {
      position: 'absolute',
      width: SLIDER_FOCUS_RING_SIZE,
      height: SLIDER_FOCUS_RING_SIZE,
      borderRadius: SLIDER_FOCUS_RING_SIZE / 2,
      top: (SLIDER_TOUCH_HEIGHT - SLIDER_FOCUS_RING_SIZE) / 2,
      borderWidth: SLIDER_FOCUS_RING_WIDTH,
      borderColor: theme.colors.secondary,
    },
    pressableWrapper: {
      flex: 1,
    },
    stopIndicator: {
      position: 'absolute',
      width: SLIDER_STOP_INDICATOR,
      height: SLIDER_STOP_INDICATOR,
      top: (SLIDER_TOUCH_HEIGHT - SLIDER_STOP_INDICATOR) / 2,
      borderRadius: SLIDER_STOP_INDICATOR / 2,
    },
    tickActive: {
      position: 'absolute',
      width: SLIDER_TICK_SIZE,
      height: SLIDER_TICK_SIZE,
      top: (SLIDER_TOUCH_HEIGHT - SLIDER_TICK_SIZE) / 2,
      borderRadius: SLIDER_TICK_SIZE / 2,
      backgroundColor: c.tickOnActive,
    },
    tickInactive: {
      position: 'absolute',
      width: SLIDER_TICK_SIZE,
      height: SLIDER_TICK_SIZE,
      top: (SLIDER_TOUCH_HEIGHT - SLIDER_TICK_SIZE) / 2,
      borderRadius: SLIDER_TICK_SIZE / 2,
      backgroundColor: c.tickOnInactive,
    },
    stopOnActive: {
      backgroundColor: c.tickOnActive,
    },
    stopOnInactive: {
      backgroundColor: c.tickOnInactive,
    },
    valueLabel: {
      position: 'absolute',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.shape.cornerFull,
      backgroundColor: c.valueLabel,
      bottom:
        SLIDER_TOUCH_HEIGHT / 2 + SLIDER_THUMB_HEIGHT / 2 + SLIDER_LABEL_GAP,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 32,
    },
    valueLabelText: {
      fontFamily: labelTypography.fontFamily,
      fontSize: labelTypography.fontSize,
      fontWeight: labelTypography.fontWeight,
      lineHeight: labelTypography.lineHeight,
      letterSpacing: labelTypography.letterSpacing,
      color: c.onValueLabel,
      textAlign: 'center',
    },
    decorationIconColor: {
      color: c.decoration,
    },
    disabledActiveSegment: {
      backgroundColor: c.disabledActiveTrack,
    },
    disabledInactiveSegment: {
      backgroundColor: c.disabledTrack,
    },
    disabledThumb: {
      backgroundColor: c.disabledThumb,
    },
    disabledTick: {
      backgroundColor: c.disabledTick,
    },
  })
}
