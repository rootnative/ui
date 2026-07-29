import type { ElevationLevel } from '@rootnative/core'
import type { ShadowConfig } from '@rootnative/inertia'
import { Platform } from 'react-native'

/**
 * Convert a theme elevation level into one endpoint of a `useShadow` tween.
 *
 * Mirrors `elevationStyle` from `@rootnative/utils` — the static counterpart
 * of this helper — including its platform split: web gets the CSS `boxShadow`
 * surface react-native-web actually renders, native gets the classic
 * `shadow*`/`elevation` keys.
 *
 * The split is deliberate rather than emitting both on every platform: RN
 * 0.76+ on the new architecture (the default in 0.81) renders `boxShadow`
 * natively as well, so a config carrying both would apply two shadow systems
 * to the same view and let whichever the view resolves last win.
 *
 * `shadowOpacity: 0` maps to `boxShadow: 'none'`, which inertia parses to zero
 * layers; paired against a real level it pads with an invisible layer and
 * fades in, CSS-transition style.
 */
export function elevationShadowConfig(level: ElevationLevel): ShadowConfig {
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
