import type { MaterialTheme } from '@rootnative/core'
import { StyleSheet } from 'react-native'

/** MD3 default container diameter (dp). */
export const LOADING_INDICATOR_SIZE = 48
/** Active-indicator size (dp) — the morphing polygon fits inside this. */
export const LOADING_INDICATOR_ACTIVE_SIZE = 38
/** Active / container ratio, per the 38dp-in-48dp spec. */
export const LOADING_INDICATOR_ACTIVE_RATIO =
  LOADING_INDICATOR_ACTIVE_SIZE / LOADING_INDICATOR_SIZE

export interface LoadingIndicatorColors {
  indicator: string
  container: string
}

/**
 * Resolve indicator + container colors. Uncontained defaults to `primary`
 * on a transparent container; contained defaults to `onPrimaryContainer` on
 * a `primaryContainer` fill. Overrides win per the standard contract.
 */
export function getLoadingIndicatorColors(
  theme: MaterialTheme,
  contained: boolean,
  indicatorColor?: string,
  containerColor?: string,
): LoadingIndicatorColors {
  if (contained) {
    return {
      indicator: indicatorColor ?? theme.colors.onPrimaryContainer,
      container: containerColor ?? theme.colors.primaryContainer,
    }
  }
  return {
    indicator: indicatorColor ?? theme.colors.primary,
    container: 'transparent',
  }
}

export function createStyles(size: number) {
  return StyleSheet.create({
    root: {
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    },
    container: {
      width: size,
      height: size,
      // Fully rounded — the contained variant is a circle.
      borderRadius: size / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
}
