import type { MaterialTheme } from '@rootnative/core'
import { alphaColor, blendColor } from '@rootnative/utils'
import { StyleSheet } from 'react-native'
import type {
  IconButtonShape,
  IconButtonSize,
  IconButtonVariant,
  IconButtonWidth,
} from './types'

export const ICON_BUTTON_FOCUS_RING_OFFSET = 2
export const ICON_BUTTON_FOCUS_RING_WIDTH = 3

/**
 * Per-size Expressive geometry (androidx `*IconButtonTokens.kt`). `height`
 * is the container height (and the `uniform` width); `narrow`/`wide` are the
 * alternate container widths; `iconSize` is the glyph size; `outlineWidth`
 * is the outlined-variant border. `squareCorner` is the resting corner of
 * the `'square'` shape, `pressedCorner` the press morph target, and
 * `selectedCorner` the resting corner a *round* toggle adopts when selected
 * (the square selected state inverts to a pill — handled in the component).
 */
export interface IconButtonSizeTokens {
  height: number
  narrow: number
  uniform: number
  wide: number
  iconSize: number
  outlineWidth: number
  squareCorner: number
  pressedCorner: number
  selectedCorner: number
}

const ICON_BUTTON_SIZE_TOKENS: Record<IconButtonSize, IconButtonSizeTokens> = {
  xs: {
    height: 32,
    narrow: 28,
    uniform: 32,
    wide: 40,
    iconSize: 20,
    outlineWidth: 1,
    squareCorner: 12,
    pressedCorner: 8,
    selectedCorner: 12,
  },
  s: {
    height: 40,
    narrow: 32,
    uniform: 40,
    wide: 52,
    iconSize: 24,
    outlineWidth: 1,
    squareCorner: 12,
    pressedCorner: 8,
    selectedCorner: 12,
  },
  m: {
    height: 56,
    narrow: 48,
    uniform: 56,
    wide: 72,
    iconSize: 24,
    outlineWidth: 1,
    squareCorner: 16,
    pressedCorner: 12,
    selectedCorner: 16,
  },
  l: {
    height: 96,
    narrow: 64,
    uniform: 96,
    wide: 128,
    iconSize: 32,
    outlineWidth: 2,
    squareCorner: 28,
    pressedCorner: 16,
    selectedCorner: 28,
  },
  xl: {
    height: 136,
    narrow: 104,
    uniform: 136,
    wide: 184,
    iconSize: 40,
    outlineWidth: 3,
    squareCorner: 28,
    pressedCorner: 16,
    selectedCorner: 28,
  },
}

export function getIconButtonSizeTokens(
  size: IconButtonSize,
): IconButtonSizeTokens {
  return ICON_BUTTON_SIZE_TOKENS[size]
}

export function getIconButtonWidth(
  size: IconButtonSize,
  width: IconButtonWidth,
): number {
  return ICON_BUTTON_SIZE_TOKENS[size][width]
}

/**
 * Resting and pressed corner radii for the shape morph, in dp, accounting
 * for the toggle-selected shape inversion. `'round'` rests as a pill
 * (min(height,width)/2) unless selected, when it adopts the size's
 * `selectedCorner` (squarer). `'square'` rests at `squareCorner` unless
 * selected, when it inverts to a pill. Both morph toward `pressedCorner`.
 */
export function getIconButtonMorphRadii(
  size: IconButtonSize,
  shape: IconButtonShape,
  width: IconButtonWidth,
  selected: boolean,
): { rest: number; pressed: number } {
  const tokens = ICON_BUTTON_SIZE_TOKENS[size]
  const pill = Math.min(tokens.height, tokens[width]) / 2
  let rest: number
  if (shape === 'round') {
    rest = selected ? tokens.selectedCorner : pill
  } else {
    rest = selected ? pill : tokens.squareCorner
  }
  return { rest, pressed: tokens.pressedCorner }
}

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
  // Per MD3: DisabledContainerOpacity = 0.12
  const disabledContainerColor = alphaColor(
    theme.colors.onSurface,
    theme.stateLayer.disabledContainerOpacity,
  )
  const disabledOutlineColor = alphaColor(
    theme.colors.onSurface,
    theme.stateLayer.disabledContainerOpacity,
  )
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
    focusedBackgroundColor: blendStateLayer(
      baseBg,
      overlay,
      theme.stateLayer.focusedOpacity,
    ),
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
      theme.stateLayer.focusedOpacity,
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
      // width/height/borderRadius are applied per size/width/shape in the
      // component (the morph and the width prop both need runtime values).
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
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
      // borderRadius applied per size in the component.
      borderWidth: ICON_BUTTON_FOCUS_RING_WIDTH,
      borderColor: theme.colors.secondary,
    },
  })
}
