import { StyleSheet } from 'react-native'

/** MD3 default icon size. Source: every `IconSize` token is 24.dp. */
export const ICON_SIZE = 24

export function createIconStyles(size: number) {
  return StyleSheet.create({
    box: {
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
}
