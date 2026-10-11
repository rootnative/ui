import { useTheme } from '@rootnative/core'
import { useMemo } from 'react'
import { Text, View } from 'react-native'
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
  const theme = useTheme()
  const styles = useMemo(() => createListStyles(theme), [theme])
  const resolvedHeadlineStyle = useMemo(
    () => [styles.headline, headlineStyle],
    [styles.headline, headlineStyle],
  )

  return (
    <View {...props} style={[styles.container, style]}>
      {headline !== undefined ? (
        <Text
          style={resolvedHeadlineStyle}
          role="heading"
          // react-native-web writes a level-less heading as `<h1>`, one per
          // list. React Native has no `aria-level`, so it is web-only.
          aria-level={headingLevel}
        >
          {headline}
        </Text>
      ) : null}
      {children}
    </View>
  )
}
