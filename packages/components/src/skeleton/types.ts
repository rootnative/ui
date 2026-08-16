import type { DimensionValue, ViewProps } from 'react-native'

export type SkeletonShape = 'rounded' | 'circle' | 'rectangle'

export interface SkeletonProps extends Omit<ViewProps, 'children'> {
  /**
   * Block width, in dp or as a percentage of the parent.
   * @default '100%'
   */
  width?: DimensionValue
  /**
   * Block height, in dp or as a percentage of the parent.
   * @default 16
   */
  height?: DimensionValue
  /**
   * Corner treatment. `'rounded'` uses `theme.shape.cornerSmall`,
   * `'circle'` uses `theme.shape.cornerFull` (pass an equal `width` and
   * `height` for a true circle), `'rectangle'` uses square corners.
   * @default 'rounded'
   */
  shape?: SkeletonShape
  /**
   * Override the block color.
   * @default theme.colors.surfaceContainerHighest
   */
  containerColor?: string
  /**
   * Run the opacity pulse. Set `false` for a static block — for example
   * when many skeletons render at once and one pulse is enough.
   * @default true
   */
  animated?: boolean
}
