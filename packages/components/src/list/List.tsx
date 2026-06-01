import { useTheme } from '@rootnative/core'
import { useMemo } from 'react'
import { View } from 'react-native'
import { createListStyles } from './styles'
import type { ListProps } from './types'

export function List({ children, style, ...props }: ListProps) {
  const theme = useTheme()
  const styles = useMemo(() => createListStyles(theme), [theme])

  return (
    <View {...props} style={[styles.container, style]}>
      {children}
    </View>
  )
}
