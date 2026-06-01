import type { MaterialTheme } from '@rootnative/core'
import { StyleSheet } from 'react-native'

export function createStyles(theme: MaterialTheme) {
  return StyleSheet.create({
    base: {
      color: theme.colors.onSurface,
    },
  })
}
