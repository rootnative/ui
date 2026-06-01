import type { MaterialTheme } from '@rootnative/core'
import { alphaColor, blendColor, elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'
import type { ChipVariant } from './types'

export const CHIP_FOCUS_RING_OFFSET = 2
export const CHIP_FOCUS_RING_WIDTH = 3

const STATE_LAYER_FOCUS = 0.1

export interface VariantColors {
  backgroundColor: string
  textColor: string
  borderColor: string
  borderWidth: number
  hoveredBackgroundColor: string
  focusedBackgroundColor: string
  pressedBackgroundColor: string
  disabledBackgroundColor: string
  disabledTextColor: string
  disabledBorderColor: string
}

function getVariantColors(
  theme: MaterialTheme,
  variant: ChipVariant,
  elevated: boolean,
  selected: boolean,
): VariantColors {
  const disabledContainerColor = alphaColor(theme.colors.onSurface, 0.12)
  const disabledLabelColor = alphaColor(theme.colors.onSurface, 0.38)
  const disabledOutlineColor = alphaColor(theme.colors.onSurface, 0.12)

  // Filter chip — selected state
  if (variant === 'filter' && selected) {
    return {
      backgroundColor: theme.colors.secondaryContainer,
      textColor: theme.colors.onSecondaryContainer,
      borderColor: 'transparent',
      borderWidth: 0,
      hoveredBackgroundColor: blendColor(
        theme.colors.secondaryContainer,
        theme.colors.onSecondaryContainer,
        theme.stateLayer.hoveredOpacity,
      ),
      focusedBackgroundColor: blendColor(
        theme.colors.secondaryContainer,
        theme.colors.onSecondaryContainer,
        STATE_LAYER_FOCUS,
      ),
      pressedBackgroundColor: blendColor(
        theme.colors.secondaryContainer,
        theme.colors.onSecondaryContainer,
        theme.stateLayer.pressedOpacity,
      ),
      disabledBackgroundColor: disabledContainerColor,
      disabledTextColor: disabledLabelColor,
      disabledBorderColor: 'transparent',
    }
  }

  // Elevated variants (assist, filter unselected, suggestion)
  // Input variant ignores elevated — always outlined
  if (elevated && variant !== 'input') {
    const textColor =
      variant === 'assist'
        ? theme.colors.onSurface
        : theme.colors.onSurfaceVariant
    return {
      backgroundColor: theme.colors.surfaceContainerLow,
      textColor,
      borderColor: 'transparent',
      borderWidth: 0,
      hoveredBackgroundColor: blendColor(
        theme.colors.surfaceContainerLow,
        textColor,
        theme.stateLayer.hoveredOpacity,
      ),
      focusedBackgroundColor: blendColor(
        theme.colors.surfaceContainerLow,
        textColor,
        STATE_LAYER_FOCUS,
      ),
      pressedBackgroundColor: blendColor(
        theme.colors.surfaceContainerLow,
        textColor,
        theme.stateLayer.pressedOpacity,
      ),
      disabledBackgroundColor: disabledContainerColor,
      disabledTextColor: disabledLabelColor,
      disabledBorderColor: 'transparent',
    }
  }

  // Flat (outlined) variants
  const textColor =
    variant === 'assist'
      ? theme.colors.onSurface
      : theme.colors.onSurfaceVariant

  return {
    backgroundColor: theme.colors.surface,
    textColor,
    borderColor: theme.colors.outline,
    borderWidth: 1,
    hoveredBackgroundColor: blendColor(
      theme.colors.surface,
      textColor,
      theme.stateLayer.hoveredOpacity,
    ),
    focusedBackgroundColor: blendColor(
      theme.colors.surface,
      textColor,
      STATE_LAYER_FOCUS,
    ),
    pressedBackgroundColor: blendColor(
      theme.colors.surface,
      textColor,
      theme.stateLayer.pressedOpacity,
    ),
    disabledBackgroundColor: disabledContainerColor,
    disabledTextColor: disabledLabelColor,
    disabledBorderColor: disabledOutlineColor,
  }
}

function applyColorOverrides(
  theme: MaterialTheme,
  colors: VariantColors,
  containerColor?: string,
  contentColor?: string,
): VariantColors {
  if (!containerColor && !contentColor) return colors

  const result = { ...colors }

  if (contentColor) {
    result.textColor = contentColor
  }

  if (containerColor) {
    const overlay = contentColor ?? colors.textColor
    result.backgroundColor = containerColor
    result.borderColor = containerColor
    result.hoveredBackgroundColor = blendColor(
      containerColor,
      overlay,
      theme.stateLayer.hoveredOpacity,
    )
    result.focusedBackgroundColor = blendColor(
      containerColor,
      overlay,
      STATE_LAYER_FOCUS,
    )
    result.pressedBackgroundColor = blendColor(
      containerColor,
      overlay,
      theme.stateLayer.pressedOpacity,
    )
  } else if (contentColor) {
    if (colors.backgroundColor === 'transparent') {
      result.hoveredBackgroundColor = alphaColor(
        contentColor,
        theme.stateLayer.hoveredOpacity,
      )
      result.focusedBackgroundColor = alphaColor(
        contentColor,
        STATE_LAYER_FOCUS,
      )
      result.pressedBackgroundColor = alphaColor(
        contentColor,
        theme.stateLayer.pressedOpacity,
      )
    } else {
      result.hoveredBackgroundColor = blendColor(
        colors.backgroundColor,
        contentColor,
        theme.stateLayer.hoveredOpacity,
      )
      result.focusedBackgroundColor = blendColor(
        colors.backgroundColor,
        contentColor,
        STATE_LAYER_FOCUS,
      )
      result.pressedBackgroundColor = blendColor(
        colors.backgroundColor,
        contentColor,
        theme.stateLayer.pressedOpacity,
      )
    }
  }

  return result
}

export function getResolvedChipColors(
  theme: MaterialTheme,
  variant: ChipVariant,
  elevated: boolean,
  selected: boolean,
  containerColor?: string,
  contentColor?: string,
): VariantColors {
  return applyColorOverrides(
    theme,
    getVariantColors(theme, variant, elevated, selected),
    containerColor,
    contentColor,
  )
}

export function createStyles(
  theme: MaterialTheme,
  variant: ChipVariant,
  elevated: boolean,
  selected: boolean,
  hasLeadingContent: boolean,
  hasTrailingContent: boolean,
  containerColor?: string,
  contentColor?: string,
) {
  const colors = getResolvedChipColors(
    theme,
    variant,
    elevated,
    selected,
    containerColor,
    contentColor,
  )
  const labelStyle = theme.typography.labelLarge
  const elevationLevel0 = elevationStyle(theme.elevation.level0)
  const elevationLevel1 = elevationStyle(theme.elevation.level1)
  const elevationLevel2 = elevationStyle(theme.elevation.level2)
  const focusRingInset = -(CHIP_FOCUS_RING_OFFSET + CHIP_FOCUS_RING_WIDTH)
  const focusRingRadius = theme.shape.cornerSmall + CHIP_FOCUS_RING_OFFSET

  return StyleSheet.create({
    wrapper: {
      alignSelf: 'flex-start' as const,
    },
    container: {
      alignItems: 'center',
      flexDirection: 'row',
      height: 32,
      paddingStart: hasLeadingContent ? 8 : 16,
      paddingEnd: hasTrailingContent ? 8 : 16,
      borderRadius: theme.shape.cornerSmall,
      borderColor: colors.borderColor,
      borderWidth: colors.borderWidth,
      cursor: 'pointer',
      ...elevationLevel0,
    },
    disabledContainer: {
      backgroundColor: colors.disabledBackgroundColor,
      borderColor: colors.disabledBorderColor,
      cursor: 'auto',
      ...elevationLevel0,
    },
    // Two stacked, absolutely-positioned shadow layers that cross-fade the
    // elevated chip from level 1 (rest) → level 2 (hover), per MD3.
    elevationLayerLevel1: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: theme.shape.cornerSmall,
      backgroundColor: colors.backgroundColor,
      ...elevationLevel1,
    },
    elevationLayerLevel2: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: theme.shape.cornerSmall,
      backgroundColor: colors.backgroundColor,
      ...elevationLevel2,
    },
    focusRing: {
      position: 'absolute' as const,
      top: focusRingInset,
      left: focusRingInset,
      right: focusRingInset,
      bottom: focusRingInset,
      borderRadius: focusRingRadius,
      borderWidth: CHIP_FOCUS_RING_WIDTH,
      borderColor: theme.colors.secondary,
    },
    label: {
      fontFamily: labelStyle.fontFamily,
      fontSize: labelStyle.fontSize,
      lineHeight: labelStyle.lineHeight,
      fontWeight: labelStyle.fontWeight,
      letterSpacing: labelStyle.letterSpacing,
      color: colors.textColor,
    },
    disabledLabel: {
      color: colors.disabledTextColor,
    },
    leadingIcon: {
      marginEnd: theme.spacing.sm,
    },
    avatar: {
      marginEnd: theme.spacing.sm,
      width: 24,
      height: 24,
      borderRadius: 12,
      overflow: 'hidden' as const,
    },
    // 24dp circular tap target with state layer (MD3 chip close affordance).
    closeButton: {
      marginStart: theme.spacing.sm,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
}
