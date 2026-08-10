import { useTheme } from '@rootnative/core'
import { useMemo } from 'react'
import { View } from 'react-native'
import { createCardRegionStyles } from './styles'
import type { CardMediaProps } from './types'

/**
 * Edge-to-edge media region of a card.
 *
 * Carries no padding and no radius: the parent `Card` container already clips
 * (`overflow: 'hidden'`) and rounds its corners, so the media inherits both.
 * The slot does not own the image — any child works (`Image`, `expo-image`, a
 * video surface), and children are stretched to fill it.
 */
export function CardMedia({
  children,
  height,
  aspectRatio,
  style,
  ...props
}: CardMediaProps) {
  const theme = useTheme()
  const styles = useMemo(() => createCardRegionStyles(theme), [theme])

  // `height` wins over `aspectRatio`: a fixed height and a ratio together are
  // contradictory, and honoring both would let the ratio silently lose anyway.
  const sizeStyle = useMemo(() => {
    if (height !== undefined) return { height }
    if (aspectRatio !== undefined) return { aspectRatio }
    return undefined
  }, [height, aspectRatio])

  // Only stretch children when this slot has a size of its own. Without one,
  // the media *is* the height source, so an absolute fill would collapse it.
  const isSized = sizeStyle !== undefined

  return (
    <View {...props} style={[styles.media, sizeStyle, style]}>
      {isSized ? (
        <View pointerEvents="box-none" style={styles.mediaFill}>
          {children}
        </View>
      ) : (
        children
      )}
    </View>
  )
}
