import type { MaterialTheme } from '@rootnative/core'
import { StyleSheet } from 'react-native'

// Material Design 3 (expressive) progress indicator dimensions.
// https://m3.material.io/components/progress-indicators/specs
export const PROGRESS_TRACK_HEIGHT = 4
export const PROGRESS_TRACK_GAP = 4
export const PROGRESS_STOP_INDICATOR = 4
export const PROGRESS_CIRCULAR_SIZE = 40
export const PROGRESS_CIRCULAR_STROKE = 4

interface ProgressColors {
  indicator: string
  track: string
}

export function getProgressColors(
  theme: MaterialTheme,
  containerColor?: string,
  trackColor?: string,
): ProgressColors {
  return {
    indicator: containerColor ?? theme.colors.primary,
    track: trackColor ?? theme.colors.secondaryContainer,
  }
}

export function createLinearStyles(
  theme: MaterialTheme,
  thickness: number,
  containerColor?: string,
  trackColor?: string,
) {
  const c = getProgressColors(theme, containerColor, trackColor)
  const radius = thickness / 2

  return StyleSheet.create({
    root: {
      height: thickness,
      width: '100%',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    activeIndicator: {
      position: 'absolute',
      height: thickness,
      borderRadius: radius,
      backgroundColor: c.indicator,
    },
    inactiveTrack: {
      position: 'absolute',
      height: thickness,
      borderRadius: radius,
      backgroundColor: c.track,
    },
    inactiveTrackFull: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: thickness,
      borderRadius: radius,
      backgroundColor: c.track,
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
