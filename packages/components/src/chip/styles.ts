import type { MaterialTheme } from '@rootnative/core'
import { alphaColor, elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'
import type { ChipVariant } from './types'

export const CHIP_FOCUS_RING_OFFSET = 2
export const CHIP_FOCUS_RING_WIDTH = 3

export const CHIP_HEIGHT = 32

/**
 * Resting corner radius of a selected filter chip. MD3 Expressive draws it as
 * a pill, and at the default roundness `cornerLarge` (16dp) is exactly half
 * the chip height, so the pill is read from that token rather than from the
 * `cornerFull` sentinel — `applyRoundness` never scales the sentinel, so a
 * theme with `roundness: 0` would still get a pill and could not express a
 * square selected chip. The cap keeps a rounder theme at a true pill.
 */
export function getChipSelectedRadius(theme: MaterialTheme): number {
  return Math.min(theme.shape.cornerLarge, CHIP_HEIGHT / 2)
}

/**
 * Resting corner radius per MD3 Expressive: selectable chips (filter/input)
 * sit at `cornerMedium` and morph from there (pill when selected, squarer
 * while pressed); assist/suggestion chips keep the static `cornerSmall`
 * baseline shape.
 */
export function getChipRestRadius(
  theme: MaterialTheme,
  variant: ChipVariant,
): number {
  return variant === 'filter' || variant === 'input'
    ? theme.shape.cornerMedium
    : theme.shape.cornerSmall
}

export interface VariantColors {
  backgroundColor: string
  textColor: string
  borderColor: string
  borderWidth: number
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
    result.backgroundColor = containerColor
    result.borderColor = containerColor
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
  const focusRingInset = -(CHIP_FOCUS_RING_OFFSET + CHIP_FOCUS_RING_WIDTH)
  const restRadius = getChipRestRadius(theme, variant)
  const focusRingRadius = restRadius + CHIP_FOCUS_RING_OFFSET

  return StyleSheet.create({
    wrapper: {
      alignSelf: 'flex-start' as const,
    },
    container: {
      alignItems: 'center',
      flexDirection: 'row',
      height: CHIP_HEIGHT,
      paddingStart: hasLeadingContent ? 8 : 16,
      paddingEnd: hasTrailingContent ? 8 : 16,
      borderRadius: restRadius,
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
    // Absolutely-positioned shadow carrier behind the container: `useShadow`
    // interpolates it from level 1 (rest) → level 2 (hover) per MD3 while the
    // selection and press morphs drive its radius, so the shadow keeps the
    // container's shape. It has to be a separate node — the container sets
    // `overflow: 'hidden'`, and a clipped view's own shadow is clipped away on
    // iOS (see Card.tsx). The static level-1 shadow is the rest baseline the
    // animated style then owns.
    elevationLayer: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: restRadius,
      backgroundColor: colors.backgroundColor,
      ...elevationLevel1,
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
