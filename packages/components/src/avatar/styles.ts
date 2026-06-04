import type { MaterialTheme } from '@rootnative/core'
import { StyleSheet } from 'react-native'

export const AVATAR_FOCUS_RING_OFFSET = 2
export const AVATAR_FOCUS_RING_WIDTH = 3

export function createStyles(theme: MaterialTheme) {
  const focusRingInset = -(AVATAR_FOCUS_RING_OFFSET + AVATAR_FOCUS_RING_WIDTH)

  return StyleSheet.create({
    container: {
      borderRadius: theme.shape.cornerFull,
      alignItems: 'center',
      justifyContent: 'center',
    },
    interactive: {
      cursor: 'pointer',
    },
    disabledContainer: {
      cursor: 'auto',
    },
    focusRing: {
      position: 'absolute' as const,
      top: focusRingInset,
      left: focusRingInset,
      right: focusRingInset,
      bottom: focusRingInset,
      borderRadius: theme.shape.cornerFull,
      borderWidth: AVATAR_FOCUS_RING_WIDTH,
      borderColor: theme.colors.secondary,
    },
    disabledContent: {
      opacity: theme.stateLayer.disabledOpacity,
    },
    sizeXSmall: { width: 24, height: 24 },
    sizeSmall: { width: 32, height: 32 },
    sizeMedium: { width: 40, height: 40 },
    sizeLarge: { width: 56, height: 56 },
    sizeXLarge: { width: 112, height: 112 },
    image: {
      width: '100%',
      height: '100%',
      // The container can't use `overflow: 'hidden'` (it would clip the
      // keyboard focus ring), so the image clips itself to the circle.
      borderRadius: theme.shape.cornerFull,
    },
  })
}
