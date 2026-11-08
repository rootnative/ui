import { useTheme } from '@rootnative/core'
import { useMemo } from 'react'
import type { PropsWithChildren } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from '../safe-area'
import type { Edge } from '../safe-area'
import { LayoutEdgesContext } from './edgesContext'

export interface LayoutProps extends PropsWithChildren {
  /**
   * When `true`, removes all safe area insets for full-screen layout.
   * @default false
   */
  immersive?: boolean
  /**
   * Explicit set of safe-area edges to apply. Overrides `immersive` when
   * provided. The top edge is left out by default, because `AppBar` usually
   * owns the top inset — pass `['top', 'left', 'right', 'bottom']` on a
   * screen with no AppBar, or a title placed under the status bar will be
   * clipped. The side edges are in the default: they are 0 in portrait, and
   * in landscape they keep the content clear of the notch or the Dynamic
   * Island.
   * @default ['left', 'right', 'bottom']
   */
  edges?: Edge[]
  /**
   * Additional styles applied to the SafeAreaView container. `Layout` always
   * paints `theme.colors.background` and drops `backgroundColor` from this
   * style. To draw a different background, nest a `Box` or a `View` inside it.
   */
  style?: StyleProp<ViewStyle>
}

const defaultEdges: Edge[] = ['left', 'right', 'bottom']

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
      <LayoutEdgesContext.Provider value={safeAreaEdges}>
        {children}
      </LayoutEdgesContext.Provider>
    </SafeAreaView>
  )
}
