import { useTheme } from '@rootnative/core'
import { useMemo } from 'react'
import { View } from 'react-native'
import { cardActionsJustify, createCardRegionStyles } from './styles'
import type { CardActionsProps } from './types'

/**
 * Action row of a card — buttons laid out horizontally.
 *
 * Defaults to the trailing edge per MD3, and uses logical padding so the row
 * mirrors correctly in RTL. `justifyContent` needs no mirroring of its own:
 * `flex-end` already follows the writing direction.
 */
export function CardActions({
  children,
  align = 'end',
  style,
  ...props
}: CardActionsProps) {
  const theme = useTheme()
  const styles = useMemo(() => createCardRegionStyles(theme), [theme])

  const alignStyle = useMemo(
    () => ({ justifyContent: cardActionsJustify(align) }),
    [align],
  )

  return (
    <View {...props} style={[styles.actions, alignStyle, style]}>
      {children}
    </View>
  )
}
