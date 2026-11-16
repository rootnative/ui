import { I18nManager, Platform } from 'react-native'

/**
 * Whether React Native applies `left` to the right side, and `right` to the
 * left side. It does that on native in RTL, while
 * `I18nManager.doLeftAndRightSwapInRTL` is on (the default). The web never
 * swaps.
 *
 * A view placed with `left` mirrors with the layout there. A value that is
 * physical does not: a `translateX`, or a coordinate inside an SVG. Use this
 * to mirror such a value where the platform mirrors the rest.
 */
export function swapsLeftAndRight(): boolean {
  return (
    Platform.OS !== 'web' &&
    I18nManager.isRTL &&
    I18nManager.doLeftAndRightSwapInRTL
  )
}
