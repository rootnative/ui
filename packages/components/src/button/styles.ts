import type { MaterialTheme, TypographyToken } from '@rootnative/core'
import { alphaColor, elevationStyle } from '@rootnative/utils'
import { StyleSheet } from 'react-native'
import { focusRingBox, focusRingOutset } from '../internal/focusRing'
import type { ExpressiveSize } from '../internal/size'
import type { ButtonShape, ButtonVariant } from './types'

export const BUTTON_FOCUS_RING_OFFSET = 2
export const BUTTON_FOCUS_RING_WIDTH = 3

/**
 * Stroke of the `loading` spinner as a share of the icon size: 2dp at the
 * 20dp icon of the default size. The `CircularProgress` ratio (4dp at 48dp)
 * gives a line too thin to see at icon size.
 */
export const BUTTON_LOADING_STROKE_RATIO = 0.1

type ShapeCorner = Exclude<keyof MaterialTheme['shape'], 'roundness'>

/**
 * Per-size Expressive geometry (androidx `Button<Size>Tokens.kt`). `height`,
 * `iconSize`, and `paddingVertical` are absolute dp; `padding` is the base
 * horizontal inset; `labelRole`/`iconLabelRole` name the typography variant
 * (icon-bearing sizes step down to the icon-adjacent role where the spec
 * uses the emphasized/label form — here we keep one role per size, matching
 * Compose's `textStyleFor(height)`); `outlineWidth` is the outlined-variant
 * border. `squareCorner` names the `theme.shape` token of the resting corner
 * of the `'square'` shape; `pressedCorner` names the token of the morph
 * target both shapes squash toward on press. `'round'` always rests as a
 * pill (radius = height / 2).
 */
export interface ButtonSizeTokens {
  height: number
  iconSize: number
  padding: number
  paddingVertical: number
  labelRole: keyof MaterialTheme['typography']
  outlineWidth: number
  squareCorner: ShapeCorner
  pressedCorner: ShapeCorner
}

const BUTTON_SIZE_TOKENS: Record<ExpressiveSize, ButtonSizeTokens> = {
  extraSmall: {
    height: 32,
    iconSize: 20,
    padding: 12,
    paddingVertical: 6,
    labelRole: 'labelLarge',
    outlineWidth: 1,
    squareCorner: 'cornerMedium',
    pressedCorner: 'cornerSmall',
  },
  small: {
    height: 40,
    iconSize: 20,
    padding: 16,
    paddingVertical: 10,
    labelRole: 'labelLarge',
    outlineWidth: 1,
    squareCorner: 'cornerMedium',
    pressedCorner: 'cornerSmall',
  },
  medium: {
    height: 56,
    iconSize: 24,
    padding: 24,
    paddingVertical: 16,
    labelRole: 'titleMedium',
    outlineWidth: 1,
    squareCorner: 'cornerLarge',
    pressedCorner: 'cornerMedium',
  },
  large: {
    height: 96,
    iconSize: 32,
    padding: 48,
    paddingVertical: 32,
    labelRole: 'headlineSmall',
    outlineWidth: 2,
    squareCorner: 'cornerExtraLarge',
    pressedCorner: 'cornerLarge',
  },
  extraLarge: {
    height: 136,
    iconSize: 40,
    padding: 64,
    paddingVertical: 48,
    labelRole: 'headlineLarge',
    outlineWidth: 3,
    squareCorner: 'cornerExtraLarge',
    pressedCorner: 'cornerLarge',
  },
}

export function getButtonSizeTokens(size: ExpressiveSize): ButtonSizeTokens {
  return BUTTON_SIZE_TOKENS[size]
}

/**
 * Resting and pressed corner radii for the shape morph, in dp. `'round'`
 * rests as a pill (half the container height — never the `cornerFull`
 * sentinel 999, which would park the morph in the clamped range); `'square'`
 * rests at the theme corner that `squareCorner` names. A selected toggle
 * inverts the shape (Compose `ToggleButtonDefaults.shapesFor`). Both morph
 * toward the `pressedCorner` corner. A theme corner above the pill radius
 * stops at the pill, for the same reason.
 */
export function getButtonMorphRadii(
  theme: MaterialTheme,
  size: ExpressiveSize,
  shape: ButtonShape,
  selected = false,
): { rest: number; pressed: number } {
  const tokens = BUTTON_SIZE_TOKENS[size]
  const pill = tokens.height / 2
  const corner = (token: ShapeCorner) => Math.min(theme.shape[token], pill)
  const restsRound = (shape === 'round') !== selected
  return {
    rest: restsRound ? pill : corner(tokens.squareCorner),
    pressed: corner(tokens.pressedCorner),
  }
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

  // Expressive tokens (androidx `OutlinedButtonTokens`): a neutral label on an
  // `outlineVariant` border. The baseline spec used `primary` and `outline`.
  if (variant === 'outlined') {
    return {
      backgroundColor: 'transparent',
      textColor: theme.colors.onSurfaceVariant,
      borderColor: theme.colors.outlineVariant,
      borderWidth: 1,
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
    disabledBackgroundColor: disabledContainerColor,
    disabledTextColor: disabledLabelColor,
    disabledBorderColor: disabledContainerColor,
  }
}

/**
 * Toggle colors per variant (androidx `FilledButtonTokens`,
 * `TonalButtonTokens`, `OutlinedButtonTokens`, `ElevatedButtonTokens`:
 * `Unselected*` and `Selected*`). MD3 has no text toggle, so `'text'` keeps
 * its plain colors. The disabled colors are the same as the plain button.
 */
function getToggleColors(
  theme: MaterialTheme,
  variant: ButtonVariant,
  selected: boolean,
  plain: VariantColors,
): VariantColors {
  const { colors } = theme

  if (variant === 'outlined') {
    if (!selected) return plain
    // A selected outlined toggle has no outline, so it takes the disabled
    // treatment of a filled button.
    return {
      ...plain,
      backgroundColor: colors.inverseSurface,
      textColor: colors.inverseOnSurface,
      borderColor: colors.inverseSurface,
      borderWidth: 0,
      disabledBackgroundColor: plain.disabledBorderColor,
      disabledBorderColor: plain.disabledBorderColor,
    }
  }

  let container: string
  let content: string
  if (variant === 'filled') {
    container = selected ? colors.primary : colors.surfaceContainer
    content = selected ? colors.onPrimary : colors.onSurfaceVariant
  } else if (variant === 'tonal') {
    container = selected ? colors.secondary : colors.secondaryContainer
    content = selected ? colors.onSecondary : colors.onSecondaryContainer
  } else if (variant === 'elevated') {
    container = selected ? colors.primary : colors.surfaceContainerLow
    content = selected ? colors.onPrimary : colors.primary
  } else {
    return plain
  }

  return {
    ...plain,
    backgroundColor: container,
    textColor: content,
    borderColor: container,
  }
}

function getHorizontalPadding(
  theme: MaterialTheme,
  variant: ButtonVariant,
  size: ExpressiveSize,
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
  // token, and the icon side tightens by one step. `small` keeps the
  // pre-Expressive 24/16 values (base 24, icon side 16) for back-compat; the
  // Expressive size tokens (12/16/24/48/64) drive the rest, with the icon
  // side tightened proportionally (never below spacing.sm).
  const base =
    size === 'small' ? theme.spacing.lg : getButtonSizeTokens(size).padding
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
    result.backgroundColor = containerColor
    result.borderColor = containerColor
  }

  return result
}

/**
 * `selected` is `undefined` for a plain button, and the toggle state for a
 * toggle.
 */
export function getResolvedButtonColors(
  theme: MaterialTheme,
  variant: ButtonVariant,
  selected: boolean | undefined,
  containerColor?: string,
  contentColor?: string,
): VariantColors {
  const plain = getVariantColors(theme, variant)
  return applyColorOverrides(
    theme,
    selected === undefined
      ? plain
      : getToggleColors(theme, variant, selected, plain),
    containerColor,
    contentColor,
  )
}

export function createStyles(
  theme: MaterialTheme,
  variant: ButtonVariant,
  size: ExpressiveSize,
  shape: ButtonShape,
  selected: boolean | undefined,
  hasLeadingIcon: boolean,
  hasTrailingIcon: boolean,
  containerColor?: string,
  contentColor?: string,
) {
  const colors = getResolvedButtonColors(
    theme,
    variant,
    selected,
    containerColor,
    contentColor,
  )
  const sizeTokens = getButtonSizeTokens(size)
  const labelStyle: TypographyToken = theme.typography[sizeTokens.labelRole]
  const restCorner = getButtonMorphRadii(theme, size, shape, selected).rest
  const padding = getHorizontalPadding(
    theme,
    variant,
    size,
    hasLeadingIcon,
    hasTrailingIcon,
  )
  // Outlined variant overrides the color-derived border width with the
  // size-specific outline (1/1/1/2/3 dp); other variants keep 0. A selected
  // outlined toggle has no outline.
  const borderWidth =
    variant === 'outlined' && colors.borderWidth > 0
      ? sizeTokens.outlineWidth
      : colors.borderWidth
  // React Native, and react-native-web with `border-box`, put the border
  // inside the box, outside the padding. MD3 draws the outline inside the
  // token container, so the padding gives up the border width, and an
  // outlined button keeps the height and width of the other variants.
  const elevationLevel0 = elevationStyle(theme.elevation.level0)
  const elevationLevel1 = elevationStyle(theme.elevation.level1)

  return StyleSheet.create({
    wrapper: {
      alignItems: 'flex-start' as const,
    },
    container: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      minWidth: 58,
      minHeight: sizeTokens.height,
      paddingStart: padding.paddingStart - borderWidth,
      paddingEnd: padding.paddingEnd - borderWidth,
      paddingVertical: sizeTokens.paddingVertical - borderWidth,
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
    // Absolutely-positioned shadow carrier behind the container: `useShadow`
    // interpolates it from level 1 (rest) → level 2 (hover) per MD3 while the
    // press morph drives its radius, so the shadow keeps the container's
    // shape. It is a separate node rather than the container itself for the
    // reason spelled out in Card.tsx. The static level-1 shadow is the rest
    // baseline the animated style then owns.
    elevationLayer: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: restCorner,
      backgroundColor: colors.backgroundColor,
      ...elevationLevel1,
    },
    focusRing: {
      ...focusRingBox(
        BUTTON_FOCUS_RING_OFFSET,
        BUTTON_FOCUS_RING_WIDTH,
        theme.colors.secondary,
      ),
      borderRadius:
        restCorner +
        focusRingOutset(BUTTON_FOCUS_RING_OFFSET + BUTTON_FOCUS_RING_WIDTH),
    },
    label: {
      fontFamily: labelStyle.fontFamily,
      fontSize: labelStyle.fontSize,
      lineHeight: labelStyle.lineHeight,
      fontWeight: labelStyle.fontWeight,
      letterSpacing: labelStyle.letterSpacing,
      color: colors.textColor,
    },
    // Button.tsx gives each icon slot a box of the icon size. On the web, a
    // glyph from an icon font can be 1 px taller than its font size
    // (`line-height: normal`, 21 px at 20 px), and the button grew with it.
    leadingIcon: {
      alignItems: 'center',
      justifyContent: 'center',
      marginEnd: theme.spacing.sm,
    },
    trailingIcon: {
      alignItems: 'center',
      justifyContent: 'center',
      marginStart: theme.spacing.sm,
    },
    disabledLabel: {
      color: colors.disabledTextColor,
    },
  })
}
