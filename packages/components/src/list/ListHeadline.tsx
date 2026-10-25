import { useTheme } from '@rootnative/core'
import { useMemo } from 'react'
import { Text } from 'react-native'
import { createListStyles } from './styles'
import type { ListHeadlineProps } from './types'

export function ListHeadline({
  children,
  headingLevel = 2,
  style,
  ...props
}: ListHeadlineProps) {
  const theme = useTheme()
  const styles = useMemo(() => createListStyles(theme), [theme])
  const resolvedStyle = useMemo(
    () => [styles.headline, style],
    [styles.headline, style],
  )

  return (
    <Text
      {...props}
      style={resolvedStyle}
      role="heading"
      // react-native-web writes a level-less heading as `<h1>`, one per
      // list. React Native has no `aria-level`, so it is web-only.
      aria-level={headingLevel}
    >
      {children}
    </Text>
  )
}
