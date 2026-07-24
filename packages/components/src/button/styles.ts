import type { MaterialTheme, TextStyle } from '@rootnative/core'
import { alphaColor, blendColor, elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'
import type { ButtonShape, ButtonSize, ButtonVariant } from './types'

export const BUTTON_FOCUS_RING_OFFSET = 2
export const BUTTON_FOCUS_RING_WIDTH = 3

/**
 * Per-size Expressive geometry (androidx `Button<Size>Tokens.kt`). `height`,
 * `iconSize`, and `paddingVertical` are absolute dp; `padding` is the base
 * horizontal inset; `labelRole`/`iconLabelRole` name the typography variant
 * (icon-bearing sizes step down to the icon-adjacent role where the spec
 * uses the emphasized/label form — here we keep one role per size, matching
 * Compose's `textStyleFor(height)`); `outlineWidth` is the outlined-variant
 * border. `squareCorner` is the resting corner of the `'square'` shape;
 * `pressedCorner` is the morph target both shapes squash toward on press.
 * `'round'` always rests as a pill (radius = height / 2).
 */
export interface ButtonSizeTokens {
  height: number
  iconSize: number
  padding: number
  paddingVertical: number
  labelRole: keyof MaterialTheme['typography']
  outlineWidth: number
  squareCorner: number
  pressedCorner: number
}

const BUTTON_SIZE_TOKENS: Record<ButtonSize, ButtonSizeTokens> = {
  xs: {
    height: 32,
    iconSize: 20,
    padding: 12,
    paddingVertical: 6,
    labelRole: 'labelLarge',
    outlineWidth: 1,
    squareCorner: 12,
    pressedCorner: 8,
  },
  s: {
    height: 40,
    iconSize: 20,
    padding: 16,
    paddingVertical: 10,
    labelRole: 'labelLarge',
    outlineWidth: 1,
    squareCorner: 12,
    pressedCorner: 8,
  },
  m: {
    height: 56,
    iconSize: 24,
    padding: 24,
    paddingVertical: 16,
    labelRole: 'titleMedium',
    outlineWidth: 1,
    squareCorner: 16,
    pressedCorner: 12,
  },
  l: {
    height: 96,
    iconSize: 32,
    padding: 48,
    paddingVertical: 32,
    labelRole: 'headlineSmall',
    outlineWidth: 2,
    squareCorner: 28,
    pressedCorner: 16,
  },
  xl: {
    height: 136,
    iconSize: 40,
    padding: 64,
    paddingVertical: 48,
    labelRole: 'headlineLarge',
    outlineWidth: 3,
    squareCorner: 28,
    pressedCorner: 16,
  },
}

export function getButtonSizeTokens(size: ButtonSize): ButtonSizeTokens {
  return BUTTON_SIZE_TOKENS[size]
}

/**
 * Resting and pressed corner radii for the shape morph, in dp. `'round'`
 * rests as a pill (half the container height — never the `cornerFull`
 * sentinel 999, which would park the morph in the clamped range); `'square'`
 * rests at the size's `squareCorner`. Both morph toward `pressedCorner`.
 */
export function getButtonMorphRadii(
  size: ButtonSize,
  shape: ButtonShape,
): { rest: number; pressed: number } {
  const tokens = BUTTON_SIZE_TOKENS[size]
  return {
    rest: shape === 'round' ? tokens.height / 2 : tokens.squareCorner,
    pressed: tokens.pressedCorner,
  }
}

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
  size: ButtonSize,
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

  // Filled/elevated/tonal/outlined: base horizontal padding is the size
  // token, and the icon side tightens by one step. `s` keeps the
  // pre-Expressive 24/16 values (base 24, icon side 16) for back-compat; the
  // Expressive size tokens (12/16/24/48/64) drive the rest, with the icon
  // side tightened proportionally (never below spacing.sm).
  const base =
    size === 's' ? theme.spacing.lg : getButtonSizeTokens(size).padding
  const iconSide = Math.max(theme.spacing.sm, base - theme.spacing.sm)
  return {
    paddingStart: hasLeadingIcon ? iconSide : base,
    paddingEnd: hasTrailingIcon ? iconSide : base,
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
  size: ButtonSize,
  shape: ButtonShape,
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
  const sizeTokens = getButtonSizeTokens(size)
  const labelStyle: TextStyle = theme.typography[sizeTokens.labelRole]
  const restCorner = getButtonMorphRadii(size, shape).rest
  const padding = getHorizontalPadding(
    theme,
    variant,
    size,
    hasLeadingIcon,
    hasTrailingIcon,
  )
  // Outlined variant overrides the color-derived border width with the
  // size-specific outline (1/1/1/2/3 dp); other variants keep 0.
  const borderWidth =
    variant === 'outlined' ? sizeTokens.outlineWidth : colors.borderWidth
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
      minHeight: sizeTokens.height,
      paddingStart: padding.paddingStart,
      paddingEnd: padding.paddingEnd,
      paddingVertical: sizeTokens.paddingVertical,
      borderRadius: restCorner,
      borderColor: colors.borderColor,
      borderWidth,
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
      borderRadius: restCorner,
      backgroundColor: colors.backgroundColor,
      ...elevationLevel1,
    },
    elevationLayerLevel2: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: restCorner,
      backgroundColor: colors.backgroundColor,
      ...elevationLevel2,
    },
    focusRing: {
      position: 'absolute' as const,
      top: focusRingInset,
      left: focusRingInset,
      right: focusRingInset,
      bottom: focusRingInset,
      borderRadius:
        restCorner + BUTTON_FOCUS_RING_OFFSET + BUTTON_FOCUS_RING_WIDTH,
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
