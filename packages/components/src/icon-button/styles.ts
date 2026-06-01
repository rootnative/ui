import type { MaterialTheme } from '@rootnative/core'
import { alphaColor, blendColor } from '@rootnative/utils'
import { StyleSheet } from 'react-native'
import type { IconButtonVariant } from './types'

export const ICON_BUTTON_FOCUS_RING_OFFSET = 2
export const ICON_BUTTON_FOCUS_RING_WIDTH = 3

export interface IconButtonColors {
  backgroundColor: string
  hoveredBackgroundColor: string
  focusedBackgroundColor: string
  pressedBackgroundColor: string
  borderColor: string
  borderWidth: number
  disabledBackgroundColor: string
  disabledBorderColor: string
}

function blendStateLayer(
  base: string,
  overlay: string,
  opacity: number,
): string {
  if (base === 'transparent') {
    return alphaColor(overlay, opacity)
  }
  return blendColor(base, overlay, opacity)
}

export function getIconButtonColors(
  theme: MaterialTheme,
  variant: IconButtonVariant,
  isToggle: boolean,
  selected: boolean,
): IconButtonColors {
  // Per MD3: DisabledContainerOpacity = 0.10
  const disabledContainerColor = alphaColor(theme.colors.onSurface, 0.1)
  const disabledOutlineColor = alphaColor(theme.colors.onSurface, 0.12)
  const stateLayerFocus = 0.1
  const toggleUnselectedBg = theme.colors.surfaceContainerHighest

  let baseBg: string
  let overlay: string
  let borderColor: string = 'transparent'
  let borderWidth = 0
  let disabledBg = disabledContainerColor
  let disabledBorderColor = disabledContainerColor

  if (variant === 'filled') {
    if (isToggle && !selected) {
      baseBg = toggleUnselectedBg
      overlay = theme.colors.primary
    } else {
      baseBg = theme.colors.primary
      overlay = theme.colors.onPrimary
    }
    borderColor = baseBg
  } else if (variant === 'tonal') {
    if (isToggle && !selected) {
      baseBg = toggleUnselectedBg
      overlay = theme.colors.onSurfaceVariant
    } else {
      baseBg = theme.colors.secondaryContainer
      overlay = theme.colors.onSecondaryContainer
    }
    borderColor = baseBg
  } else if (variant === 'outlined') {
    if (isToggle && selected) {
      baseBg = theme.colors.inverseSurface
      overlay = theme.colors.inverseOnSurface
      borderColor = baseBg
      borderWidth = 0
    } else {
      baseBg = 'transparent'
      overlay = theme.colors.onSurfaceVariant
      borderColor = theme.colors.outline
      borderWidth = 1
      disabledBg = 'transparent'
      disabledBorderColor = disabledOutlineColor
    }
  } else {
    // standard
    baseBg = 'transparent'
    overlay =
      isToggle && selected
        ? theme.colors.primary
        : theme.colors.onSurfaceVariant
    disabledBg = 'transparent'
    disabledBorderColor = 'transparent'
  }

  return {
    backgroundColor: baseBg,
    hoveredBackgroundColor: blendStateLayer(
      baseBg,
      overlay,
      theme.stateLayer.hoveredOpacity,
    ),
    focusedBackgroundColor: blendStateLayer(baseBg, overlay, stateLayerFocus),
    pressedBackgroundColor: blendStateLayer(
      baseBg,
      overlay,
      theme.stateLayer.pressedOpacity,
    ),
    borderColor,
    borderWidth,
    disabledBackgroundColor: disabledBg,
    disabledBorderColor,
  }
}

export function applyContainerColorOverride(
  theme: MaterialTheme,
  colors: IconButtonColors,
  containerColor: string,
  overlay: string,
): IconButtonColors {
  const stateLayerFocus = 0.1
  return {
    ...colors,
    backgroundColor: containerColor,
    borderColor: containerColor,
    borderWidth: 0,
    hoveredBackgroundColor: blendColor(
      containerColor,
      overlay,
      theme.stateLayer.hoveredOpacity,
    ),
    focusedBackgroundColor: blendColor(
      containerColor,
      overlay,
      stateLayerFocus,
    ),
    pressedBackgroundColor: blendColor(
      containerColor,
      overlay,
      theme.stateLayer.pressedOpacity,
    ),
  }
}

export function createStyles(theme: MaterialTheme) {
  const focusRingInset = -(
    ICON_BUTTON_FOCUS_RING_OFFSET + ICON_BUTTON_FOCUS_RING_WIDTH
  )

  return StyleSheet.create({
    wrapper: {
      alignSelf: 'flex-start' as const,
    },
    container: {
      borderRadius: theme.shape.cornerFull,
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
    sizeSmall: {
      width: 32,
      height: 32,
    },
    sizeMedium: {
      width: 40,
      height: 40,
    },
    sizeLarge: {
      width: 48,
      height: 48,
    },
    disabled: {
      cursor: 'auto',
    },
    focusRing: {
      position: 'absolute' as const,
      top: focusRingInset,
      left: focusRingInset,
      right: focusRingInset,
      bottom: focusRingInset,
      borderRadius: theme.shape.cornerFull,
      borderWidth: ICON_BUTTON_FOCUS_RING_WIDTH,
      borderColor: theme.colors.secondary,
    },
  })
}
