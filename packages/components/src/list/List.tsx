import { useMemo } from 'react'
import { View } from 'react-native'
import { useMaterialTheme } from '../internal/useMaterialTheme'
import { ListHeadline } from './ListHeadline'
import { createListStyles } from './styles'
import type { ListProps } from './types'

export function List({
  children,
  headline,
  headingLevel = 2,
  headlineStyle,
  style,
  ...props
}: ListProps) {
  const theme = useMaterialTheme()
  const styles = useMemo(() => createListStyles(theme), [theme])

  return (
    <View {...props} style={[styles.container, style]}>
      {headline !== undefined ? (
        <ListHeadline headingLevel={headingLevel} style={headlineStyle}>
          {headline}
        </ListHeadline>
      ) : null}
      {children}
    </View>
  )
}

List.Headline = ListHeadline
