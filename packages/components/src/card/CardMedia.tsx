import { useTheme } from '@rootnative/core'
import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  useMemo,
} from 'react'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { createCardRegionStyles } from './styles'
import type { CardMediaProps } from './types'

/**
 * Puts the absolute fill before the child's own style. A flex child is not
 * sufficient: a column stretches it across the width only, and a network
 * `Image` has no height of its own. An explicit `width` or `height` on the
 * child still wins over the insets.
 */
function fillSlot(child: ReactNode): ReactNode {
  if (!isValidElement<{ style?: StyleProp<ViewStyle> }>(child)) return child
  if (child.type === Fragment) return child
  return cloneElement(child, {
    style: [StyleSheet.absoluteFill, child.props.style],
  })
}

/**
 * Edge-to-edge media region of a card.
 *
 * Carries no padding and no radius: the parent `Card` container already clips
 * (`overflow: 'hidden'`) and rounds its corners, so the media inherits both.
 * The slot does not own the image — any child works (`Image`, `expo-image`, a
 * video surface). In a sized slot, each child fills the slot, and the
 * children stack in order.
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
      {isSized ? Children.map(children, fillSlot) : children}
    </View>
  )
}
