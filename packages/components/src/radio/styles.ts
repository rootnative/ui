import type { MaterialTheme } from '@rootnative/core'
import { alphaColor } from '@rootnative/utils'
import { StyleSheet } from 'react-native'

export const RADIO_OUTER_SIZE = 20
export const RADIO_INNER_SIZE = 10
export const RADIO_TOUCH_TARGET = 48
export const RADIO_STATE_LAYER_SIZE = 40
export const RADIO_FOCUS_RING_OFFSET = 2
export const RADIO_FOCUS_RING_WIDTH = 3

export interface RadioColors {
  borderColor: string
  dotColor: string
  /**
   * Solid base color of the state-layer halo. Visible alpha is produced at
   * render time by view `opacity` (8 % hover, 10 % focus/press).
   */
  stateLayerColor: string
  disabledBorderColor: string
  disabledDotColor: string
}

function getColors(theme: MaterialTheme, selected: boolean): RadioColors {
  const disabledOnSurface38 = alphaColor(theme.colors.onSurface, 0.38)

  if (selected) {
    return {
      borderColor: theme.colors.primary,
      dotColor: theme.colors.primary,
      stateLayerColor: theme.colors.primary,
      disabledBorderColor: disabledOnSurface38,
      disabledDotColor: disabledOnSurface38,
    }
  }

  return {
    borderColor: theme.colors.onSurfaceVariant,
    dotColor: 'transparent',
    stateLayerColor: theme.colors.onSurface,
    disabledBorderColor: disabledOnSurface38,
    disabledDotColor: 'transparent',
  }
}

function applyColorOverrides(
  colors: RadioColors,
  selected: boolean,
  containerColor?: string,
  contentColor?: string,
): RadioColors {
  if (!containerColor && !contentColor) return colors

  const result = { ...colors }

  // Per the documented contract each override targets exactly one state:
  // `containerColor` recolors the selected ring + inner dot, `contentColor`
  // recolors the unselected outer ring. Neither leaks into the other state.
  if (selected) {
    if (containerColor) {
      result.borderColor = containerColor
      result.dotColor = containerColor
      // Halo follows the custom container color so the visual stays cohesive.
      result.stateLayerColor = containerColor
    }
  } else if (contentColor) {
    result.borderColor = contentColor
  }

  return result
}

export function getResolvedRadioColors(
  theme: MaterialTheme,
  selected: boolean,
  containerColor?: string,
  contentColor?: string,
): RadioColors {
  return applyColorOverrides(
    getColors(theme, selected),
    selected,
    containerColor,
    contentColor,
  )
}

export function createStyles(theme: MaterialTheme) {
  const focusRingDiameter =
    RADIO_STATE_LAYER_SIZE +
    (RADIO_FOCUS_RING_OFFSET + RADIO_FOCUS_RING_WIDTH) * 2
  // Center absolute children inside the 48 dp Pressable. flex centering
  // doesn't apply to absolute-positioned children.
  const stateLayerInset = (RADIO_TOUCH_TARGET - RADIO_STATE_LAYER_SIZE) / 2
  const focusRingInset = (RADIO_TOUCH_TARGET - focusRingDiameter) / 2

  return StyleSheet.create({
    container: {
      width: RADIO_TOUCH_TARGET,
      height: RADIO_TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
    disabledContainer: {
      cursor: 'auto',
    },
    stateLayer: {
      position: 'absolute' as const,
      top: stateLayerInset,
      left: stateLayerInset,
      width: RADIO_STATE_LAYER_SIZE,
      height: RADIO_STATE_LAYER_SIZE,
      borderRadius: RADIO_STATE_LAYER_SIZE / 2,
    },
    focusRing: {
      position: 'absolute' as const,
      top: focusRingInset,
      left: focusRingInset,
      width: focusRingDiameter,
      height: focusRingDiameter,
      borderRadius: focusRingDiameter / 2,
      borderWidth: RADIO_FOCUS_RING_WIDTH,
      borderColor: theme.colors.secondary,
    },
    outer: {
      width: RADIO_OUTER_SIZE,
      height: RADIO_OUTER_SIZE,
      borderRadius: RADIO_OUTER_SIZE / 2,
      borderWidth: 2,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    inner: {
      width: RADIO_INNER_SIZE,
      height: RADIO_INNER_SIZE,
      borderRadius: RADIO_INNER_SIZE / 2,
    },
  })
}
