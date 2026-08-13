import type { ComponentType } from 'react'
import type { ViewProps } from 'react-native'
import { View } from 'react-native'
import { SafeAreaView as SafeAreaViewImpl } from 'react-native-safe-area-context'

type Edge = 'top' | 'right' | 'bottom' | 'left'

// Extends `ViewProps` because both possible underlying components accept them:
// the real `SafeAreaView` spreads its rest onto a `View`, and the fallback *is*
// a `View`. Declaring only `edges`/`style`/`children` made ordinary View props
// (`pointerEvents`, `testID`, accessibility props) type-errors at call sites.
interface SafeAreaViewProps extends ViewProps {
  edges?: Edge[]
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
const SafeAreaViewComponent: ComponentType<SafeAreaViewProps> =
  (SafeAreaViewImpl as unknown as ComponentType<SafeAreaViewProps>) ??
  (View as unknown as ComponentType<SafeAreaViewProps>)

export type { Edge }
export { SafeAreaViewComponent as SafeAreaView }
