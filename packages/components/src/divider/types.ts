import type { StyleProp, ViewProps, ViewStyle } from 'react-native'

/** Axis the divider is drawn along. */
export type DividerOrientation = 'horizontal' | 'vertical'

export interface DividerProps extends ViewProps {
  /**
   * Axis the divider is drawn along. A vertical divider stretches to the
   * height of its parent, so it must sit inside a row-direction container.
   * @default 'horizontal'
   */
  orientation?: DividerOrientation
  /**
   * Inset from the leading edge (start for horizontal, top for vertical).
   * `true` applies the MD3 list inset (56dp), which aligns the divider with
   * list text that follows a leading icon. A number sets the inset in dp.
   * @default false
   */
  inset?: boolean | number
  /**
   * Inset from the trailing edge (end for horizontal, bottom for vertical).
   * Same units as `inset`.
   * @default false
   */
  insetEnd?: boolean | number
  /**
   * Line thickness in dp.
   * @default 1
   */
  thickness?: number
  /**
   * Override the line color.
   * @default theme.colors.outlineVariant
   */
  containerColor?: string
  style?: StyleProp<ViewStyle>
}
