import type { ElevationLevel } from '@rootnative/core'
import { Platform } from 'react-native'

/**
 * The style `elevationStyle` returns. It names only the keys it sets, with
 * plain value types. A `ViewStyle` return expands to React Native's internal
 * style types when it is spread into `StyleSheet.create`, and React Native
 * 0.88 does not export those, so a `.d.ts` could not name the result
 * (TS2742).
 */
export interface ElevationStyle {
  shadowColor?: string
  shadowOffset?: { width: number; height: number }
  shadowOpacity?: number
  shadowRadius?: number
  elevation?: number
  boxShadow?: string
}

/**
 * Converts a theme elevation level into platform-appropriate shadow styles.
 * - Native: returns { shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation }
 * - Web: returns { boxShadow }
 *
 * Gotcha: the return shape differs by platform. Both are typed as ViewStyle,
 * but spreading the result and overriding individual shadow* props silently
 * no-ops on web — the shadow is baked into the boxShadow string. To customize,
 * modify the ElevationLevel before calling, or branch on Platform.OS.
 */
export function elevationStyle(level: ElevationLevel): ElevationStyle {
  if (Platform.OS === 'web') {
    const { shadowOffset, shadowOpacity, shadowRadius } = level

    if (shadowOpacity === 0) {
      return { boxShadow: 'none' }
    }

    return {
      boxShadow: `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px rgba(0, 0, 0, ${shadowOpacity})`,
    }
  }

  return {
    shadowColor: level.shadowColor,
    shadowOffset: {
      width: level.shadowOffset.width,
      height: level.shadowOffset.height,
    },
    shadowOpacity: level.shadowOpacity,
    shadowRadius: level.shadowRadius,
    elevation: level.elevation,
  }
}
