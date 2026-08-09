import { I18nManager, Platform } from 'react-native'

/**
 * Whether the current layout direction is right-to-left.
 *
 * Native reads `I18nManager`, which is the real thing: the app is relaunched
 * into RTL and the flag is fixed for the process.
 *
 * **Web cannot use `I18nManager` at all.** react-native-web ships it as a
 * hardcoded stub — `getConstants()` returns `{isRTL: false}` and `forceRTL` is
 * a no-op (`react-native-web/dist/cjs/exports/I18nManager/index.js`). It is not
 * wired to anything, so on web it reports LTR forever no matter how the page is
 * actually laid out.
 *
 * That mattered because RNW *does* mirror layout correctly on its own: it emits
 * CSS logical properties (`padding-inline-start`, not `padding-left`), which the
 * browser resolves against the inherited `direction`. So a page under
 * `<html dir="rtl">` mirrored its boxes while every JS `isRTL` branch in the
 * library still answered "LTR" — a back arrow pointing the wrong way inside a
 * correctly mirrored bar.
 *
 * So on web the browser is the source of truth, read from the document element's
 * resolved `direction`. That is the same value the logical properties resolve
 * against, which is what keeps the JS branches and the CSS agreeing.
 *
 * Deliberately read per call rather than cached: `dir` is a DOM attribute a
 * consumer can flip at runtime (a language switcher), unlike the native flag
 * which is fixed until relaunch. These calls sit in render paths and icon
 * lookups, not hot loops.
 */
function isRTL(): boolean {
  if (Platform.OS !== 'web') return I18nManager.isRTL

  // Guard for SSR / non-DOM web runtimes, where `document` does not exist.
  if (typeof document === 'undefined') return false

  const element = document.documentElement
  if (!element) return false

  // `getComputedStyle` resolves inheritance and the UA default, so this is
  // right whether the consumer sets `dir="rtl"`, `style="direction:rtl"`, or a
  // stylesheet rule. It reports the *document* direction — a subtree that opts
  // into the opposite direction mirrors via CSS, but is not detectable here
  // without an element to measure against, which these call sites do not have.
  if (typeof getComputedStyle === 'function') {
    const direction = getComputedStyle(element).direction
    // jsdom leaves this empty rather than resolving the UA default, so fall
    // through to the attribute instead of reporting LTR off an unset value.
    if (direction) return direction === 'rtl'
  }

  return element.getAttribute('dir') === 'rtl'
}

/**
 * Returns the appropriate transform origin for animations that scale
 * from a horizontal edge (e.g. label shrink in TextField).
 */
export function transformOrigin(
  vertical: 'top' | 'center' | 'bottom' = 'top',
): string {
  return isRTL() ? `right ${vertical}` : `left ${vertical}`
}

/**
 * Picks a value based on layout direction.
 * Useful for selecting mirrored icons or other direction-dependent values.
 */
export function selectRTL<T>(ltr: T, rtl: T): T {
  return isRTL() ? rtl : ltr
}

/**
 * The layout direction, for the places that need the boolean itself rather than
 * a choice between two values — Slider threads it through track geometry and
 * keyboard handling, where `selectRTL` would mean a dozen two-arm calls.
 *
 * Prefer `selectRTL` when you are choosing between two values: it keeps the
 * direction check next to the thing it decides.
 */
export function isRTLDirection(): boolean {
  return isRTL()
}
