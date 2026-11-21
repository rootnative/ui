import { resolveLogicalKey } from '@rootnative/utils'
import { useMemo } from 'react'
import { Text } from 'react-native'
import { useMaterialTheme } from '../internal/useMaterialTheme'
import { createListStyles, sideInsetStyle } from './styles'
import type { ListHeadlineProps } from './types'

export function ListHeadline({
  children,
  headingLevel = 2,
  style,
  ...props
}: ListHeadlineProps) {
  const theme = useMaterialTheme()
  const styles = useMemo(() => createListStyles(theme), [theme])
  // Keys resolved on each render, not in a memo, so the padding follows a
  // runtime change of the document `dir` on the web.
  const startKey = resolveLogicalKey('paddingStart')
  const endKey = resolveLogicalKey('paddingEnd')
  const inset = useMemo(
    () => sideInsetStyle(theme, startKey, endKey),
    [theme, startKey, endKey],
  )
  const resolvedStyle = useMemo(
    () => [styles.headline, inset, style],
    [styles.headline, inset, style],
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
