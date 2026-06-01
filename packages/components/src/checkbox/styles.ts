import type { MaterialTheme } from '@rootnative/core'
import { alphaColor } from '@rootnative/utils'
import { StyleSheet } from 'react-native'

export const CHECKBOX_BOX_SIZE = 18
// MD3 checkbox container radius is 2 dp — no theme shape token equals 2
// (`cornerExtraSmall` is 4), so it's pinned locally.
export const CHECKBOX_CORNER_RADIUS = 2
export const CHECKBOX_BORDER_WIDTH = 2
export const CHECKBOX_TOUCH_TARGET = 48
export const CHECKBOX_STATE_LAYER_SIZE = 40
export const CHECKBOX_FOCUS_RING_OFFSET = 2
export const CHECKBOX_FOCUS_RING_WIDTH = 3
export const CHECKBOX_ICON_SIZE = 14
// MD3 indeterminate dash mark dimensions inside the 18 dp box.
export const CHECKBOX_MARK_WIDTH = 10
export const CHECKBOX_MARK_THICKNESS = 2

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

function getColors(
  theme: MaterialTheme,
  checked: boolean,
  error: boolean,
): CheckboxColors {
  const disabledOnSurface38 = alphaColor(theme.colors.onSurface, 0.38)

  if (checked) {
    return {
      backgroundColor: error ? theme.colors.error : theme.colors.primary,
      borderColor: 'transparent',
      iconColor: error ? theme.colors.onError : theme.colors.onPrimary,
      stateLayerColor: error ? theme.colors.error : theme.colors.primary,
      disabledBackgroundColor: disabledOnSurface38,
      disabledBorderColor: 'transparent',
      disabledIconColor: theme.colors.surface,
    }
  }

  return {
    backgroundColor: 'transparent',
    borderColor: error ? theme.colors.error : theme.colors.onSurfaceVariant,
    iconColor: 'transparent',
    stateLayerColor: error ? theme.colors.error : theme.colors.onSurface,
    disabledBackgroundColor: 'transparent',
    disabledBorderColor: disabledOnSurface38,
    disabledIconColor: 'transparent',
  }
}

function applyColorOverrides(
  colors: CheckboxColors,
  checked: boolean,
  containerColor?: string,
  contentColor?: string,
): CheckboxColors {
  // Per the documented contract, `containerColor`/`contentColor` only apply
  // to the checked (and indeterminate) box — the unchecked state keeps its
  // outline-only appearance.
  if (!checked || (!containerColor && !contentColor)) return colors

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
  error = false,
): CheckboxColors {
  return applyColorOverrides(
    getColors(theme, checked, error),
    checked,
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
      borderRadius: CHECKBOX_CORNER_RADIUS + CHECKBOX_FOCUS_RING_OFFSET,
      borderWidth: CHECKBOX_FOCUS_RING_WIDTH,
      borderColor: theme.colors.secondary,
    },
    box: {
      width: CHECKBOX_BOX_SIZE,
      height: CHECKBOX_BOX_SIZE,
      borderRadius: CHECKBOX_CORNER_RADIUS,
      borderWidth: CHECKBOX_BORDER_WIDTH,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    indeterminateMark: {
      width: CHECKBOX_MARK_WIDTH,
      height: CHECKBOX_MARK_THICKNESS,
      borderRadius: CHECKBOX_MARK_THICKNESS / 2,
    },
  })
}
