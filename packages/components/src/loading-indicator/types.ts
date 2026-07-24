import type { StyleProp, ViewProps, ViewStyle } from 'react-native'

export interface LoadingIndicatorProps extends Omit<ViewProps, 'children'> {
  /**
   * Determinate progress from 0 to 1. When omitted, the indicator runs the
   * indeterminate shape-morph cycle. In determinate mode the polygon morphs
   * from a circle toward the soft-burst shape as progress advances.
   */
  progress?: number
  /**
   * When `true`, renders the morphing polygon on a filled circular container
   * (MD3 `ContainedLoadingIndicator`). When `false` (default) the container
   * is transparent.
   * @default false
   */
  contained?: boolean
  /**
   * Diameter of the container in dp. The morphing polygon fills ~79% of it,
   * matching the MD3 38dp-active / 48dp-container ratio.
   * @default 48
   */
  size?: number
  /**
   * Override the morphing-indicator color. Defaults to `primary`
   * (uncontained) or `onPrimaryContainer` (contained).
   */
  indicatorColor?: string
  /**
   * Override the container fill color (contained variant only). Defaults to
   * `primaryContainer`.
   */
  containerColor?: string
  /** Root container style. */
  style?: StyleProp<ViewStyle>
  /** Accessibility label announced for the busy/progress state. */
  accessibilityLabel?: string
}
