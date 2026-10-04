import { useTheme } from '@rootnative/core'
import { useMemo } from 'react'
import { Text, View } from 'react-native'
import { useNavigationDrawerContext } from './context'
import { createNavigationDrawerSectionStyles } from './styles'
import type { NavigationDrawerSectionProps } from './types'

/**
 * A group of destinations with an optional `titleSmall` headline.
 */
export function NavigationDrawerSection({
  headline,
  headingLevel = 2,
  children,
  headlineStyle,
  style,
  ...rest
}: NavigationDrawerSectionProps) {
  const { colors } = useNavigationDrawerContext('NavigationDrawer.Section')
  const theme = useTheme()
  const styles = useMemo(
    () => createNavigationDrawerSectionStyles(theme, colors),
    [theme, colors],
  )
  const resolvedHeadlineStyle = useMemo(
    () => [styles.headline, headlineStyle],
    [styles.headline, headlineStyle],
  )

  return (
    <View {...rest} style={style}>
      {headline !== undefined ? (
        <Text
          style={resolvedHeadlineStyle}
          role="heading"
          // react-native-web writes a level-less heading as `<h1>`, one per
          // section. React Native has no `aria-level`, so it is web-only.
          aria-level={headingLevel}
          numberOfLines={1}
        >
          {headline}
        </Text>
      ) : null}
      {children}
    </View>
  )
}
