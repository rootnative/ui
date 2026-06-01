import type { MaterialTheme } from '@rootnative/core'
import { alphaColor, blendColor, elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'
import type { FABSize, FABVariant } from './types'

export const FAB_FOCUS_RING_OFFSET = 2
export const FAB_FOCUS_RING_WIDTH = 3

export interface FABColors {
  backgroundColor: string
  contentColor: string
  hoveredBackgroundColor: string
  focusedBackgroundColor: string
  pressedBackgroundColor: string
  disabledBackgroundColor: string
  disabledContentColor: string
}

function getVariantColors(
  theme: MaterialTheme,
  variant: FABVariant,
): { backgroundColor: string; contentColor: string } {
  if (variant === 'secondary') {
    return {
      backgroundColor: theme.colors.secondaryContainer,
      contentColor: theme.colors.onSecondaryContainer,
    }
  }

  if (variant === 'tertiary') {
    return {
      backgroundColor: theme.colors.tertiaryContainer,
      contentColor: theme.colors.onTertiaryContainer,
    }
  }

  if (variant === 'surface') {
    return {
      backgroundColor: theme.colors.surfaceContainerHigh,
      contentColor: theme.colors.primary,
    }
  }

  return {
    backgroundColor: theme.colors.primaryContainer,
    contentColor: theme.colors.onPrimaryContainer,
  }
}

function deriveStateLayers(
  theme: MaterialTheme,
  backgroundColor: string,
  overlay: string,
): {
  hoveredBackgroundColor: string
  focusedBackgroundColor: string
  pressedBackgroundColor: string
} {
  const stateLayerFocus = 0.1
  return {
    hoveredBackgroundColor: blendColor(
      backgroundColor,
      overlay,
      theme.stateLayer.hoveredOpacity,
    ),
    focusedBackgroundColor: blendColor(
      backgroundColor,
      overlay,
      stateLayerFocus,
    ),
    pressedBackgroundColor: blendColor(
      backgroundColor,
      overlay,
      theme.stateLayer.pressedOpacity,
    ),
  }
}

export function getResolvedFABColors(
  theme: MaterialTheme,
  variant: FABVariant,
  containerColorOverride?: string,
  contentColorOverride?: string,
): FABColors {
  const variantColors = getVariantColors(theme, variant)
  const backgroundColor =
    containerColorOverride ?? variantColors.backgroundColor
  const contentColor = contentColorOverride ?? variantColors.contentColor

  return {
    backgroundColor,
    contentColor,
    ...deriveStateLayers(theme, backgroundColor, contentColor),
    // Per MD3: DisabledContainerOpacity = 0.10, DisabledContentOpacity = 0.38
    disabledBackgroundColor: alphaColor(theme.colors.onSurface, 0.1),
    disabledContentColor: alphaColor(theme.colors.onSurface, 0.38),
  }
}

export function getFABSizeStyle(
  styles: ReturnType<typeof createStyles>,
  size: FABSize,
) {
  if (size === 'small') return styles.sizeSmall
  if (size === 'large') return styles.sizeLarge
  return styles.sizeMedium
}

export function getFABIconPixelSize(size: FABSize): number {
  if (size === 'large') return 36
  return 24
}

export function createStyles(theme: MaterialTheme) {
  const focusRingInset = -(FAB_FOCUS_RING_OFFSET + FAB_FOCUS_RING_WIDTH)
  const restingElevation = elevationStyle(theme.elevation.level3)
  const labelStyle = theme.typography.labelLarge

  return StyleSheet.create({
    wrapper: {
      alignSelf: 'flex-start' as const,
    },
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      ...restingElevation,
    },
    sizeSmall: {
      width: 40,
      height: 40,
      borderRadius: theme.shape.cornerMedium,
    },
    sizeMedium: {
      width: 56,
      height: 56,
      borderRadius: theme.shape.cornerLarge,
    },
    sizeLarge: {
      width: 96,
      height: 96,
      borderRadius: theme.shape.cornerExtraLarge,
    },
    extended: {
      flexDirection: 'row',
      height: 56,
      minWidth: 80,
      // MD3 spec: 20dp horizontal padding (no token in theme.spacing).
      paddingHorizontal: 20,
      borderRadius: theme.shape.cornerLarge,
    },
    extendedWithIcon: {
      // MD3 spec: 16dp icon-side, 20dp text-side.
      paddingStart: theme.spacing.md,
      paddingEnd: 20,
    },
    extendedIcon: {
      marginEnd: theme.spacing.sm + theme.spacing.xs,
    },
    label: {
      fontFamily: labelStyle.fontFamily,
      fontSize: labelStyle.fontSize,
      lineHeight: labelStyle.lineHeight,
      fontWeight: labelStyle.fontWeight,
      letterSpacing: labelStyle.letterSpacing,
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
      borderWidth: FAB_FOCUS_RING_WIDTH,
      borderColor: theme.colors.secondary,
    },
    focusRingSmall: {
      borderRadius: theme.shape.cornerMedium + FAB_FOCUS_RING_OFFSET,
    },
    focusRingMedium: {
      borderRadius: theme.shape.cornerLarge + FAB_FOCUS_RING_OFFSET,
    },
    focusRingLarge: {
      borderRadius: theme.shape.cornerExtraLarge + FAB_FOCUS_RING_OFFSET,
    },
  })
}
