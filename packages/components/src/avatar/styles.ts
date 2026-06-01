import type { MaterialTheme } from '@rootnative/core'
import { StyleSheet } from 'react-native'

export function createStyles(theme: MaterialTheme) {
  return StyleSheet.create({
    container: {
      borderRadius: theme.shape.cornerFull,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    interactive: {
      cursor: 'pointer',
    },
    sizeXSmall: { width: 24, height: 24 },
    sizeSmall: { width: 32, height: 32 },
    sizeMedium: { width: 40, height: 40 },
    sizeLarge: { width: 56, height: 56 },
    sizeXLarge: { width: 112, height: 112 },
    image: {
      width: '100%',
      height: '100%',
    },
  })
}
