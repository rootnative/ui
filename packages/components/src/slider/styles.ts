import type { MaterialTheme } from '@rootnative/core'
import { alphaColor } from '@rootnative/utils'
import { StyleSheet } from 'react-native'

// Material Design 3 (expressive) slider dimensions.
// https://m3.material.io/components/sliders/specs
export const SLIDER_TRACK_HEIGHT = 16
export const SLIDER_THUMB_WIDTH = 4
// Per the MD3 expressive spec the handle NARROWS from 4 to 2 dp while pressed
// or focused.
export const SLIDER_THUMB_WIDTH_PRESSED = 2
export const SLIDER_THUMB_HEIGHT = 44
export const SLIDER_THUMB_GAP = 6
export const SLIDER_STOP_INDICATOR = 4
export const SLIDER_TICK_SIZE = 4
export const SLIDER_TOUCH_HEIGHT = 48
export const SLIDER_TRACK_CORNER_OUTER = SLIDER_TRACK_HEIGHT / 2
export const SLIDER_TRACK_CORNER_INNER = 2
export const SLIDER_LABEL_GAP = 12
// MD3 focus ring around the focused thumb.
export const SLIDER_FOCUS_RING_OFFSET = 2
export const SLIDER_FOCUS_RING_WIDTH = 3
// The ring is a pill around the focused handle, which focus narrows to 2 dp.
// Its outer edge stays inside the 6 dp gap to the track.
const SLIDER_FOCUS_RING_OUTSET =
  SLIDER_FOCUS_RING_OFFSET + SLIDER_FOCUS_RING_WIDTH
export const SLIDER_FOCUS_RING_OUTER_WIDTH =
  SLIDER_THUMB_WIDTH_PRESSED + SLIDER_FOCUS_RING_OUTSET * 2
export const SLIDER_FOCUS_RING_OUTER_HEIGHT =
  SLIDER_THUMB_HEIGHT + SLIDER_FOCUS_RING_OUTSET * 2

interface SliderColors {
  activeTrack: string
  inactiveTrack: string
  thumb: string
  // Per MD3: ticks and stop indicators on the ACTIVE segment are `onPrimary`;
  // on the inactive segment ticks are `onSurfaceVariant` while the stop
  // indicator is `primary` (the active-track color).
  tickOnActive: string
  tickOnInactive: string
  stopOnActive: string
  stopOnInactive: string
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
  const onSurface12 = alphaColor(
    theme.colors.onSurface,
    theme.stateLayer.disabledContainerOpacity,
  )
  const onSurface38 = alphaColor(
    theme.colors.onSurface,
    theme.stateLayer.disabledOpacity,
  )

  return {
    activeTrack,
    inactiveTrack,
    thumb,
    tickOnActive: theme.colors.onPrimary,
    tickOnInactive: theme.colors.onSurfaceVariant,
    stopOnActive: theme.colors.onPrimary,
    stopOnInactive: activeTrack,
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
  // MD3 value-label typography token.
  const labelTypography = theme.typography.labelLarge

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
    focusRing: {
      position: 'absolute',
      width: SLIDER_FOCUS_RING_OUTER_WIDTH,
      height: SLIDER_FOCUS_RING_OUTER_HEIGHT,
      borderRadius: SLIDER_FOCUS_RING_OUTER_WIDTH / 2,
      top: (SLIDER_TOUCH_HEIGHT - SLIDER_FOCUS_RING_OUTER_HEIGHT) / 2,
      borderWidth: SLIDER_FOCUS_RING_WIDTH,
      borderColor: theme.colors.secondary,
    },
    pressableWrapper: {
      flex: 1,
    },
    // The screen reader and keyboard target of one thumb in range mode: a
    // 48dp square around the thumb, so a screen reader frames the thumb and
    // not the whole track. It draws nothing.
    thumbControl: {
      position: 'absolute',
      top: 0,
      width: SLIDER_TOUCH_HEIGHT,
      height: SLIDER_TOUCH_HEIGHT,
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
      backgroundColor: c.stopOnActive,
    },
    stopOnInactive: {
      backgroundColor: c.stopOnInactive,
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
