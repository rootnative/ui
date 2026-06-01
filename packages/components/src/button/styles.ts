import type { MaterialTheme } from '@rootnative/core'
import { alphaColor, blendColor, elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'
import type { ButtonVariant } from './types'

export const BUTTON_FOCUS_RING_OFFSET = 2
export const BUTTON_FOCUS_RING_WIDTH = 3

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
  variant: ButtonVariant,
): VariantColors {
  // Per MD3: DisabledContainerOpacity = 0.12, DisabledLabelTextOpacity = 0.38
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

  if (variant === 'outlined') {
    return {
      backgroundColor: 'transparent',
      textColor: theme.colors.primary,
      borderColor: theme.colors.outline,
      borderWidth: 1,
      hoveredBackgroundColor: alphaColor(
        theme.colors.primary,
        theme.stateLayer.hoveredOpacity,
      ),
      focusedBackgroundColor: alphaColor(
        theme.colors.primary,
        theme.stateLayer.focusedOpacity,
      ),
      pressedBackgroundColor: alphaColor(
        theme.colors.primary,
        theme.stateLayer.pressedOpacity,
      ),
      disabledBackgroundColor: 'transparent',
      disabledTextColor: disabledLabelColor,
      disabledBorderColor: disabledOutlineColor,
    }
  }

  if (variant === 'text') {
    return {
      backgroundColor: 'transparent',
      textColor: theme.colors.primary,
      borderColor: 'transparent',
      borderWidth: 0,
      hoveredBackgroundColor: alphaColor(
        theme.colors.primary,
        theme.stateLayer.hoveredOpacity,
      ),
      focusedBackgroundColor: alphaColor(
        theme.colors.primary,
        theme.stateLayer.focusedOpacity,
      ),
      pressedBackgroundColor: alphaColor(
        theme.colors.primary,
        theme.stateLayer.pressedOpacity,
      ),
      disabledBackgroundColor: 'transparent',
      disabledTextColor: disabledLabelColor,
      disabledBorderColor: 'transparent',
    }
  }

  if (variant === 'elevated') {
    return {
      backgroundColor: theme.colors.surfaceContainerLow,
      textColor: theme.colors.primary,
      borderColor: theme.colors.surfaceContainerLow,
      borderWidth: 0,
      hoveredBackgroundColor: blendColor(
        theme.colors.surfaceContainerLow,
        theme.colors.primary,
        theme.stateLayer.hoveredOpacity,
      ),
      focusedBackgroundColor: blendColor(
        theme.colors.surfaceContainerLow,
        theme.colors.primary,
        theme.stateLayer.focusedOpacity,
      ),
      pressedBackgroundColor: blendColor(
        theme.colors.surfaceContainerLow,
        theme.colors.primary,
        theme.stateLayer.pressedOpacity,
      ),
      disabledBackgroundColor: disabledContainerColor,
      disabledTextColor: disabledLabelColor,
      disabledBorderColor: disabledContainerColor,
    }
  }

  if (variant === 'tonal') {
    return {
      backgroundColor: theme.colors.secondaryContainer,
      textColor: theme.colors.onSecondaryContainer,
      borderColor: theme.colors.secondaryContainer,
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
      disabledBorderColor: disabledContainerColor,
    }
  }

  // filled (default)
  return {
    backgroundColor: theme.colors.primary,
    textColor: theme.colors.onPrimary,
    borderColor: theme.colors.primary,
    borderWidth: 0,
    hoveredBackgroundColor: blendColor(
      theme.colors.primary,
      theme.colors.onPrimary,
      theme.stateLayer.hoveredOpacity,
    ),
    focusedBackgroundColor: blendColor(
      theme.colors.primary,
      theme.colors.onPrimary,
      theme.stateLayer.focusedOpacity,
    ),
    pressedBackgroundColor: blendColor(
      theme.colors.primary,
      theme.colors.onPrimary,
      theme.stateLayer.pressedOpacity,
    ),
    disabledBackgroundColor: disabledContainerColor,
    disabledTextColor: disabledLabelColor,
    disabledBorderColor: disabledContainerColor,
  }
}

function getHorizontalPadding(
  theme: MaterialTheme,
  variant: ButtonVariant,
  hasLeadingIcon: boolean,
  hasTrailingIcon: boolean,
): { paddingStart: number; paddingEnd: number } {
  if (variant === 'text') {
    // M3: text button uses 12dp base, opposite side of icon gets 16dp
    return {
      paddingStart: hasLeadingIcon
        ? 12
        : hasTrailingIcon
          ? theme.spacing.md
          : 12,
      paddingEnd: hasTrailingIcon ? 12 : hasLeadingIcon ? theme.spacing.md : 12,
    }
  }

  // M3: filled/elevated/tonal/outlined use 24dp base, icon side gets 16dp
  return {
    paddingStart: hasLeadingIcon ? theme.spacing.md : theme.spacing.lg,
    paddingEnd: hasTrailingIcon ? theme.spacing.md : theme.spacing.lg,
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

export function getResolvedButtonColors(
  theme: MaterialTheme,
  variant: ButtonVariant,
  containerColor?: string,
  contentColor?: string,
): VariantColors {
  return applyColorOverrides(
    theme,
    getVariantColors(theme, variant),
    containerColor,
    contentColor,
  )
}

export function createStyles(
  theme: MaterialTheme,
  variant: ButtonVariant,
  hasLeadingIcon: boolean,
  hasTrailingIcon: boolean,
  containerColor?: string,
  contentColor?: string,
) {
  const colors = getResolvedButtonColors(
    theme,
    variant,
    containerColor,
    contentColor,
  )
  const labelStyle = theme.typography.labelLarge
  const padding = getHorizontalPadding(
    theme,
    variant,
    hasLeadingIcon,
    hasTrailingIcon,
  )
  const elevationLevel0 = elevationStyle(theme.elevation.level0)
  const elevationLevel1 = elevationStyle(theme.elevation.level1)
  const elevationLevel2 = elevationStyle(theme.elevation.level2)

  const focusRingInset = -(BUTTON_FOCUS_RING_OFFSET + BUTTON_FOCUS_RING_WIDTH)

  return StyleSheet.create({
    wrapper: {
      alignSelf: 'flex-start' as const,
    },
    container: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      minWidth: 58,
      minHeight: 40,
      paddingStart: padding.paddingStart,
      paddingEnd: padding.paddingEnd,
      paddingVertical: 10,
      borderRadius: theme.shape.cornerFull,
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
    // elevated button from level 1 (rest) → level 2 (hover), per MD3.
    elevationLayerLevel1: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: theme.shape.cornerFull,
      backgroundColor: colors.backgroundColor,
      ...elevationLevel1,
    },
    elevationLayerLevel2: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: theme.shape.cornerFull,
      backgroundColor: colors.backgroundColor,
      ...elevationLevel2,
    },
    focusRing: {
      position: 'absolute' as const,
      top: focusRingInset,
      left: focusRingInset,
      right: focusRingInset,
      bottom: focusRingInset,
      borderRadius: theme.shape.cornerFull,
      borderWidth: BUTTON_FOCUS_RING_WIDTH,
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
    leadingIcon: {
      marginEnd: theme.spacing.sm,
    },
    trailingIcon: {
      marginStart: theme.spacing.sm,
    },
    disabledLabel: {
      color: colors.disabledTextColor,
    },
  })
}
