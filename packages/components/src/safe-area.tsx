import type { ComponentType } from 'react'
import type { ViewProps } from 'react-native'
import { View } from 'react-native'

type Edge = 'top' | 'right' | 'bottom' | 'left'

// Extends `ViewProps` because both possible underlying components accept them:
// the real `SafeAreaView` spreads its rest onto a `View`, and the fallback *is*
// a `View`. Declaring only `edges`/`style`/`children` made ordinary View props
// (`pointerEvents`, `testID`, accessibility props) type-errors at call sites.
interface SafeAreaViewProps extends ViewProps {
  edges?: Edge[]
}

let SafeAreaViewComponent: ComponentType<SafeAreaViewProps> =
  View as unknown as ComponentType<SafeAreaViewProps>

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const safeArea = require('react-native-safe-area-context')
  SafeAreaViewComponent = safeArea.SafeAreaView
} catch {
  console.warn(
    '[@rootnative/components] "react-native-safe-area-context" is not installed. ' +
      'Layout and AppBar will render without safe area insets. ' +
      'Run `npx expo install react-native-safe-area-context` to fix this.',
  )
}

export type { Edge }
export { SafeAreaViewComponent as SafeAreaView }
