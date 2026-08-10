import { useTheme } from '@rootnative/core'
import { useMemo } from 'react'
import { View } from 'react-native'
import { createCardRegionStyles } from './styles'
import type { CardContentProps } from './types'

/**
 * Padded text region of a card — the MD3 16dp content block.
 *
 * This is the region that every consumer used to hand-roll, so it owns the
 * padding and a small gap between children. A title/body pair needs no wrapper
 * of its own.
 */
export function CardContent({ children, style, ...props }: CardContentProps) {
  const theme = useTheme()
  const styles = useMemo(() => createCardRegionStyles(theme), [theme])

  return (
    <View {...props} style={[styles.content, style]}>
      {children}
    </View>
  )
}
