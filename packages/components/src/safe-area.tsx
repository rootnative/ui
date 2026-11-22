import { swapsLeftAndRight } from '@rootnative/utils'
import { useContext, useMemo } from 'react'
import type { ComponentProps, ComponentType, ReactNode } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import type { ViewProps } from 'react-native'
import {
  SafeAreaInsetsContext,
  SafeAreaProvider,
  SafeAreaView as SafeAreaViewImpl,
  initialWindowMetrics,
} from 'react-native-safe-area-context'
import type { EdgeInsets } from 'react-native-safe-area-context'

declare const __DEV__: boolean

type Edge = 'top' | 'right' | 'bottom' | 'left'

// Extends `ViewProps` because both possible underlying components accept them:
// the real `SafeAreaView` spreads its rest onto a `View`, and the fallback *is*
// a `View`. Declaring only `edges`/`style`/`children` made ordinary View props
// (`pointerEvents`, `testID`, accessibility props) type-errors at call sites.
interface SafeAreaViewProps extends ViewProps {
  edges?: Edge[]
  ref?: ComponentProps<typeof View>['ref']
}

// The import above is **static on purpose**. A lazy `require()` in a try/catch
// is the natural shape for an optional peer, but it does not survive the build:
// `splitting: true` makes esbuild compile through an ESM intermediate, where
// `require` does not exist, so a literal `require('x')` becomes an indirect
// `__require.call(void 0, 'x')`. Metro builds its module graph by scanning for
// literal `require('...')` / `import` statements, so that call is invisible to
// it — the module never enters the graph, the require throws, and the catch
// below reported the package as missing while it was installed. Every `Layout`
// and `AppBar` silently lost its safe-area insets that way.
//
// A static import is what Metro can see. The package stays in tsup's `external`
// list, so it is resolved by the consumer rather than inlined.
const NativeSafeAreaView: ComponentType<SafeAreaViewProps> =
  (SafeAreaViewImpl as unknown as ComponentType<SafeAreaViewProps>) ??
  (View as unknown as ComponentType<SafeAreaViewProps>)

const ALL_EDGES: Edge[] = ['top', 'right', 'bottom', 'left']

type SideEdge = 'left' | 'right'
const UNSWAPPED_SIDES: readonly [SideEdge, SideEdge] = ['left', 'right']
const SWAPPED_SIDES: readonly [SideEdge, SideEdge] = ['right', 'left']

/**
 * The physical edges that a `...Left` and a `...Right` style key land on, in
 * that order. The safe-area insets are physical, but in RTL React Native
 * applies `paddingLeft` and `marginLeft` to the start edge, which is the
 * right side, while `I18nManager.doLeftAndRightSwapInRTL` is on (the default
 * on iOS and Android). With a cutout on one side only, as on Android, an
 * unswapped inset pads the side without the cutout. On the web it depends on
 * the runtime: see `swapsLeftAndRight`.
 */
export function sideEdgesOfStyleKeys(): readonly [SideEdge, SideEdge] {
  return swapsLeftAndRight() ? SWAPPED_SIDES : UNSWAPPED_SIDES
}

/**
 * The style that puts an absolutely positioned view at a physical distance
 * from the left edge of its parent, such as a position measured with
 * `measureInWindow`. Where React Native applies `left` to the right side (see
 * `sideEdgesOfStyleKeys`), the distance goes into `right`.
 */
export function physicalLeftStyle(
  left: number,
): { left: number } | { right: number } {
  return sideEdgesOfStyleKeys()[0] === 'left' ? { left } : { right: left }
}

// The same additive maths as the package's own `SafeAreaView.web`: each
// requested edge adds its inset to the padding the style already carries.
function insetPaddingStyle(
  insets: EdgeInsets,
  edges: Edge[],
  style: ViewProps['style'],
) {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>
  const num = (value: unknown, fallback: number) =>
    typeof value === 'number' ? value : fallback
  const padding = num(flat.padding, 0)
  const paddingVertical = num(flat.paddingVertical, padding)
  const paddingHorizontal = num(flat.paddingHorizontal, padding)
  const has = (edge: Edge) => edges.includes(edge)
  const [leftKeyEdge, rightKeyEdge] = sideEdgesOfStyleKeys()

  return {
    paddingTop:
      num(flat.paddingTop, paddingVertical) + (has('top') ? insets.top : 0),
    paddingRight:
      num(flat.paddingRight, paddingHorizontal) +
      (has(rightKeyEdge) ? insets[rightKeyEdge] : 0),
    paddingBottom:
      num(flat.paddingBottom, paddingVertical) +
      (has('bottom') ? insets.bottom : 0),
    paddingLeft:
      num(flat.paddingLeft, paddingHorizontal) +
      (has(leftKeyEdge) ? insets[leftKeyEdge] : 0),
  }
}

let warnedSidesWithoutProvider = false

/** @internal — test-only hook to reset the warning below. */
export function __resetSafeAreaWarningForTests(): void {
  warnedSidesWithoutProvider = false
}

// The native `SafeAreaView` takes the padding of each side from the inset of
// that side, and Fabric then moves a left padding to the right in RTL while
// `doLeftAndRightSwapInRTL` is on. So outside a provider, the inset of a
// cutout on one side pads the other side, whatever `edges` says. `PortalHost`
// adds a provider at the app root (see `SafeAreaRoot`). This warns when a
// `SafeAreaView` is outside it anyway. The guard mirrors `internal/warnOnce`:
// this file is copied without `internal/` into each consuming component.
function warnIfSidesLandWrong(edges: Edge[]) {
  if (!__DEV__ || warnedSidesWithoutProvider) return
  if (sideEdgesOfStyleKeys()[0] === 'left') return
  if (!edges.includes('left') && !edges.includes('right')) return
  warnedSidesWithoutProvider = true
  console.error(
    '[@rootnative/components] A SafeAreaView has no SafeAreaProvider above ' +
      'it. In RTL, React Native puts its side insets on the wrong side. ' +
      'Mount <PortalHost> at the app root, or wrap the app in a ' +
      'SafeAreaProvider.',
  )
}

/**
 * Gives the app a `SafeAreaProvider` on iOS and Android when it has none, so
 * that every `SafeAreaView` pads from context and puts each side inset on the
 * correct side in RTL. `PortalHost` renders it at the app root. Expo Router
 * adds a provider of its own, and then this adds nothing.
 *
 * Two cases keep the native fallback: the web, where the provider renders
 * nothing until it measures, so a server-rendered page would be empty; and a
 * native app with no initial metrics, where the provider would render nothing
 * for one frame.
 */
export function SafeAreaRoot({ children }: { children?: ReactNode }) {
  const insets = useContext(SafeAreaInsetsContext)
  if (insets || Platform.OS === 'web' || !initialWindowMetrics) {
    return <>{children}</>
  }
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      {children}
    </SafeAreaProvider>
  )
}

// Inside a `SafeAreaProvider`, the insets come from context and are correct on
// the first render. The native `SafeAreaView` measures itself instead, and on
// a `transparentModal` route from react-native-screens that measurement is 0
// until the next prop change — the bar sat under the status bar until a theme
// switch re-rendered it. Without a provider the native view is still the only
// source, so it stays as the fallback.
//
// On web the package has no native view. Its `SafeAreaView.web` calls
// `useSafeAreaInsets()`, which throws without a provider, so the documented
// provider-free root was a blank page on web. A browser has no insets to
// measure outside a provider, so a plain `View` with zero insets is the
// correct fallback there.
function SafeAreaView({ edges, style, ...rest }: SafeAreaViewProps) {
  const insets = useContext(SafeAreaInsetsContext)
  const paddedStyle = useMemo(
    () =>
      insets
        ? [style, insetPaddingStyle(insets, edges ?? ALL_EDGES, style)]
        : style,
    [insets, edges, style],
  )

  if (!insets) {
    if (Platform.OS === 'web') {
      return <View {...rest} style={style} />
    }
    warnIfSidesLandWrong(edges ?? ALL_EDGES)
    return <NativeSafeAreaView edges={edges} style={style} {...rest} />
  }

  return <View {...rest} style={paddedStyle} />
}

export type { Edge }
export { SafeAreaView }
