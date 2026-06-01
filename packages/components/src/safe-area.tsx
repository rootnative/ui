import type { ComponentType, ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'

type Edge = 'top' | 'right' | 'bottom' | 'left'

interface SafeAreaViewProps {
  edges?: Edge[]
  style?: StyleProp<ViewStyle>
  children?: ReactNode
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
