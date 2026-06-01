import type { MaterialTheme } from '@rootnative/core'
import { alphaColor } from '@rootnative/utils'
import { StyleSheet } from 'react-native'

export const SWITCH_TRACK_WIDTH = 52
export const SWITCH_TRACK_HEIGHT = 32
export const SWITCH_TRACK_PADDING = 4
export const SWITCH_TRACK_BORDER_WIDTH = 2
export const SWITCH_THUMB_ON_SIZE = 24
export const SWITCH_THUMB_OFF_SIZE = 16
export const SWITCH_THUMB_PRESSED_SIZE = 28
export const SWITCH_STATE_LAYER_SIZE = 40
export const SWITCH_FOCUS_RING_OFFSET = 2
export const SWITCH_FOCUS_RING_WIDTH = 3

export interface TrackColors {
  trackColor: string
  thumbColor: string
  iconColor: string
  borderColor: string
  disabledTrackColor: string
  disabledThumbColor: string
  disabledBorderColor: string
}

function getColors(theme: MaterialTheme, selected: boolean): TrackColors {
  const disabledOnSurface12 = alphaColor(theme.colors.onSurface, 0.12)
  const disabledOnSurface38 = alphaColor(theme.colors.onSurface, 0.38)

  if (selected) {
    return {
      trackColor: theme.colors.primary,
      thumbColor: theme.colors.onPrimary,
      iconColor: theme.colors.onPrimaryContainer,
      borderColor: 'transparent',
      disabledTrackColor: disabledOnSurface12,
      disabledThumbColor: theme.colors.surface,
      disabledBorderColor: 'transparent',
    }
  }

  return {
    trackColor: theme.colors.surfaceContainerHighest,
    thumbColor: theme.colors.outline,
    iconColor: theme.colors.surfaceContainerHighest,
    borderColor: theme.colors.outline,
    disabledTrackColor: disabledOnSurface12,
    disabledThumbColor: disabledOnSurface38,
    disabledBorderColor: disabledOnSurface12,
  }
}

function applyColorOverrides(
  colors: TrackColors,
  containerColor?: string,
  contentColor?: string,
): TrackColors {
  if (!containerColor && !contentColor) return colors

  const result = { ...colors }

  if (contentColor) {
    result.thumbColor = contentColor
    result.iconColor = contentColor
  }

  if (containerColor) {
    result.trackColor = containerColor
    result.borderColor = containerColor
    if (contentColor) {
      result.iconColor = containerColor
    }
  }

  return result
}

export function getResolvedColors(
  theme: MaterialTheme,
  selected: boolean,
  containerColor?: string,
  contentColor?: string,
): TrackColors {
  return applyColorOverrides(
    getColors(theme, selected),
    containerColor,
    contentColor,
  )
}

export function createStyles(
  theme: MaterialTheme,
  containerColor?: string,
  contentColor?: string,
) {
  // MD3 disabled visuals differ between states: the disabled-selected handle
  // is `surface` while disabled-unselected keeps 38 % `onSurface`, and only
  // the unselected track keeps its (12 % onSurface) outline.
  const disabledOffColors = getResolvedColors(
    theme,
    false,
    containerColor,
    contentColor,
  )
  const disabledOnColors = getResolvedColors(
    theme,
    true,
    containerColor,
    contentColor,
  )

  const focusRingInset = -(SWITCH_FOCUS_RING_OFFSET + SWITCH_FOCUS_RING_WIDTH)

  return StyleSheet.create({
    wrapper: {
      width: SWITCH_TRACK_WIDTH,
      height: SWITCH_TRACK_HEIGHT,
    },
    track: {
      width: SWITCH_TRACK_WIDTH,
      height: SWITCH_TRACK_HEIGHT,
      borderRadius: SWITCH_TRACK_HEIGHT / 2,
      borderWidth: SWITCH_TRACK_BORDER_WIDTH,
      justifyContent: 'center',
      overflow: 'visible' as const,
      cursor: 'pointer',
    },
    disabledTrack: {
      backgroundColor: disabledOffColors.disabledTrackColor,
      borderColor: disabledOffColors.disabledBorderColor,
      cursor: 'auto',
    },
    disabledTrackSelected: {
      backgroundColor: disabledOnColors.disabledTrackColor,
      borderColor: disabledOnColors.disabledBorderColor,
      cursor: 'auto',
    },
    focusRing: {
      position: 'absolute' as const,
      top: focusRingInset,
      left: focusRingInset,
      right: focusRingInset,
      bottom: focusRingInset,
      borderRadius:
        SWITCH_TRACK_HEIGHT / 2 +
        SWITCH_FOCUS_RING_OFFSET +
        SWITCH_FOCUS_RING_WIDTH,
      borderWidth: SWITCH_FOCUS_RING_WIDTH,
      borderColor: theme.colors.secondary,
    },
    stateLayer: {
      position: 'absolute' as const,
      width: SWITCH_STATE_LAYER_SIZE,
      height: SWITCH_STATE_LAYER_SIZE,
      borderRadius: SWITCH_STATE_LAYER_SIZE / 2,
      // Centered vertically on the 32 dp track: (32 - 40) / 2 = -4
      top: (SWITCH_TRACK_HEIGHT - SWITCH_STATE_LAYER_SIZE) / 2,
    },
    thumbBase: {
      marginStart: SWITCH_TRACK_PADDING - SWITCH_TRACK_BORDER_WIDTH,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    disabledThumb: {
      backgroundColor: disabledOffColors.disabledThumbColor,
    },
    disabledThumbSelected: {
      backgroundColor: disabledOnColors.disabledThumbColor,
    },
    iconLayer: {
      position: 'absolute' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    disabledIconColor: {
      color: alphaColor(theme.colors.onSurface, 0.38),
    },
  })
}
