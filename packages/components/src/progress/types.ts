import type { ViewProps } from 'react-native'

export interface LinearProgressProps extends Omit<ViewProps, 'children'> {
  /**
   * Progress value from 0 to 1. When omitted, the indicator shows the
   * indeterminate animation.
   */
  progress?: number
  /**
   * Override the inactive track color — the indicator's container.
   * @default theme.colors.secondaryContainer
   */
  containerColor?: string
  /**
   * Override the active indicator color.
   * @default theme.colors.primary
   */
  contentColor?: string
  /**
   * Track / indicator thickness in dp.
   * @default 4
   */
  thickness?: number
  /**
   * Show the trailing stop indicator dot. Only applies in determinate mode
   * and is hidden when `progress` reaches 1.
   * @default true
   */
  stopIndicator?: boolean
  /**
   * Draw the active indicator as a travelling wave (MD3 Expressive). The
   * wave is flat below 10% and above 95%, and the inactive track stays flat.
   * The wavy bar is 6dp taller than `thickness`.
   * @default false
   */
  wavy?: boolean
}

export interface CircularProgressProps extends Omit<ViewProps, 'children'> {
  /**
   * Progress value from 0 to 1. When omitted, the indicator shows the
   * indeterminate animation.
   */
  progress?: number
  /**
   * Override the inactive track color — the indicator's container.
   * @default theme.colors.secondaryContainer
   */
  containerColor?: string
  /**
   * Override the active indicator color.
   * @default theme.colors.primary
   */
  contentColor?: string
  /**
   * Outer diameter in dp.
   * @default 48
   */
  size?: number
  /**
   * Stroke thickness in dp.
   * @default 4
   */
  thickness?: number
  /**
   * Draw the active arc as a travelling wave (MD3 Expressive). The wave is
   * flat below 10% and above 95%, and the inactive track stays flat. The
   * wave sits inside `size`, so the ring radius shrinks by 2dp.
   * @default false
   */
  wavy?: boolean
}
