import type { MaterialTheme } from '@rootnative/core'
import { StyleSheet } from 'react-native'
import type { SkeletonShape } from './types'

// One bodyMedium text line is 16dp tall, so a bare <Skeleton /> stands in
// for a single line of text.
export const SKELETON_DEFAULT_HEIGHT = 16

// Dim endpoint of the pulse. A component constant, like the progress loop
// timings — MD3 defines no token for it.
export const SKELETON_PULSE_MIN_OPACITY = 0.4

export function createSkeletonStyles(
  theme: MaterialTheme,
  shape: SkeletonShape,
  containerColor?: string,
) {
  const radius =
    shape === 'circle'
      ? theme.shape.cornerFull
      : shape === 'rectangle'
        ? theme.shape.cornerNone
        : theme.shape.cornerSmall

  return StyleSheet.create({
    root: {
      backgroundColor: containerColor ?? theme.colors.surfaceContainerHighest,
      borderRadius: radius,
    },
  })
}
