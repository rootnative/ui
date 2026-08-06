import type { MaterialTheme } from '@rootnative/core'
import { alphaColor, blendColor, elevationStyle } from '@rootnative/utils'
import { Platform, StyleSheet } from 'react-native'
import { elevationBoxShadow } from '../internal/elevationShadow'
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
  const disabledContainerColor = alphaColor(
    theme.colors.onSurface,
    theme.stateLayer.disabledContainerOpacity,
  )
  const disabledOutlineColor = alphaColor(
    theme.colors.onSurface,
    theme.stateLayer.disabledContainerOpacity,
  )

  if (variant === 'outlined') {
    return {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outlineVariant,
      borderWidth: 1,
      hoveredBackgroundColor: blendStateLayer(
        theme.colors.surface,
        theme.colors.onSurface,
        theme.stateLayer.hoveredOpacity,
      ),
      focusedBackgroundColor: blendStateLayer(
        theme.colors.surface,
        theme.colors.onSurface,
        theme.stateLayer.focusedOpacity,
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
        theme.stateLayer.focusedOpacity,
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
    backgroundColor: theme.colors.surfaceContainerLow,
    borderColor: 'transparent',
    borderWidth: 0,
    hoveredBackgroundColor: blendColor(
      theme.colors.surfaceContainerLow,
      theme.colors.onSurface,
      theme.stateLayer.hoveredOpacity,
    ),
    focusedBackgroundColor: blendColor(
      theme.colors.surfaceContainerLow,
      theme.colors.onSurface,
      theme.stateLayer.focusedOpacity,
    ),
    pressedBackgroundColor: blendColor(
      theme.colors.surfaceContainerLow,
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
      theme.stateLayer.focusedOpacity,
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
    // iOS-only rescue for the non-interactive elevated Card, which has no
    // carrier and so carries its own shadow on the clipping container.
    //
    // iOS paints a clipping view's own `shadow*` inside the clip, which left
    // that card flat. The CSS `boxShadow` surface does not have the problem:
    // when a view clips *and* declares `boxShadow`, Fabric moves its subviews
    // into a separate container view and paints the shadow as unclipped
    // "overflow ink". So iOS swaps the shadow *surface* instead of
    // restructuring the tree — no wrapper above the container, no inner clip
    // view, so consumer `style` keeps landing on the one node it always did and
    // every layout prop on it (`flex`, `flexDirection`, `gap`) behaves
    // unchanged. Both structural alternatives break one of those; see Card.tsx.
    //
    // `shadowOpacity: 0` drops the clipped surface, so the node never carries
    // two shadow systems. Android needs nothing (the parent draws the
    // `elevation` shadow from the child's outline) and web already gets
    // `boxShadow` from `elevationStyle`.
    overflowInkElevation:
      Platform.OS === 'ios'
        ? {
            shadowOpacity: 0,
            boxShadow: elevationBoxShadow(theme.elevation.level1),
          }
        : {},
    // Container shadow is zeroed when the elevation carrier below owns the
    // elevation (interactive elevated cards).
    elevationDelegated: {
      ...elevationLevel0,
    },
    // Absolutely-positioned shadow carrier behind the container: `useShadow`
    // interpolates it from level 1 (rest) → level 2 (hover) per MD3. It exists
    // rather than putting the shadow on the container because the container
    // clips (`overflow: 'hidden'`), and a clipped view's own shadow is clipped
    // away on iOS. The static level-1 shadow is the rest baseline the animated
    // style then owns.
    elevationLayer: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: theme.shape.cornerMedium,
      backgroundColor: colors.backgroundColor,
      ...elevationLevel1,
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
