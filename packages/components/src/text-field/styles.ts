import type { MaterialTheme } from '@rootnative/core'
import { alphaColor, transformOrigin } from '@rootnative/utils'
import { Platform, StyleSheet } from 'react-native'
import type { TextFieldVariant } from './types'

// RN-Web only: suppress the browser's default focus outline. The field's
// active indicator (filled) or thickened outline (outlined) is the focus
// signal, so the UA outline is redundant noise on web. `outline-style: none`
// is the canonical CSS reset; RN's types restrict the union to solid/dotted/
// dashed, so we cast — the value at runtime is still the string 'none' and
// RN-Web translates it to the right CSS.
const webOutlineReset =
  Platform.OS === 'web' ? { outlineStyle: 'none' as 'solid' } : null

const CONTAINER_HEIGHT = 56
const ICON_SIZE = 24
const LABEL_FLOATED_LINE_HEIGHT = 16

// Filled: label floated 8dp from top, input at 24dp (8 + 16 label height), 8dp bottom.
// Label resting = vertically centered = (56 - 24) / 2 = 16dp from top.
const FILLED_LABEL_RESTING_TOP = 16
const FILLED_LABEL_FLOATED_TOP = 8
const FILLED_INPUT_TOP = 24 // 8dp label top + 16dp label line-height
const FILLED_INPUT_BOTTOM = 8

// Outlined: input centered 16dp top/bottom. Label resting = same 16dp.
// Label floated = centered on the border = -(lineHeight / 2).
const OUTLINED_INPUT_VERTICAL = 16
const OUTLINED_LABEL_RESTING_TOP = 16
const OUTLINED_LABEL_FLOATED_TOP = -(LABEL_FLOATED_LINE_HEIGHT / 2) // -8

export const labelPositions = {
  filledRestingTop: FILLED_LABEL_RESTING_TOP,
  filledFloatedTop: FILLED_LABEL_FLOATED_TOP,
  outlinedRestingTop: OUTLINED_LABEL_RESTING_TOP,
  outlinedFloatedTop: OUTLINED_LABEL_FLOATED_TOP,
} as const

interface VariantColors {
  backgroundColor: string
  borderColor: string
  focusedBorderColor: string
  errorBorderColor: string
  disabledBorderColor: string
  disabledBackgroundColor: string
  labelColor: string
  focusedLabelColor: string
  errorLabelColor: string
  disabledLabelColor: string
  textColor: string
  disabledTextColor: string
  placeholderColor: string
  supportingTextColor: string
  errorSupportingTextColor: string
  iconColor: string
  errorIconColor: string
  disabledIconColor: string
}

function getVariantColors(
  theme: MaterialTheme,
  variant: TextFieldVariant,
): VariantColors {
  const disabledOpacity = theme.stateLayer.disabledOpacity

  const common = {
    focusedBorderColor: theme.colors.primary,
    errorBorderColor: theme.colors.error,
    focusedLabelColor: theme.colors.primary,
    errorLabelColor: theme.colors.error,
    textColor: theme.colors.onSurface,
    disabledTextColor: alphaColor(theme.colors.onSurface, disabledOpacity),
    disabledLabelColor: alphaColor(theme.colors.onSurface, disabledOpacity),
    disabledBorderColor: alphaColor(theme.colors.onSurface, 0.12),
    placeholderColor: theme.colors.onSurfaceVariant,
    supportingTextColor: theme.colors.onSurfaceVariant,
    errorSupportingTextColor: theme.colors.error,
    iconColor: theme.colors.onSurfaceVariant,
    errorIconColor: theme.colors.error,
    disabledIconColor: alphaColor(theme.colors.onSurface, disabledOpacity),
  }

  if (variant === 'outlined') {
    return {
      ...common,
      backgroundColor: 'transparent',
      borderColor: theme.colors.outline,
      disabledBackgroundColor: 'transparent',
      labelColor: theme.colors.onSurfaceVariant,
    }
  }

  return {
    ...common,
    backgroundColor: theme.colors.surfaceContainerHighest,
    borderColor: theme.colors.onSurfaceVariant,
    disabledBackgroundColor: alphaColor(theme.colors.onSurface, 0.04),
    labelColor: theme.colors.onSurfaceVariant,
  }
}

export function createStyles(theme: MaterialTheme, variant: TextFieldVariant) {
  const colors = getVariantColors(theme, variant)
  const bodyLarge = theme.typography.bodyLarge
  const bodySmall = theme.typography.bodySmall
  const isFilled = variant === 'filled'

  return {
    colors,
    styles: StyleSheet.create({
      root: {
        alignSelf: 'stretch',
      },
      container: {
        minHeight: CONTAINER_HEIGHT,
        flexDirection: 'row',
        alignItems: 'stretch',
        backgroundColor: colors.backgroundColor,
        paddingHorizontal: theme.spacing.md,
        ...(isFilled
          ? {
              borderTopStartRadius: theme.shape.cornerExtraSmall,
              borderTopEndRadius: theme.shape.cornerExtraSmall,
            }
          : {
              // No border on the container itself for outlined — drawn by
              // the absolute borderLayer overlay below so the inner padding
              // box never shifts when the active border thickens.
              borderRadius: theme.shape.cornerExtraSmall,
            }),
      },
      containerDisabled: isFilled
        ? { backgroundColor: colors.disabledBackgroundColor }
        : {},
      // Outlined border drawn as an absolute overlay so animating its width
      // (1 dp rest → 2 dp focus/error) never moves the container's padding
      // box. Without this, the absolute label and padding-anchored input
      // would both jump 1 dp on iOS at focus/blur.
      borderLayer: isFilled
        ? { display: 'none' }
        : {
            position: 'absolute',
            top: 0,
            start: 0,
            end: 0,
            bottom: 0,
            borderRadius: theme.shape.cornerExtraSmall,
            borderWidth: 1,
            borderColor: colors.borderColor,
          },
      indicator: {
        position: 'absolute',
        start: 0,
        end: 0,
        bottom: 0,
        height: 1,
        backgroundColor: colors.borderColor,
      },
      indicatorDisabled: {
        backgroundColor: colors.disabledBorderColor,
      },
      // MD3 filled hover state-layer overlay. Solid color, opacity is animated.
      // Matches the container's top corner radius so it doesn't bleed past
      // the rounded edges; bottom is straight to align with the indicator.
      hoverLayer: isFilled
        ? {
            position: 'absolute',
            top: 0,
            start: 0,
            end: 0,
            bottom: 0,
            backgroundColor: theme.colors.onSurface,
            borderTopStartRadius: theme.shape.cornerExtraSmall,
            borderTopEndRadius: theme.shape.cornerExtraSmall,
          }
        : { display: 'none' },
      inputWrapper: {
        flex: 1,
        justifyContent: 'center',
      },
      // When label is present, use explicit padding so the input position
      // matches the label resting top exactly.
      inputWrapperWithLabel: {
        justifyContent: 'flex-start',
        paddingTop: isFilled ? FILLED_INPUT_TOP : OUTLINED_INPUT_VERTICAL,
        paddingBottom: isFilled ? FILLED_INPUT_BOTTOM : OUTLINED_INPUT_VERTICAL,
      },
      // Wrapper carries the position + transform. Putting them on a View
      // (rather than directly on Animated.Text) avoids fighting iOS text
      // rasterisation while the layer scales — text composition gets jittery
      // when a color worklet and a transform worklet target the same Text.
      labelWrapper: {
        position: 'absolute',
        zIndex: 1,
        transformOrigin: transformOrigin('top'),
      },
      // Outlined floated label notches the border by sitting on top of it
      // with the surface color filling the slot. Padding extends the notch
      // 4 dp on each side of the text so the border break reads cleanly.
      labelWrapperNotch: {
        paddingHorizontal: 4,
        backgroundColor: theme.colors.surface,
      },
      labelText: {
        fontFamily: bodySmall.fontFamily,
        fontSize: bodySmall.fontSize,
        lineHeight: bodySmall.lineHeight,
        fontWeight: bodySmall.fontWeight,
        letterSpacing: bodySmall.letterSpacing,
        color: colors.labelColor,
      },
      input: {
        fontFamily: bodyLarge.fontFamily,
        fontSize: bodyLarge.fontSize,
        lineHeight: bodyLarge.lineHeight,
        fontWeight: bodyLarge.fontWeight,
        letterSpacing: bodyLarge.letterSpacing,
        color: colors.textColor,
        paddingVertical: 0,
        paddingHorizontal: 0,
        margin: 0,
        includeFontPadding: false,
        ...webOutlineReset,
      },
      pressableReset: { ...webOutlineReset },
      inputDisabled: {
        color: colors.disabledTextColor,
      },
      leadingIcon: {
        alignSelf: 'center',
        marginStart: -4, // 16dp container padding → 12dp icon inset per M3
        marginEnd: theme.spacing.md,
        width: ICON_SIZE,
        height: ICON_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
      },
      trailingIcon: {
        alignSelf: 'center',
        marginStart: theme.spacing.md,
        marginEnd: -4, // 16dp container padding → 12dp icon inset per M3
        width: ICON_SIZE,
        height: ICON_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
      },
      trailingIconPressable: {
        alignSelf: 'center',
      },
      supportingTextRow: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.xs,
      },
      supportingText: {
        fontFamily: bodySmall.fontFamily,
        fontSize: bodySmall.fontSize,
        lineHeight: bodySmall.lineHeight,
        fontWeight: bodySmall.fontWeight,
        letterSpacing: bodySmall.letterSpacing,
        color: colors.supportingTextColor,
      },
      errorSupportingText: {
        color: colors.errorSupportingTextColor,
      },
    }),
  }
}
