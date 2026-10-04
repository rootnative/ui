import { breakpoints } from '@rootnative/core'
import { useMemo } from 'react'
import type { ViewStyle } from 'react-native'
import { Column } from './Column'
import type { ContainerProps } from './types'

/**
 * A centred column with a maximum width. Below that width it fills its parent,
 * so a phone sees no change. Use it as the one child of a ScrollView, with the
 * screen padding on it, so every screen shares one content column.
 */
export function Container({
  width = 'medium',
  style,
  ...columnProps
}: ContainerProps) {
  const widthStyle = useMemo<ViewStyle>(
    () => ({
      width: '100%',
      maxWidth: breakpoints[width],
      alignSelf: 'center',
    }),
    [width],
  )

  return <Column {...columnProps} style={[widthStyle, style]} />
}
