import type { MaterialTheme } from '@rootnative/core'
import type { FlexAlignType, ViewProps } from 'react-native'

/** A theme spacing token name or a raw numeric value in dp. */
export type SpacingValue = keyof MaterialTheme['spacing'] | number

export interface BoxProps extends ViewProps {
  /** Padding on all sides */
  p?: SpacingValue
  /** Horizontal padding (paddingStart + paddingEnd) */
  px?: SpacingValue
  /** Vertical padding (paddingTop + paddingBottom) */
  py?: SpacingValue
  /** Padding top */
  pt?: SpacingValue
  /** Padding bottom */
  pb?: SpacingValue
  /** Padding start (left in LTR, right in RTL) */
  ps?: SpacingValue
  /** Padding end (right in LTR, left in RTL) */
  pe?: SpacingValue
  /** Margin on all sides */
  m?: SpacingValue
  /** Horizontal margin (marginStart + marginEnd) */
  mx?: SpacingValue
  /** Vertical margin (marginTop + marginBottom) */
  my?: SpacingValue
  /** Margin top */
  mt?: SpacingValue
  /** Margin bottom */
  mb?: SpacingValue
  /** Margin start */
  ms?: SpacingValue
  /** Margin end */
  me?: SpacingValue
  /** Gap between children */
  gap?: SpacingValue
  /** Row gap between children */
  rowGap?: SpacingValue
  /** Column gap between children */
  columnGap?: SpacingValue
  /** Flex value */
  flex?: number
  /** Align items along the cross axis */
  align?: FlexAlignType
  /** Justify content along the main axis */
  justify?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
  /** Background color */
  bg?: string
}

export interface RowProps extends BoxProps {
  /**
   * Whether children should wrap to the next line when they overflow.
   * @default false
   */
  wrap?: boolean
  /**
   * Reverses the layout direction (`row-reverse`).
   * @default false
   */
  inverted?: boolean
}

export interface ColumnProps extends BoxProps {
  /**
   * Reverses the layout direction (`column-reverse`).
   * @default false
   */
  inverted?: boolean
}

export interface GridProps extends RowProps {
  /** Number of equal-width columns. */
  columns: number
}
