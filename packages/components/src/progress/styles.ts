import type { MaterialTheme } from '@rootnative/core'
import { StyleSheet } from 'react-native'

// Material Design 3 (expressive) progress indicator dimensions.
// Circular: 48dp container with a 4dp stroke.
// https://m3.material.io/components/progress-indicators/specs
export const PROGRESS_TRACK_HEIGHT = 4
export const PROGRESS_TRACK_GAP = 4
export const PROGRESS_STOP_INDICATOR = 4
export const PROGRESS_CIRCULAR_SIZE = 48
export const PROGRESS_CIRCULAR_STROKE = 4
// Wavy (MD3 Expressive) geometry. The linear wave peaks 3dp each side of
// the track, so the 4dp bar becomes a 10dp container. The circular wave
// peaks 2dp each side, inside the same 48dp container.
export const PROGRESS_LINEAR_WAVE_AMPLITUDE = 3
export const PROGRESS_LINEAR_WAVELENGTH = 40
export const PROGRESS_LINEAR_INDETERMINATE_WAVELENGTH = 20
export const PROGRESS_CIRCULAR_WAVE_AMPLITUDE = 2
export const PROGRESS_CIRCULAR_WAVELENGTH = 20
// Wave travel: one wavelength per second, at constant speed.
export const PROGRESS_WAVE_PERIOD_MS = 1000
// The wave is flat at the ends of the range, so a nearly empty or nearly
// full indicator reads as a plain bar.
export const PROGRESS_WAVE_FLAT_BELOW = 0.1
export const PROGRESS_WAVE_FLAT_ABOVE = 0.95

interface ProgressColors {
  indicator: string
  track: string
}

export function getProgressColors(
  theme: MaterialTheme,
  containerColor?: string,
  contentColor?: string,
): ProgressColors {
  return {
    indicator: contentColor ?? theme.colors.primary,
    track: containerColor ?? theme.colors.secondaryContainer,
  }
}

export function createLinearStyles(
  theme: MaterialTheme,
  thickness: number,
  containerColor?: string,
  contentColor?: string,
  wavy = false,
) {
  const c = getProgressColors(theme, containerColor, contentColor)
  const radius = thickness / 2
  const amplitude = wavy ? PROGRESS_LINEAR_WAVE_AMPLITUDE : 0
  const height = thickness + amplitude * 2

  return StyleSheet.create({
    root: {
      height,
      width: '100%',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    activeIndicator: {
      position: 'absolute',
      top: amplitude,
      height: thickness,
      borderRadius: radius,
      backgroundColor: c.indicator,
    },
    inactiveTrack: {
      position: 'absolute',
      top: amplitude,
      height: thickness,
      borderRadius: radius,
      backgroundColor: c.track,
    },
    inactiveTrackFull: {
      position: 'absolute',
      top: amplitude,
      left: 0,
      right: 0,
      height: thickness,
      borderRadius: radius,
      backgroundColor: c.track,
    },
    wave: {
      position: 'absolute',
      top: 0,
      left: 0,
    },
    stopDot: {
      position: 'absolute',
      width: PROGRESS_STOP_INDICATOR,
      height: PROGRESS_STOP_INDICATOR,
      borderRadius: PROGRESS_STOP_INDICATOR / 2,
      backgroundColor: c.indicator,
    },
  })
}

export function createCircularStyles(size: number) {
  return StyleSheet.create({
    root: {
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
}
