import type { ElevationLevel } from '@rootnative/core'
import { Platform } from 'react-native'
import type { ViewStyle } from 'react-native'

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
export function elevationStyle(level: ElevationLevel): ViewStyle {
  if (Platform.OS === 'web') {
    const { shadowOffset, shadowOpacity, shadowRadius } = level

    if (shadowOpacity === 0) {
      return { boxShadow: 'none' } as ViewStyle
    }

    return {
      boxShadow: `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px rgba(0, 0, 0, ${shadowOpacity})`,
    } as ViewStyle
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
