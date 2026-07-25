import { useTheme } from '@rootnative/core'
import { useMemo } from 'react'
import { View } from 'react-native'
import {
  DIVIDER_LIST_INSET,
  DIVIDER_THICKNESS,
  createDividerStyles,
} from './styles'
import type { DividerProps } from './types'

function resolveInset(inset: boolean | number): number {
  if (inset === true) return DIVIDER_LIST_INSET
  if (typeof inset === 'number') return inset
  return 0
}

export function Divider({
  orientation = 'horizontal',
  inset = false,
  insetEnd = false,
  thickness = DIVIDER_THICKNESS,
  containerColor,
  style,
  ...props
}: DividerProps) {
  const theme = useTheme()
  const startInset = resolveInset(inset)
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

  return <View {...props} style={[styles[orientation], style]} />
}
