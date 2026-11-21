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
 * That mattered because the browser mirrors part of the layout on its own: a
 * flex row runs from the right under the inherited `direction`. So a page under
 * `<html dir="rtl">` mirrored its rows while every JS `isRTL` branch in the
 * library still answered "LTR" — a back arrow pointing the wrong way inside a
 * mirrored bar.
 *
 * So on web the browser is the source of truth, read from the document element's
 * resolved `direction`. The browser lays out the rows from the same value, so
 * the JS branches and the layout agree. react-native-web doesn't follow it for
 * a logical style key: see `resolveLogicalKey`.
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
  // into the opposite direction is not detectable here without an element to
  // measure against, which these call sites do not have.
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

/**
 * The logical style keys that a style cannot carry on web under
 * `<html dir="rtl">`.
 */
export type LogicalStyleKey =
  | 'start'
  | 'end'
  | 'marginStart'
  | 'marginEnd'
  | 'paddingStart'
  | 'paddingEnd'

type PhysicalStyleKey =
  | 'left'
  | 'right'
  | 'marginLeft'
  | 'marginRight'
  | 'paddingLeft'
  | 'paddingRight'

/** The physical key of each logical key in an RTL layout. */
const RTL_PHYSICAL_KEYS: Record<LogicalStyleKey, PhysicalStyleKey> = {
  start: 'right',
  end: 'left',
  marginStart: 'marginRight',
  marginEnd: 'marginLeft',
  paddingStart: 'paddingRight',
  paddingEnd: 'paddingLeft',
}

/**
 * The key to write for a logical inset in a style.
 *
 * react-native-web resolves a logical key in JavaScript, from the `dir` or
 * `lang` prop of the nearest `View` or from its locale context, which is LTR
 * by default. The `dir` attribute of the document doesn't change it. A style
 * from `StyleSheet.create` is no exception: react-native-web compiles one class
 * for each direction and picks one from the same context. So `{ start: 56 }`
 * is `left: 56px` under `<html dir="rtl">`, and the element sits at the wrong
 * edge.
 *
 * So on web under an RTL document this returns the physical key. In each other
 * case it returns the logical key itself: native resolves it, and on web in
 * LTR react-native-web puts it on the correct side. The logical key keeps the
 * precedence of a later style that sets the same key. react-native-web merges
 * styles by key name, so a consumer `paddingStart` replaces a `paddingStart`
 * of the library, but not a `paddingLeft`.
 */
export function resolveLogicalKey(key: LogicalStyleKey): string {
  if (Platform.OS !== 'web' || !isRTL()) return key
  return RTL_PHYSICAL_KEYS[key]
}

/**
 * An inline style fragment for one logical inset, resolved with
 * `resolveLogicalKey`. Spread it into the style object.
 *
 * @example
 * const titleInset = useMemo(
 *   () => ({ ...resolveLogical('start', 56), ...resolveLogical('end', 104) }),
 *   [],
 * )
 */
export function resolveLogical<T extends number | undefined>(
  key: LogicalStyleKey,
  value: T,
): Record<string, T> {
  return { [resolveLogicalKey(key)]: value }
}
