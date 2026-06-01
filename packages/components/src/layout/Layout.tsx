import { useTheme } from '@rootnative/core'
import { useMemo } from 'react'
import type { PropsWithChildren } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from '../safe-area'
import type { Edge } from '../safe-area'

export interface LayoutProps extends PropsWithChildren {
  /**
   * When `true`, removes all safe area insets for full-screen layout.
   * @default false
   */
  immersive?: boolean
  /** Explicit set of safe-area edges to apply. Overrides `immersive` when provided. */
  edges?: Edge[]
  /** Additional styles applied to the SafeAreaView container. */
  style?: StyleProp<ViewStyle>
}

const defaultEdges: Edge[] = ['bottom']

function resolveEdges(immersive?: boolean, edges?: Edge[]): Edge[] {
  if (edges) {
    return edges
  }

  if (immersive) {
    return []
  }

  return defaultEdges
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
})

function removeBackgroundColor(style?: StyleProp<ViewStyle>) {
  if (!style) {
    return undefined
  }

  const flattenedStyle = StyleSheet.flatten(style)

  if (!flattenedStyle || flattenedStyle.backgroundColor === undefined) {
    return style
  }

  const styleWithoutBackground = { ...flattenedStyle }
  delete styleWithoutBackground.backgroundColor

  return styleWithoutBackground
}

export function Layout({ immersive, edges, children, style }: LayoutProps) {
  const theme = useTheme()
  const themeBackgroundStyle = useMemo(
    () => ({ backgroundColor: theme.colors.background }),
    [theme.colors.background],
  )
  const styleWithoutBackground = useMemo(
    () => removeBackgroundColor(style),
    [style],
  )
  const safeAreaEdges = useMemo(
    () => resolveEdges(immersive, edges),
    [immersive, edges],
  )

  return (
    <SafeAreaView
      style={[styles.root, themeBackgroundStyle, styleWithoutBackground]}
      edges={safeAreaEdges}
    >
      {children}
    </SafeAreaView>
  )
}
