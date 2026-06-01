import type { MaterialTheme } from '@rootnative/core'
import { alphaColor, blendColor, elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'
import type { CardVariant } from './types'

export const CARD_FOCUS_RING_OFFSET = 2
export const CARD_FOCUS_RING_WIDTH = 3

export interface CardColors {
  backgroundColor: string
  borderColor: string
  borderWidth: number
  hoveredBackgroundColor: string
  focusedBackgroundColor: string
  pressedBackgroundColor: string
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

function getVariantColors(
  theme: MaterialTheme,
  variant: CardVariant,
): CardColors {
  const disabledContainerColor = alphaColor(theme.colors.onSurface, 0.12)
  const disabledOutlineColor = alphaColor(theme.colors.onSurface, 0.12)
  const stateLayerFocus = 0.1

  if (variant === 'outlined') {
    return {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderWidth: 1,
      hoveredBackgroundColor: blendStateLayer(
        theme.colors.surface,
        theme.colors.onSurface,
        theme.stateLayer.hoveredOpacity,
      ),
      focusedBackgroundColor: blendStateLayer(
        theme.colors.surface,
        theme.colors.onSurface,
        stateLayerFocus,
      ),
      pressedBackgroundColor: blendStateLayer(
        theme.colors.surface,
        theme.colors.onSurface,
        theme.stateLayer.pressedOpacity,
      ),
      disabledBackgroundColor: theme.colors.surface,
      disabledBorderColor: disabledOutlineColor,
    }
  }

  if (variant === 'filled') {
    return {
      backgroundColor: theme.colors.surfaceContainerHighest,
      borderColor: 'transparent',
      borderWidth: 0,
      hoveredBackgroundColor: blendColor(
        theme.colors.surfaceContainerHighest,
        theme.colors.onSurface,
        theme.stateLayer.hoveredOpacity,
      ),
      focusedBackgroundColor: blendColor(
        theme.colors.surfaceContainerHighest,
        theme.colors.onSurface,
        stateLayerFocus,
      ),
      pressedBackgroundColor: blendColor(
        theme.colors.surfaceContainerHighest,
        theme.colors.onSurface,
        theme.stateLayer.pressedOpacity,
      ),
      disabledBackgroundColor: disabledContainerColor,
      disabledBorderColor: 'transparent',
    }
  }

  // elevated (default)
  return {
    backgroundColor: theme.colors.surface,
    borderColor: 'transparent',
    borderWidth: 0,
    hoveredBackgroundColor: blendColor(
      theme.colors.surface,
      theme.colors.onSurface,
      theme.stateLayer.hoveredOpacity,
    ),
    focusedBackgroundColor: blendColor(
      theme.colors.surface,
      theme.colors.onSurface,
      stateLayerFocus,
    ),
    pressedBackgroundColor: blendColor(
      theme.colors.surface,
      theme.colors.onSurface,
      theme.stateLayer.pressedOpacity,
    ),
    disabledBackgroundColor: disabledContainerColor,
    disabledBorderColor: 'transparent',
  }
}

function applyContainerColorOverride(
  theme: MaterialTheme,
  colors: CardColors,
  containerColor?: string,
): CardColors {
  if (!containerColor) return colors
  const stateLayerFocus = 0.1

  return {
    ...colors,
    backgroundColor: containerColor,
    borderColor: containerColor,
    borderWidth: 0,
    hoveredBackgroundColor: blendColor(
      containerColor,
      theme.colors.onSurface,
      theme.stateLayer.hoveredOpacity,
    ),
    focusedBackgroundColor: blendColor(
      containerColor,
      theme.colors.onSurface,
      stateLayerFocus,
    ),
    pressedBackgroundColor: blendColor(
      containerColor,
      theme.colors.onSurface,
      theme.stateLayer.pressedOpacity,
    ),
  }
}

export function getResolvedCardColors(
  theme: MaterialTheme,
  variant: CardVariant,
  containerColor?: string,
): CardColors {
  return applyContainerColorOverride(
    theme,
    getVariantColors(theme, variant),
    containerColor,
  )
}

export function createStyles(
  theme: MaterialTheme,
  variant: CardVariant,
  containerColor?: string,
) {
  const colors = getResolvedCardColors(theme, variant, containerColor)
  const elevationLevel0 = elevationStyle(theme.elevation.level0)
  const elevationLevel1 = elevationStyle(theme.elevation.level1)
  const baseElevation =
    variant === 'elevated' ? elevationLevel1 : elevationLevel0

  const focusRingInset = -(CARD_FOCUS_RING_OFFSET + CARD_FOCUS_RING_WIDTH)

  return StyleSheet.create({
    wrapper: {
      borderRadius: theme.shape.cornerMedium,
    },
    container: {
      borderRadius: theme.shape.cornerMedium,
      backgroundColor: colors.backgroundColor,
      borderColor: colors.borderColor,
      borderWidth: colors.borderWidth,
      overflow: 'hidden',
      ...baseElevation,
    },
    interactiveContainer: {
      cursor: 'pointer',
    },
    focusRing: {
      position: 'absolute' as const,
      top: focusRingInset,
      left: focusRingInset,
      right: focusRingInset,
      bottom: focusRingInset,
      borderRadius: theme.shape.cornerMedium + CARD_FOCUS_RING_OFFSET,
      borderWidth: CARD_FOCUS_RING_WIDTH,
      borderColor: theme.colors.secondary,
    },
    disabledContainer: {
      backgroundColor: colors.disabledBackgroundColor,
      borderColor: colors.disabledBorderColor,
      cursor: 'auto',
      ...elevationLevel0,
    },
    disabledContent: {
      opacity: theme.stateLayer.disabledOpacity,
    },
  })
}
