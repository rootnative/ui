import type { ElevationLevel } from '@rootnative/core'
import type { ShadowConfig } from '@rootnative/inertia'
import { Platform } from 'react-native'

/**
 * One elevation level as a CSS `box-shadow` string.
 *
 * Shared by the web branch of {@link elevationShadowConfig} and by the
 * non-interactive elevated Card, which needs this surface on **iOS** as well:
 * iOS paints a clipping view's own `shadow*` inside the clip, but when a view
 * clips *and* declares `boxShadow`, Fabric moves its subviews into a separate
 * container view and paints the shadow as unclipped "overflow ink"
 * (`RCTViewComponentView.mm`, `styleWouldClipOverflowInk` →
 * `currentContainerView`). That makes the surface swap a complete fix with no
 * change to the view tree.
 *
 * New-architecture only, which RN 0.81 defaults to. On old arch `RCTView.m`
 * renders neither, so such a node stays flat — no worse than the `shadow*` it
 * replaces, which was already clipped away there.
 *
 * The blur is `shadowRadius` as written. That matches react-native-web, which
 * emits the same key as the CSS blur radius 1:1
 * (`StyleSheet/preprocess.js`), so a browser gets what every other web shadow
 * in the library gets. It does **not** match what React Native itself does
 * with a `boxShadow` — see {@link elevationBoxShadowForFabric}, which is the
 * one caller that must compensate.
 *
 * `shadowOpacity: 0` maps to `'none'`, which inertia parses to zero layers.
 */
export function elevationBoxShadow(level: ElevationLevel): string {
  const { shadowOffset, shadowOpacity, shadowRadius } = level

  if (shadowOpacity === 0) return 'none'

  return `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px rgba(0, 0, 0, ${shadowOpacity})`
}

/**
 * `elevationBoxShadow` for the one caller that hands the string to **React
 * Native** instead of to a browser.
 *
 * Fabric renders a `boxShadow` on iOS through a `CALayer`, and halves the blur
 * on the way: `shadowLayer.shadowRadius = shadow.blurRadius / 2`
 * (`React/Fabric/Utils/RCTBoxShadow.mm`), an adjustment whose own comment says
 * it exists to make the blur "look more like the web". So a token handed over
 * unchanged paints at **half** the softness of that same token on the
 * `shadow*` keys beside it — `level1` reaches the screen as a radius of 1
 * rather than 2. Doubling first cancels the halving, so one token means one
 * shadow on one platform.
 *
 * **Do not use this for the web branch.** A browser takes the CSS number as
 * written, and react-native-web emits `shadowRadius` as the blur radius 1:1,
 * so doubling there would make every web shadow in the library twice as soft.
 * The two conventions genuinely disagree upstream, and that disagreement is
 * recorded as R9 in the workspace DX feedback rather than resolved here.
 *
 * Internal: exported for `card/styles.ts`, not re-exported from the package
 * entry. Adding it to the public surface would ask consumers to know which of
 * two renderers they are writing for.
 */
export function elevationBoxShadowForFabric(level: ElevationLevel): string {
  return elevationBoxShadow({ ...level, shadowRadius: level.shadowRadius * 2 })
}

/**
 * Convert a theme elevation level into one endpoint of a `useShadow` tween.
 *
 * ```tsx
 * // `useAnimation` gates on reduced motion; `useSpring` does not.
 * const progress = useAnimation(hovered ? 1 : 0)
 * const shadowStyle = useShadow({
 *   from: elevationShadowConfig(theme.elevation.level1),
 *   to: elevationShadowConfig(theme.elevation.level2),
 *   progress,
 * })
 * ```
 *
 * Mirrors `elevationStyle` from `@rootnative/utils` — the static counterpart
 * of this helper — including its platform split: web gets the CSS `boxShadow`
 * surface react-native-web actually renders, native gets the classic
 * `shadow*`/`elevation` keys.
 *
 * **Do not flatten the split and emit both keys.** RN 0.76+ on the new
 * architecture (the default in 0.81) renders `boxShadow` natively as well, so
 * a config carrying both would apply two shadow systems to the same view and
 * let whichever the view resolves last win. This is also why
 * `theme.elevation.level*` carries no `boxShadow` field: a token that holds
 * both shapes at once cannot be handed to `useShadow` on any platform.
 *
 * `shadowOpacity: 0` maps to `boxShadow: 'none'`, which inertia parses to zero
 * layers; paired against a real level it pads with an invisible layer and
 * fades in, CSS-transition style.
 */
export function elevationShadowConfig(level: ElevationLevel): ShadowConfig {
  if (Platform.OS === 'web') {
    return { boxShadow: elevationBoxShadow(level) }
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
