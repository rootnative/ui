import { useTheme } from '@rootnative/core'
import { useMemo } from 'react'
import { View } from 'react-native'
import { createDividerStyles } from './styles'
import type { ListDividerProps } from './types'

export function ListDivider({
  inset = false,
  style,
  ...props
}: ListDividerProps) {
  const theme = useTheme()
  const styles = useMemo(
    () => createDividerStyles(theme, inset),
    [theme, inset],
  )

  return <View {...props} style={[styles.divider, style]} />
}
