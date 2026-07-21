import type { MaterialTheme } from '@rootnative/core'
import { alphaColor, blendColor, elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'
import type { ChipVariant } from './types'

export const CHIP_FOCUS_RING_OFFSET = 2
export const CHIP_FOCUS_RING_WIDTH = 3

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
  const disabledContainerColor = alphaColor(
    theme.colors.onSurface,
    theme.stateLayer.disabledContainerOpacity,
  )
  const disabledLabelColor = alphaColor(
    theme.colors.onSurface,
    theme.stateLayer.disabledOpacity,
  )
  const disabledOutlineColor = alphaColor(
    theme.colors.onSurface,
    theme.stateLayer.disabledContainerOpacity,
  )

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
        theme.stateLayer.focusedOpacity,
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
        theme.stateLayer.focusedOpacity,
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

  // Flat (outlined) variants — MD3 specifies a transparent container with a
  // 1dp outline, so state layers are alpha overlays instead of blends. The
  // disabled container also stays transparent (only the outline dims to 12%
  // onSurface); the 12% disabled container fill applies to elevated /
  // selected chips only.
  const textColor =
    variant === 'assist'
      ? theme.colors.onSurface
      : theme.colors.onSurfaceVariant

  return {
    backgroundColor: 'transparent',
    textColor,
    borderColor: theme.colors.outline,
    borderWidth: 1,
    hoveredBackgroundColor: alphaColor(
      textColor,
      theme.stateLayer.hoveredOpacity,
    ),
    focusedBackgroundColor: alphaColor(
      textColor,
      theme.stateLayer.focusedOpacity,
    ),
    pressedBackgroundColor: alphaColor(
      textColor,
      theme.stateLayer.pressedOpacity,
    ),
    disabledBackgroundColor: 'transparent',
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
      theme.stateLayer.focusedOpacity,
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
        theme.stateLayer.focusedOpacity,
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
        theme.stateLayer.focusedOpacity,
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
    // Rendered as a SIBLING of the chip's Pressable, absolutely positioned
    // over the space `closeSpacer` reserves in the row — nesting it inside
    // the chip would render <button> inside <button> on web (invalid DOM).
    // Position mirrors the flex layout: trailing padding is 8 when a close
    // target is shown, and the 24dp circle centers in the 32dp chip height.
    closeButton: {
      position: 'absolute' as const,
      end: 8,
      top: 4,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
    disabledCloseButton: {
      cursor: 'auto',
    },
    // In-flow placeholder that keeps the chip's width identical to the old
    // nested layout (close icon width + its 8dp leading margin).
    closeSpacer: {
      marginStart: theme.spacing.sm,
      width: 24,
      height: 24,
    },
  })
}
