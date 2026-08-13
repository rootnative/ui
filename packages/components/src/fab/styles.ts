import type { MaterialTheme } from '@rootnative/core'
import { alphaColor, blendColor, elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'
import type { FABSize, FABVariant } from './types'

export const FAB_FOCUS_RING_OFFSET = 2
export const FAB_FOCUS_RING_WIDTH = 3

/**
 * Container height in dp for each FAB size, per MD3. Exported because a FAB is
 * the usual reason to raise `SnackbarProvider`'s `bottomOffset`, and a consumer
 * computing that clearance should read the real number rather than hard-code
 * one that silently goes stale when a size changes. See `snackbarOffsetForFAB`.
 *
 * `extended` is the label form, which is always 56dp and ignores `size`.
 */
export const FAB_SIZES = {
  small: 40,
  medium: 56,
  large: 96,
  extended: 56,
} as const

/** Icon size in dp for each FAB size. `large` is the only one that differs. */
export const FAB_ICON_SIZES = {
  small: 24,
  medium: 24,
  large: 36,
  extended: 24,
} as const

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
  return {
    hoveredBackgroundColor: blendColor(
      backgroundColor,
      overlay,
      theme.stateLayer.hoveredOpacity,
    ),
    focusedBackgroundColor: blendColor(
      backgroundColor,
      overlay,
      theme.stateLayer.focusedOpacity,
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
    // Per MD3: DisabledContainerOpacity = 0.12, DisabledContentOpacity = 0.38
    disabledBackgroundColor: alphaColor(
      theme.colors.onSurface,
      theme.stateLayer.disabledContainerOpacity,
    ),
    disabledContentColor: alphaColor(
      theme.colors.onSurface,
      theme.stateLayer.disabledOpacity,
    ),
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
  return FAB_ICON_SIZES[size]
}

export function createStyles(theme: MaterialTheme) {
  const focusRingInset = -(FAB_FOCUS_RING_OFFSET + FAB_FOCUS_RING_WIDTH)
  const elevationLevel3 = elevationStyle(theme.elevation.level3)
  const labelStyle = theme.typography.labelLarge

  return StyleSheet.create({
    wrapper: {
      alignSelf: 'flex-start' as const,
    },
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
    // Absolutely-positioned shadow carrier behind the container: `useShadow`
    // interpolates it from level 3 (rest) → level 4 (hover) per MD3. It is a
    // separate node rather than the container itself because the container
    // clips, and a clipped view's own shadow is clipped away on iOS. The
    // background color is applied dynamically in the component (it depends on
    // the resolved container color); the static level-3 shadow is the rest
    // baseline the animated style then owns.
    elevationLayer: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      ...elevationLevel3,
    },
    elevationLayerRadiusSmall: {
      borderRadius: theme.shape.cornerMedium,
    },
    elevationLayerRadiusMedium: {
      borderRadius: theme.shape.cornerLarge,
    },
    elevationLayerRadiusLarge: {
      borderRadius: theme.shape.cornerExtraLarge,
    },
    sizeSmall: {
      width: FAB_SIZES.small,
      height: FAB_SIZES.small,
      borderRadius: theme.shape.cornerMedium,
    },
    sizeMedium: {
      width: FAB_SIZES.medium,
      height: FAB_SIZES.medium,
      borderRadius: theme.shape.cornerLarge,
    },
    sizeLarge: {
      width: FAB_SIZES.large,
      height: FAB_SIZES.large,
      borderRadius: theme.shape.cornerExtraLarge,
    },
    extended: {
      flexDirection: 'row',
      height: FAB_SIZES.extended,
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
