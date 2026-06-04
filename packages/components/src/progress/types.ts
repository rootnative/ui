import type { ViewProps } from 'react-native'

export interface LinearProgressProps extends Omit<ViewProps, 'children'> {
  /**
   * Progress value from 0 to 1. When omitted, the indicator shows the
   * indeterminate animation.
   */
  progress?: number
  /**
   * Override the active track / indicator color.
   */
  containerColor?: string
  /**
   * Override the inactive track color.
   */
  trackColor?: string
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
}

export interface CircularProgressProps extends Omit<ViewProps, 'children'> {
  /**
   * Progress value from 0 to 1. When omitted, the indicator shows the
   * indeterminate animation.
   */
  progress?: number
  /**
   * Override the active track / indicator color.
   */
  containerColor?: string
  /**
   * Override the inactive track color.
   */
  trackColor?: string
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
}
