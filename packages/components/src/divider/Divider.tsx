import { resolveLogicalKey } from '@rootnative/utils'
import { useMemo } from 'react'
import { View } from 'react-native'
import { useMaterialTheme } from '../internal/useMaterialTheme'
import {
  DIVIDER_LIST_INSET,
  DIVIDER_THICKNESS,
  createDividerStyles,
  horizontalInsetStyle,
} from './styles'
import type { DividerProps } from './types'

function resolveInset(inset: boolean | number): number {
  if (inset === true) return DIVIDER_LIST_INSET
  if (typeof inset === 'number') return inset
  return 0
}

export function Divider({
  orientation = 'horizontal',
  insetStart = false,
  insetEnd = false,
  thickness = DIVIDER_THICKNESS,
  containerColor,
  style,
  ...props
}: DividerProps) {
  const theme = useMaterialTheme()
  const startInset = resolveInset(insetStart)
  const endInset = resolveInset(insetEnd)

  const styles = useMemo(
    () =>
      createDividerStyles(
        theme,
        startInset,
        endInset,
        thickness,
        containerColor,
      ),
    [theme, startInset, endInset, thickness, containerColor],
  )

  // Keys resolved on each render, not in a memo, so the insets follow a
  // runtime change of the document `dir` on the web.
  const startKey = resolveLogicalKey('marginStart')
  const endKey = resolveLogicalKey('marginEnd')
  const insetStyle = useMemo(
    () =>
      orientation === 'horizontal'
        ? horizontalInsetStyle(startKey, endKey, startInset, endInset)
        : undefined,
    [orientation, startKey, endKey, startInset, endInset],
  )

  return <View {...props} style={[styles[orientation], insetStyle, style]} />
}
