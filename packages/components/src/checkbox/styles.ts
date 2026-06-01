import type { MaterialTheme } from '@rootnative/core'
import { alphaColor } from '@rootnative/utils'
import { StyleSheet } from 'react-native'

export const CHECKBOX_BOX_SIZE = 18
export const CHECKBOX_BORDER_WIDTH = 2
export const CHECKBOX_TOUCH_TARGET = 48
export const CHECKBOX_STATE_LAYER_SIZE = 40
export const CHECKBOX_FOCUS_RING_OFFSET = 2
export const CHECKBOX_FOCUS_RING_WIDTH = 3
export const CHECKBOX_ICON_SIZE = 14

export interface CheckboxColors {
  backgroundColor: string
  borderColor: string
  iconColor: string
  /**
   * Solid base color of the state-layer halo. Visible alpha is produced at
   * render time by multiplying view `opacity` (8 % hover, 10 % focus/press).
   */
  stateLayerColor: string
  disabledBackgroundColor: string
  disabledBorderColor: string
  disabledIconColor: string
}

function getColors(theme: MaterialTheme, checked: boolean): CheckboxColors {
  const disabledOnSurface38 = alphaColor(theme.colors.onSurface, 0.38)

  if (checked) {
    return {
      backgroundColor: theme.colors.primary,
      borderColor: 'transparent',
      iconColor: theme.colors.onPrimary,
      stateLayerColor: theme.colors.primary,
      disabledBackgroundColor: disabledOnSurface38,
      disabledBorderColor: 'transparent',
      disabledIconColor: theme.colors.surface,
    }
  }

  return {
    backgroundColor: 'transparent',
    borderColor: theme.colors.onSurfaceVariant,
    iconColor: 'transparent',
    stateLayerColor: theme.colors.onSurface,
    disabledBackgroundColor: 'transparent',
    disabledBorderColor: disabledOnSurface38,
    disabledIconColor: 'transparent',
  }
}

function applyColorOverrides(
  colors: CheckboxColors,
  containerColor?: string,
  contentColor?: string,
): CheckboxColors {
  if (!containerColor && !contentColor) return colors

  const result = { ...colors }

  if (contentColor) {
    result.iconColor = contentColor
  }

  if (containerColor) {
    result.backgroundColor = containerColor
    result.borderColor = containerColor
    // Halo follows the custom container so the visual stays cohesive — a
    // low-opacity tint of the same color around the box. Render-time view
    // opacity (8/10 %) handles transparency, so we keep this color solid.
    result.stateLayerColor = containerColor
  }

  return result
}

export function getResolvedCheckboxColors(
  theme: MaterialTheme,
  checked: boolean,
  containerColor?: string,
  contentColor?: string,
): CheckboxColors {
  return applyColorOverrides(
    getColors(theme, checked),
    containerColor,
    contentColor,
  )
}

export function createStyles(theme: MaterialTheme) {
  const focusRingDiameter =
    CHECKBOX_BOX_SIZE +
    (CHECKBOX_FOCUS_RING_OFFSET + CHECKBOX_FOCUS_RING_WIDTH) * 2
  const stateLayerInset =
    (CHECKBOX_TOUCH_TARGET - CHECKBOX_STATE_LAYER_SIZE) / 2
  const focusRingInset = (CHECKBOX_TOUCH_TARGET - focusRingDiameter) / 2

  return StyleSheet.create({
    container: {
      width: CHECKBOX_TOUCH_TARGET,
      height: CHECKBOX_TOUCH_TARGET,
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
      width: CHECKBOX_STATE_LAYER_SIZE,
      height: CHECKBOX_STATE_LAYER_SIZE,
      borderRadius: CHECKBOX_STATE_LAYER_SIZE / 2,
    },
    focusRing: {
      position: 'absolute' as const,
      top: focusRingInset,
      left: focusRingInset,
      width: focusRingDiameter,
      height: focusRingDiameter,
      borderRadius: theme.shape.cornerExtraSmall + CHECKBOX_FOCUS_RING_OFFSET,
      borderWidth: CHECKBOX_FOCUS_RING_WIDTH,
      borderColor: theme.colors.secondary,
    },
    box: {
      width: CHECKBOX_BOX_SIZE,
      height: CHECKBOX_BOX_SIZE,
      borderRadius: theme.shape.cornerExtraSmall,
      borderWidth: CHECKBOX_BORDER_WIDTH,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  })
}
