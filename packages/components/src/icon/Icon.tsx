import { useIconResolver, useTheme } from '@rootnative/core'
import { renderIcon } from '@rootnative/utils'
import { useMemo } from 'react'
import { View } from 'react-native'
import { ICON_SIZE, createIconStyles } from './styles'
import type { IconProps } from './types'

/**
 * Renders an `IconSource` through the theme's `iconResolver`, the same way
 * every other component renders its icons. Use it in a custom control so the
 * icon set and the color stay consistent with the library.
 */
export function Icon({
  source,
  size = ICON_SIZE,
  color,
  accessibilityLabel,
  style,
  ...rest
}: IconProps) {
  const theme = useTheme()
  const resolver = useIconResolver()
  const styles = useMemo(() => createIconStyles(size), [size])
  const resolvedColor = color ?? theme.colors.onSurface
  const iconProps = useMemo(
    () => ({ size, color: resolvedColor }),
    [size, resolvedColor],
  )
  const node = renderIcon(source, iconProps, resolver)
  const labelled = accessibilityLabel !== undefined

  // The glyph always sits under an `aria-hidden` node: the default resolver
  // renders a private-use codepoint in a `Text`, which React Native would
  // otherwise merge into an accessible ancestor's name. A labelled icon
  // exposes the outer box as an image with that label instead.
  return (
    <View
      {...rest}
      style={[styles.box, style]}
      role={labelled ? 'img' : undefined}
      accessible={labelled ? true : undefined}
      accessibilityLabel={accessibilityLabel}
      aria-hidden={labelled ? undefined : true}
    >
      {labelled ? <View aria-hidden>{node}</View> : node}
    </View>
  )
}
